<?php

namespace App\Services;

use App\Models\Due;
use App\Models\LotOwnership;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;

/**
 * Synthèse pour le dossier propriétaire, le wizard (solde vendeur) et le portail.
 * Source unique : dues − allocations validées (jamais un solde stocké).
 */
class OwnerSituationService
{
    /** @return array{per_lot: array, total_due: float, total_paid: float, remaining: float, overdue: float, oldest_unpaid: ?string} */
    public static function forOwner(int $ownerId): array
    {
        $lotIds = LotOwnership::where('owner_id', $ownerId)->distinct()->pluck('lot_id');

        $perLot = [];
        $totalDue = 0.0;
        $totalPaid = 0.0;
        $overdue = 0.0;
        $oldest = null;

        foreach ($lotIds as $lotId) {
            $dues = Due::where('lot_id', $lotId)->where('status', '!=', 'cancelled')->get();
            $due = (float) $dues->sum('amount');
            $paid = (float) PaymentAllocation::whereIn('due_id', $dues->pluck('id'))
                ->whereHas('payment', fn ($q) => $q->where('status', 'validated'))
                ->sum('amount');

            $open = $dues->filter(fn ($d) => in_array($d->status->value, ['unpaid', 'partial'], true)
                && $d->due_date->isPast());
            $overdue += (float) $open->sum('amount') - (float) PaymentAllocation::whereIn('due_id', $open->pluck('id'))
                ->whereHas('payment', fn ($q) => $q->where('status', 'validated'))
                ->sum('amount');

            $oldestDue = $dues->where('status', '!=', 'paid')->sortBy('period_start')->first();
            if ($oldestDue && (! $oldest || $oldestDue->period_start < $oldest)) {
                $oldest = $oldestDue->period_start;
            }

            $perLot[] = [
                'lot_id' => $lotId,
                'due' => round($due, 2),
                'paid' => round($paid, 2),
                'remaining' => round($due - $paid, 2),
            ];
            $totalDue += $due;
            $totalPaid += $paid;
        }

        $lastPayment = Payment::where('owner_id', $ownerId)
            ->where('status', 'validated')->max('paid_on');

        return [
            'per_lot' => $perLot,
            'total_due' => round($totalDue, 2),
            'total_paid' => round($totalPaid, 2),
            'remaining' => round($totalDue - $totalPaid, 2),
            'overdue' => round(max($overdue, 0), 2),
            'oldest_unpaid' => $oldest,
            'last_payment_on' => $lastPayment,
        ];
    }

    public static function maskIdentity(?string $identity): ?string
    {
        if (! $identity || mb_strlen($identity) < 4) {
            return $identity ? '•••' : null;
        }

        return mb_substr($identity, 0, 2) . '•••' . mb_substr($identity, -2);
    }
}
