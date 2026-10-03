<?php

namespace App\Services;

use App\Models\Due;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;

/**
 * Spec §6 règles 3, 13, 14 : auto = dus ouverts du propriétaire, plus anciens d’abord ;
 * le reliquat reste en crédit (Σ allocations < montant) et s’applique aux dus ultérieurs.
 */
class AllocationService
{
    /**
     * Ventile un paiement validé (auto ou manuel). Retourne le reliquat (crédit).
     *
     * @param  array<int, float>  $manual  due_id => montant (mode manuel)
     */
    public function allocate(Payment $payment, array $manual = []): float
    {
        return DB::transaction(function () use ($payment, $manual) {
            $remaining = (float) $payment->amount;

            if ($payment->allocation_mode === 'manual') {
                $total = array_sum($manual);
                if ($total > $remaining + 0.001) {
                    throw new \LogicException('Allocations manuelles > montant du paiement.');
                }
                foreach ($manual as $dueId => $amount) {
                    $remaining -= $this->allocateTo($payment, (int) $dueId, (float) $amount);
                }
            } else {
                $dues = Due::where('owner_id', $payment->owner_id)
                    ->where('status', '!=', 'cancelled')
                    ->where('status', '!=', 'paid')
                    ->orderBy('period_start')
                    ->lockForUpdate()
                    ->get();

                foreach ($dues as $due) {
                    if ($remaining <= 0) {
                        break;
                    }
                    $open = (float) $due->amount - (float) $due->amount_paid;
                    if ($open > 0) {
                        $remaining -= $this->allocateTo($payment, $due->id, min($open, $remaining));
                    }
                }
            }

            DueSettlementService::refreshMany(
                $payment->allocations()->pluck('due_id')->all()
            );

            return round(max($remaining, 0), 2);
        });
    }

    private function allocateTo(Payment $payment, int $dueId, float $amount): float
    {
        if ($amount <= 0) {
            return 0;
        }

        $alloc = PaymentAllocation::firstOrNew([
            'payment_id' => $payment->id,
            'due_id' => $dueId,
        ]);
        $alloc->amount = round(((float) ($alloc->amount ?? 0)) + $amount, 2);
        $alloc->save();

        return $amount;
    }
}
