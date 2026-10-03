<?php

namespace App\Services;

use App\Enums\AccountEventType;
use App\Enums\LawyerCaseStatus;
use App\Enums\OwnershipChangeReason;
use App\Enums\UserType;
use App\Models\Due;
use App\Models\LawyerCase;
use App\Models\Lot;
use App\Models\LotAccountAssignment;
use App\Models\LotOwnership;
use App\Models\LotTransfer;
use App\Models\Owner;
use App\Models\QuitusCertificate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Spec §6 (sale flow) + règles 10, 21, 22, 25.
 * Toujours passer par run() : jamais d’édition manuelle des ownerships ni du login.
 */
class LotTransferService
{
    public function __construct(
        private OwnerAccountService $accounts,
        private QuitusService $quitus,
    ) {}

    /**
     * @throws \LogicException si le contrôle quitus échoue
     */
    public function run(
        Lot $lot,
        Owner $newOwner,
        Carbon $effectiveOn,
        OwnershipChangeReason $reason,
        ?QuitusCertificate $quitus = null,
        ?string $overrideReason = null,
        ?int $performedBy = null,
        ?int $accountRequestId = null,
        ?int $contractDocumentId = null,
        ?string $noQuitusMotif = null,
    ): LotTransfer {
        return DB::transaction(function () use (
            $lot, $newOwner, $effectiveOn, $reason, $quitus,
            $overrideReason, $performedBy, $accountRequestId, $contractDocumentId, $noQuitusMotif
        ) {
            $residence = $lot->residence;
            $current = LotOwnership::where('lot_id', $lot->id)->whereNull('ended_on')->firstOrFail();
            $isPromoterSale = $current->owner_id === $residence->promoter_owner_id;

            // --- Contrôle quitus (règle 21) ---
            $mode = $residence->arrears_on_sale ?? 'seller_pays';
            $balance = QuitusService::overdueBalance($lot->id);
            $overridden = false;

            if ($mode === 'seller_pays' && ! $overrideReason && ! $noQuitusMotif) {
                if (! $quitus || ! $quitus->isUsable() || (int) $quitus->lot_id !== (int) $lot->id) {
                    throw new \LogicException('Transfert bloqué : quitus de vente valide requis pour ce lot.');
                }
                if ($balance > 0) {
                    throw new \LogicException('Transfert bloqué : solde exigible non nul au moment du transfert.');
                }
            }
            if ($overrideReason) {
                $overridden = true; // permission owners.handover_override vérifiée par la policy
            }
            if ($reason === OwnershipChangeReason::PromoterSale && ! $contractDocumentId) {
                throw new \LogicException('Première vente : contrat de vente obligatoire.');
            }

            // --- 1+2. Clôture ownership/assignment, ouverture nouvelles lignes ---
            $dayBefore = $effectiveOn->copy()->subDay()->toDateString();
            $current->update(['ended_on' => $dayBefore]);

            $opened = LotOwnership::create([
                'lot_id' => $lot->id,
                'owner_id' => $newOwner->id,
                'share_percent' => 100,
                'is_billing_contact' => true,
                'started_on' => $effectiveOn->toDateString(),
                'change_reason' => $reason->value,
            ]);

            $login = User::where('lot_id', $lot->id)->where('type', UserType::Owner->value)->firstOrFail();
            LotAccountAssignment::where('user_id', $login->id)->whereNull('ended_at')
                ->update(['ended_at' => now(), 'end_reason' => $reason->value]);
            $assignment = LotAccountAssignment::create([
                'user_id' => $login->id,
                'lot_id' => $lot->id,
                'owner_id' => $newOwner->id,
                'lot_ownership_id' => $opened->id,
                'started_at' => now(),
                'initialised_by' => $performedBy,
            ]);

            // --- 3+4. Reset login + révocation ---
            $issued = $this->accounts->issueActivation($login);
            $login->update(['current_owner_id' => $newOwner->id]);
            $login->tokens()->delete();
            $login->forceFill(['remember_token' => null])->save();
            DB::table('sessions')->where('user_id', $login->id)->delete();
            AccountEventLogger::log($login->id, AccountEventType::SessionsRevoked, $performedBy, $newOwner->id);
            AccountEventLogger::log($login->id, AccountEventType::HandedOver, $performedBy, $newOwner->id);
            AccountEventLogger::log($login->id, AccountEventType::ActivationLinkIssued, $performedBy, $newOwner->id);

            // --- 7. Dus à partir d’effective_on → acheteur (mois en cours reste vendeur) ---
            Due::where('lot_id', $lot->id)
                ->where('period_start', '>=', $effectiveOn->toDateString())
                ->update(['owner_id' => $newOwner->id]);

            // --- 8. Ligne lot_transfers + quitus consommé ---
            if ($quitus && ! $overridden) {
                $this->quitus->consume($quitus);
            }

            $transfer = LotTransfer::create([
                'residence_id' => $lot->residence_id,
                'lot_id' => $lot->id,
                'from_owner_id' => $current->owner_id,
                'to_owner_id' => $newOwner->id,
                'effective_on' => $effectiveOn->toDateString(),
                'reason' => $reason->value,
                'quitus_id' => $quitus?->id,
                'balance_at_transfer' => $balance,
                'quitus_overridden' => $overridden,
                'override_reason' => $overrideReason,
                'account_request_id' => $accountRequestId,
                'closed_ownership_id' => $current->id,
                'opened_ownership_id' => $opened->id,
                'performed_by' => $performedBy,
                'contract_document_id' => $contractDocumentId,
            ]);

            // --- 9. Sans quitus : mesure légale auto (comme les impayés).
            if (! $quitus) {
                LawyerCase::create([
                    'residence_id' => $lot->residence_id,
                    'owner_id' => $current->owner_id,
                    'lot_id' => $lot->id,
                    'transfer_id' => $transfer->id,
                    'case_kind' => 'no_quitus_transfer',
                    'motif' => $noQuitusMotif ?? $overrideReason ?? 'Transfert sans quitus de vente.',
                    'amount_claimed' => $balance,
                    'status' => LawyerCaseStatus::ToTransmit->value,
                    'created_by' => $performedBy,
                ]);
            }

            return $transfer;
        });
    }
}
