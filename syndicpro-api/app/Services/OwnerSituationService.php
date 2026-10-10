<?php

namespace App\Services;

use App\Models\Due;
use App\Models\LotOwnership;
use App\Models\Payment;
use App\Models\PaymentAllocation;

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

        // Dus attribués à CE propriétaire (owner_id maintenu par le générateur et les
        // transferts), jamais ceux d'un vendeur/acheteur précédent ou suivant.
        // Les dus sans owner_id (aucun contact de facturation) sont exclus.
        $dues = Due::whereIn('lot_id', $lotIds)
            ->where('owner_id', $ownerId)
            ->where('status', '!=', 'cancelled')
            ->with('lot.building')
            ->orderBy('period_start')
            ->get();

        $perLot = [];
        $totalDue = 0.0;
        $totalPaid = 0.0;
        $overdue = 0.0;
        $oldest = null;

        foreach ($dues->groupBy('lot_id') as $lotId => $lotDues) {
            $due = (float) $lotDues->sum('amount');
            $paid = (float) PaymentAllocation::whereIn('due_id', $lotDues->pluck('id'))
                ->whereHas('payment', fn ($q) => $q->where('status', 'validated'))
                ->sum('amount');

            $open = $lotDues->filter(fn ($d) => in_array($d->status->value, ['unpaid', 'partial'], true)
                && $d->due_date->isPast());
            $overdue += (float) $open->sum('amount') - (float) PaymentAllocation::whereIn('due_id', $open->pluck('id'))
                ->whereHas('payment', fn ($q) => $q->where('status', 'validated'))
                ->sum('amount');

            $oldestDue = $lotDues->filter(fn ($d) => in_array($d->status->value, ['unpaid', 'partial'], true))
                ->sortBy('period_start')->first();
            if ($oldestDue && (! $oldest || $oldestDue->period_start->lt($oldest))) {
                $oldest = $oldestDue->period_start;
            }

            $lot = $lotDues->first()->lot;
            $perLot[] = [
                'lot_id' => (int) $lotId,
                'residence_id' => $lotDues->first()->residence_id,
                'lot_number' => $lot?->number,
                'building' => $lot?->building?->number,
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
            'oldest_unpaid' => $oldest?->toDateString(),
            'last_payment_on' => $lastPayment,
        ];
    }

    public static function maskIdentity(?string $identity): ?string
    {
        if (! $identity || mb_strlen($identity) < 4) {
            return $identity ? '•••' : null;
        }

        return mb_substr($identity, 0, 2).'•••'.mb_substr($identity, -2);
    }
}
