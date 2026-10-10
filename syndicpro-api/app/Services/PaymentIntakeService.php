<?php

namespace App\Services;

use App\Enums\AllocationMode;
use App\Enums\PaymentSource;
use App\Enums\PaymentStatus;
use App\Models\Due;
use App\Models\LotOwnership;
use App\Models\Owner;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Encaissement manuel (pas de passerelle) : le syndic saisit l'argent reçu,
 * il est ventilé sur les dus les plus anciens, avec double reçu ENC + PAY.
 */
class PaymentIntakeService
{
    public function __construct(private AllocationService $allocations) {}

    /**
     * Simulation sans écriture : ordre d'imputation du plus ancien au plus récent.
     *
     * @return array{lines: array, tendered: float, applied: float, credit: float, remaining_before: float, remaining_after: float}
     */
    public function preview(int $ownerId, int $residenceId, float $amount): array
    {
        $dues = $this->openDues($ownerId, $residenceId);
        $remaining = round($amount, 2);
        $lines = [];

        foreach ($dues as $due) {
            $open = round((float) $due->amount - (float) $due->amount_paid, 2);
            $applied = $remaining > 0 ? min($open, $remaining) : 0.0;
            $remaining = round($remaining - $applied, 2);
            $lines[] = $this->line($due, $applied, $open);
        }

        $before = $this->remainingInResidence($ownerId, $residenceId);
        $applied = round($amount - max($remaining, 0), 2);

        return [
            'lines' => $lines,
            'tendered' => round($amount, 2),
            'applied' => $applied,
            'credit' => round(max($remaining, 0), 2),
            'remaining_before' => $before,
            'remaining_after' => round($before - $applied, 2),
        ];
    }

    /**
     * Enregistre + ventile + numérote (ENC + PAY). Retourne le paiement et le détail.
     */
    public function record(array $data, User $user): array
    {
        $owner = Owner::findOrFail($data['owner_id']);
        $residenceId = (int) $data['residence_id'];

        $lotId = $data['lot_id'] ?? null;
        if ($lotId) {
            $belongs = LotOwnership::where('owner_id', $owner->id)
                ->where('lot_id', $lotId)
                ->whereHas('lot', fn ($q) => $q->where('residence_id', $residenceId))
                ->exists();
            if (! $belongs) {
                throw new \LogicException('Ce lot n’appartient pas à ce propriétaire dans cette résidence.');
            }
        } else {
            $lotId = LotOwnership::where('owner_id', $owner->id)
                ->whereNull('ended_on')
                ->whereHas('lot', fn ($q) => $q->where('residence_id', $residenceId))
                ->value('lot_id')
                ?? LotOwnership::where('owner_id', $owner->id)
                    ->whereHas('lot', fn ($q) => $q->where('residence_id', $residenceId))
                    ->value('lot_id');
        }

        if (! $lotId) {
            throw new \LogicException('Ce propriétaire n’a aucun lot dans cette résidence.');
        }

        return DB::transaction(function () use ($data, $user, $owner, $residenceId, $lotId) {
            $year = (int) date('Y', strtotime($data['paid_on']));
            // Photo de l'état avant ventilation ( Dus déjà chargés par allocate() ensuite).
            $before = collect($this->preview($owner->id, $residenceId, (float) $data['amount'])['lines'])
                ->keyBy('due_id');
            $payment = Payment::create([
                'residence_id' => $residenceId,
                'owner_id' => $owner->id,
                'lot_id' => $lotId,
                'paid_on' => $data['paid_on'],
                'method' => $data['method'],
                'document_number' => $data['document_number'] ?? null,
                'amount' => $data['amount'],
                'allocation_mode' => AllocationMode::Auto->value,
                'status' => PaymentStatus::Validated->value,
                'source' => PaymentSource::BackOffice->value,
                'receipt_number' => NumberSequenceService::next($residenceId, 'encaisser', $year, 'ENC'),
                'allocation_receipt_number' => NumberSequenceService::next($residenceId, 'imputation', $year, 'PAY'),
                'verification_token' => Str::uuid(),
                'validated_by' => $user->id,
                'validated_at' => now(),
                'notes' => $data['notes'] ?? null,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            $credit = $this->allocations->allocate($payment->fresh());

            activity()->on($payment)->log('payment_recorded');
            $payment->load(['allocations.due.lot', 'owner']);

            $lines = $payment->allocations->map(function ($a) use ($before) {
                $applied = round((float) $a->amount, 2);
                $openAfter = round((float) $a->due->amount - (float) $a->due->amount_paid, 2);
                $openBefore = $before->has($a->due_id)
                    ? $before->get($a->due_id)['open_before']
                    : round($openAfter + $applied, 2);

                return [
                    'due_id' => $a->due_id,
                    'lot_number' => $a->due->lot?->number,
                    'period_start' => $a->due->period_start->toDateString(),
                    'period_end' => $a->due->period_end->toDateString(),
                    'owed' => round((float) $a->due->amount, 2),
                    'open_before' => $openBefore,
                    'applied' => $applied,
                    'open_after' => $openAfter,
                ];
            })->all();

            return [
                'payment' => $payment,
                'lines' => $lines,
                'credit' => $credit,
                'remaining_after' => $this->remainingInResidence($owner->id, $residenceId),
            ];
        });
    }

    /** Annulation tracée (jamais de suppression) + recalcul des dus impactés. */
    public function cancel(Payment $payment, string $reason, User $user): Payment
    {
        if ($payment->status !== PaymentStatus::Validated) {
            throw new \LogicException('Seul un paiement validé peut être annulé.');
        }

        return DB::transaction(function () use ($payment, $reason, $user) {
            $payment->update([
                'status' => PaymentStatus::Cancelled->value,
                'cancelled_by' => $user->id,
                'cancelled_at' => now(),
                'cancellation_reason' => $reason,
                'updated_by' => $user->id,
            ]);

            DueSettlementService::refreshMany($payment->allocations()->pluck('due_id')->all());
            activity()->on($payment)->log('payment_cancelled');

            return $payment->fresh();
        });
    }

    /** @return Collection<int, Due> */
    private function openDues(int $ownerId, int $residenceId)
    {
        return Due::where('owner_id', $ownerId)
            ->where('residence_id', $residenceId)
            ->where('status', '!=', 'cancelled')
            ->where('status', '!=', 'paid')
            ->with('lot')
            ->orderBy('period_start')
            ->get()
            ->filter(fn ($d) => (float) $d->amount - (float) $d->amount_paid > 0)
            ->values();
    }

    private function remainingInResidence(int $ownerId, int $residenceId): float
    {
        $dueIds = Due::where('owner_id', $ownerId)
            ->where('residence_id', $residenceId)
            ->where('status', '!=', 'cancelled')
            ->pluck('id');
        $due = (float) Due::whereIn('id', $dueIds)->sum('amount');
        $paid = (float) PaymentAllocation::whereIn('due_id', $dueIds)
            ->whereHas('payment', fn ($q) => $q->where('status', 'validated'))
            ->sum('amount');

        return round($due - $paid, 2);
    }

    private function line(Due $due, float $applied, ?float $openBefore = null): array
    {
        $open = $openBefore ?? round((float) $due->amount - (float) $due->amount_paid, 2);

        return [
            'due_id' => $due->id,
            'lot_number' => $due->lot?->number,
            'period_start' => $due->period_start->toDateString(),
            'period_end' => $due->period_end->toDateString(),
            'owed' => round((float) $due->amount, 2),
            'open_before' => $open,
            'applied' => round($applied, 2),
            'open_after' => round($open - $applied, 2),
        ];
    }
}
