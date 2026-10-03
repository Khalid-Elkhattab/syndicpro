<?php

namespace App\Services;

use App\Enums\DueStatus;
use App\Models\Due;
use App\Models\PaymentAllocation;

/**
 * SEUL code autorisé à écrire dues.amount_paid / status (spec §2.3 + §6).
 * Recalcule à partir des allocations validées après chaque validation/annulation.
 */
class DueSettlementService
{
    public static function refresh(Due $due): Due
    {
        $paid = (float) PaymentAllocation::where('due_id', $due->id)
            ->whereHas('payment', fn ($q) => $q->where('status', 'validated'))
            ->sum('amount');

        $amount = (float) $due->amount;
        $wasCancelled = $due->status === DueStatus::Cancelled;
        $due->amount_paid = $paid;
        $due->status = match (true) {
            $wasCancelled => DueStatus::Cancelled,
            $paid <= 0 => DueStatus::Unpaid,
            $paid < $amount => DueStatus::Partial,
            default => DueStatus::Paid,
        };
        $due->save();

        return $due;
    }

    /** @param int[] $dueIds */
    public static function refreshMany(array $dueIds): void
    {
        foreach (array_unique($dueIds) as $id) {
            if ($due = Due::find($id)) {
                self::refresh($due);
            }
        }
    }
}
