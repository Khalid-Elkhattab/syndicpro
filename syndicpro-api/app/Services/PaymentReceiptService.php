<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Due;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * Double reçu de l'encaissement manuel : ENC (argent reçu) + PAY (imputation).
 * PDFs régénérés à la demande (stateless) : reflètent toujours le statut actuel.
 */
class PaymentReceiptService
{
    /** Données partagées des deux reçus, recalculées depuis les allocations. */
    public function receiptData(Payment $payment): array
    {
        $payment->loadMissing(['owner', 'residence', 'allocations.due.lot', 'validator']);
        $applied = 0.0;
        $lines = $payment->allocations->map(function ($a) use (&$applied) {
            $amount = round((float) $a->amount, 2);
            $applied += $amount;
            $due = $a->due;
            $openAfter = $due
                ? round((float) $due->amount - (float) $due->amount_paid, 2)
                : 0.0;

            return [
                'due_id' => $a->due_id,
                'lot_number' => $due?->lot?->number,
                'period_start' => $due?->period_start?->toDateString(),
                'period_end' => $due?->period_end?->toDateString(),
                'owed' => $due ? round((float) $due->amount, 2) : $amount,
                'open_before' => round($openAfter + $amount, 2),
                'applied' => $amount,
                'open_after' => $openAfter,
            ];
        })->all();

        $tendered = round((float) $payment->amount, 2);
        $credit = round($tendered - $applied, 2);

        $dueIds = Due::where('owner_id', $payment->owner_id)
            ->where('residence_id', $payment->residence_id)
            ->where('status', '!=', 'cancelled')
            ->pluck('id');
        $totalDue = (float) Due::whereIn('id', $dueIds)->sum('amount');
        $totalPaid = (float) PaymentAllocation::whereIn('due_id', $dueIds)
            ->whereHas('payment', fn ($q) => $q->where('status', 'validated'))
            ->sum('amount');

        return [
            'payment' => $payment,
            'cancelled' => $payment->status === PaymentStatus::Cancelled,
            'lines' => $lines,
            'tendered' => $tendered,
            'applied' => round($applied, 2),
            'credit' => $credit,
            'remaining_after' => round($totalDue - $totalPaid, 2),
        ];
    }

    public function renderEncaissement(Payment $payment): string
    {
        $pdf = Pdf::loadView('recus.encaissement', $this->receiptData($payment));
        $pdf->setPaper('a4', 'portrait');

        return $pdf->output();
    }

    public function renderImputation(Payment $payment): string
    {
        $pdf = Pdf::loadView('recus.imputation', $this->receiptData($payment));
        $pdf->setPaper('a4', 'portrait');

        return $pdf->output();
    }
}
