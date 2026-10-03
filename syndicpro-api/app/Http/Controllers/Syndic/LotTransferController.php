<?php

namespace App\Http\Controllers\Syndic;

use App\Enums\AccountRequestStatus;
use App\Enums\OwnershipChangeReason;
use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\TransferLotRequest;
use App\Models\AccountEvent;
use App\Models\AccountRequest;
use App\Models\CollectionAction;
use App\Models\Complaint;
use App\Models\Document;
use App\Models\Due;
use App\Models\Lot;
use App\Models\LotAccountAssignment;
use App\Models\LotOwnership;
use App\Models\LotTransfer;
use App\Models\Owner;
use App\Models\Payment;
use App\Models\QuitusCertificate;
use App\Models\User;
use App\Policies\LotTransferPolicy;
use App\Services\LotTransferService;
use App\Services\OwnerService;
use App\Services\QuitusService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class LotTransferController extends Controller
{
    public function __construct(
        private LotTransferService $transfers,
        private OwnerService $owners,
        private LotTransferPolicy $transferPolicy,
    ) {}

    private function ensureHandover(User $user, Lot $lot, bool $override = false): void
    {
        $allowed = $override
            ? $this->transferPolicy->handoverOverride($user, $lot)
            : $this->transferPolicy->handover($user, $lot);
        abort_if(! $allowed, 403, 'Action non autorisée sur ce lot.');
    }

    /** Données du wizard : lot, cédant, solde, quitus valides, promoteur ou non. */
    public function wizardData(Lot $lot): JsonResponse
    {
        $this->ensureHandover(request()->user(), $lot);
        $lot->load(['building', 'residence', 'ownerLogin']);
        $current = LotOwnership::where('lot_id', $lot->id)->whereNull('ended_on')->with('owner')->first();

        $quitus = QuitusCertificate::where('lot_id', $lot->id)
            ->where('status', 'valid')
            ->where(function ($q) {
                $q->whereNull('valid_until')->orWhere('valid_until', '>=', today());
            })->latest()->get(['id', 'number', 'purpose', 'status', 'issued_on', 'valid_until']);

        return ApiResponse::success([
            'lot' => [
                'id' => $lot->id, 'number' => $lot->number,
                'type_label' => $lot->type_label, 'surface' => $lot->surface,
                'tantieme' => $lot->tantieme, 'building' => $lot->building?->number,
            ],
            'outgoing_owner' => $current?->owner ? [
                'id' => $current->owner->id,
                'display_name' => $current->owner->display_name,
                'is_promoter' => (int) $current->owner_id === (int) $lot->residence->promoter_owner_id,
            ] : null,
            'overdue_balance' => QuitusService::overdueBalance($lot->id),
            'valid_quitus' => $quitus,
            'suggested_effective_on' => today()->addMonthNoOverflow()->startOfMonth()->toDateString(),
            'arrears_on_sale' => $lot->residence->arrears_on_sale ?? 'seller_pays',
        ]);
    }

    public function run(TransferLotRequest $request, Lot $lot): JsonResponse
    {
        $data = $request->validated();
        // Tout contournement du quitus (dérogation OU motif sans-quitus) exige la permission.
        $bypass = ! empty($data['override_reason']) || ! empty($data['no_quitus_motif']);
        $this->ensureHandover($request->user(), $lot, $bypass);

        $newOwner = ! empty($data['to_owner_id'])
            ? Owner::findOrFail($data['to_owner_id'])
            : $this->owners->findOrCreate($data['new_owner']);

        $quitus = ! empty($data['quitus_id']) ? QuitusCertificate::findOrFail($data['quitus_id']) : null;

        if ($lot->residence->arrears_on_sale === 'seller_pays' && ! $quitus && ! $bypass) {
            return ApiResponse::error('Quitus de vente requis (ou dérogation / motif sans-quitus avec permission).', 422);
        }

        if (! $quitus && ! $bypass) {
            return ApiResponse::error('Sélectionnez un quitus ou renseignez le motif sans-quitus.', 422);
        }

        try {
            $transfer = $this->transfers->run(
                $lot,
                $newOwner,
                Carbon::parse($data['effective_on']),
                OwnershipChangeReason::from($data['reason']),
                $quitus,
                $data['override_reason'] ?? null,
                $request->user()->id,
                $data['account_request_id'] ?? null,
                $data['contract_document_id'] ?? null,
                $data['no_quitus_motif'] ?? null,
            );
        } catch (\LogicException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }

        if (! empty($data['account_request_id'])) {
            AccountRequest::where('id', $data['account_request_id'])->update([
                'status' => AccountRequestStatus::Approved->value,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'approved_user_id' => $lot->ownerLogin?->id,
                'activation_sent_at' => now(),
            ]);
        }

        $message = 'Transfert effectué. Lien d’activation envoyé au nouveau propriétaire.';
        if (! $quitus) {
            $message .= ' Transfert sans quitus : dossier juridique créé (mesure légale).';
        }

        return ApiResponse::success($transfer->load([]), $message, 201);
    }

    /** Historique du lot (staff uniquement) : périodes, quitus, dus, relances, docs, logins. */
    public function history(Lot $lot): JsonResponse
    {
        $this->ensureHandover(request()->user(), $lot);
        $lot->load(['building', 'residence']);

        $periods = LotOwnership::where('lot_id', $lot->id)->with('owner')->orderBy('started_on')->get()
            ->map(fn ($o) => [
                'owner' => $o->owner ? ['id' => $o->owner->id, 'display_name' => $o->owner->display_name] : null,
                'started_on' => $o->started_on, 'ended_on' => $o->ended_on,
                'change_reason' => $o->change_reason->value, 'share_percent' => $o->share_percent,
            ]);

        return ApiResponse::success([
            'lot' => ['id' => $lot->id, 'number' => $lot->number, 'type_label' => $lot->type_label],
            'periods' => $periods,
            'transfers' => LotTransfer::where('lot_id', $lot->id)->latest()->get(),
            'dues' => Due::where('lot_id', $lot->id)->orderBy('period_start')->get(),
            'payments' => Payment::where('lot_id', $lot->id)->latest('paid_on')->get(),
            'reminders' => CollectionAction::where('lot_id', $lot->id)->latest()->get(),
            'complaints' => Complaint::where('lot_id', $lot->id)->latest()->get(['id', 'reference', 'status']),
            'documents' => Document::where('lot_id', $lot->id)->latest()->get(['id', 'type', 'title', 'number']),
            'logins' => LotAccountAssignment::where('lot_id', $lot->id)->with('owner:id,first_name,last_name,company_name,type')->latest()->get(),
            'events' => AccountEvent::whereIn(
                'user_id',
                User::where('lot_id', $lot->id)->pluck('id')
            )->latest('created_at')->limit(50)->get(),
        ]);
    }
}
