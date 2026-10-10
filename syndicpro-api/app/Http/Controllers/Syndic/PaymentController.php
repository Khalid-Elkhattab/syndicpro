<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\RecordPaymentRequest;
use App\Models\Payment;
use App\Policies\PaymentPolicy;
use App\Services\PaymentIntakeService;
use App\Services\PaymentReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentIntakeService $intake,
        private PaymentReceiptService $receipts,
        private PaymentPolicy $policy,
    ) {}

    /** Simulation d'imputation (aucune écriture) pour l'écran de confirmation. */
    public function preview(Request $request): JsonResponse
    {
        if (! $this->policy->record($request->user())) {
            abort(403, 'Permission payments.create requise.');
        }
        $request->validate([
            'residence_id' => ['required', 'integer', 'exists:residences,id'],
            'owner_id' => ['required', 'integer', 'exists:owners,id'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
        ]);

        return ApiResponse::success($this->intake->preview(
            (int) $request->input('owner_id'),
            (int) $request->input('residence_id'),
            (float) $request->input('amount'),
        ));
    }

    /** Encaissement manuel : crée, ventile (plus anciens d'abord), numérote ENC + PAY. */
    public function store(RecordPaymentRequest $request): JsonResponse
    {
        if (! $this->policy->record($request->user())) {
            abort(403, 'Permission payments.create requise.');
        }

        try {
            $result = $this->intake->record($request->validated(), $request->user());
        } catch (\LogicException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }

        /** @var Payment $payment */
        $payment = $result['payment'];

        return ApiResponse::success([
            'payment' => $payment,
            'lines' => $result['lines'],
            'credit' => $result['credit'],
            'remaining_after' => $result['remaining_after'],
            'receipts' => [
                'encaissement_number' => $payment->receipt_number,
                'imputation_number' => $payment->allocation_receipt_number,
                'encaissement_url' => route('syndic.payments.receipt-encaissement', $payment),
                'imputation_url' => route('syndic.payments.receipt-imputation', $payment),
            ],
        ], 'Paiement enregistré et ventilé.', 201);
    }

    public function receiptEncaissement(Request $request, Payment $payment)
    {
        if (! $this->policy->record($request->user())) {
            abort(403, 'Permission payments.create requise.');
        }

        return response(
            $this->receipts->renderEncaissement($payment),
            200,
            ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'inline; filename="'.$payment->receipt_number.'.pdf"']
        );
    }

    public function receiptImputation(Request $request, Payment $payment)
    {
        if (! $this->policy->record($request->user())) {
            abort(403, 'Permission payments.create requise.');
        }

        return response(
            $this->receipts->renderImputation($payment),
            200,
            ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'inline; filename="'.$payment->allocation_receipt_number.'.pdf"']
        );
    }

    /** Annulation tracée (motif obligatoire), dus recalculés. */
    public function cancel(Request $request, Payment $payment): JsonResponse
    {
        if (! $this->policy->cancel($request->user())) {
            abort(403, 'Permission payments.cancel requise.');
        }
        $request->validate(['cancellation_reason' => 'required|string|max:1000']);

        try {
            $payment = $this->intake->cancel($payment, $request->input('cancellation_reason'), $request->user());
        } catch (\LogicException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }

        return ApiResponse::success($payment, 'Paiement annulé, dus recalculés.');
    }
}
