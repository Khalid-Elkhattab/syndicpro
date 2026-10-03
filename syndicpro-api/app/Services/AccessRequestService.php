<?php

namespace App\Services;

use App\Enums\AccountEventType;
use App\Enums\AccountMatchResult;
use App\Enums\AccountRequestStatus;
use App\Models\AccountRequest;
use App\Models\Building;
use App\Models\Lot;
use App\Models\LotOwnership;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Spec §6 (access request flow) : calcul du match_result, réponse publique générique.
 * L’approbation des cas non-exacts passe par le wizard de transfert (jamais directe).
 */
class AccessRequestService
{
    public function __construct(private OwnerAccountService $accounts) {}

    public function submit(int $residenceId, array $data, ?string $ip = null): AccountRequest
    {
        return DB::transaction(function () use ($residenceId, $data, $ip) {
            $match = $this->match($residenceId, $data['building_input'], $data['lot_input'], $data['identity_number']);

            return AccountRequest::create([
                'reference' => NumberSequenceService::next($residenceId, 'request', (int) date('Y'), 'REQ'),
                'residence_id' => $residenceId,
                'building_input' => $data['building_input'],
                'lot_input' => $data['lot_input'],
                'lot_id' => $match['lot_id'],
                'matched_owner_id' => $match['matched_owner_id'],
                'match_result' => $match['match_result'],
                'full_name' => $data['full_name'],
                'identity_number' => $data['identity_number'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'locale' => $data['locale'] ?? 'fr',
                'message' => $data['message'] ?? null,
                'phone_verified_at' => $data['phone_verified_at'] ?? null,
                'status' => AccountRequestStatus::Submitted->value,
                'ip' => $ip,
                'expires_at' => now()->addDays(30),
            ]);
        });
    }

    /** @return array{lot_id: ?int, matched_owner_id: ?int, match_result: string} */
    public function match(int $residenceId, string $buildingInput, string $lotInput, string $identityNumber): array
    {
        $building = Building::where('residence_id', $residenceId)
            ->where('number', trim($buildingInput))->first();

        $lot = $building
            ? Lot::where('building_id', $building->id)->where('number', trim($lotInput))->first()
            : null;

        if (! $lot) {
            return ['lot_id' => null, 'matched_owner_id' => null, 'match_result' => AccountMatchResult::LotNotFound->value];
        }

        $current = LotOwnership::where('lot_id', $lot->id)->whereNull('ended_on')->first();
        $residence = $lot->residence;
        $cin = OwnerService::normalizeIdentity($identityNumber);

        if (! $current) {
            return ['lot_id' => $lot->id, 'matched_owner_id' => null, 'match_result' => AccountMatchResult::NoOwnerOnRecord->value];
        }

        if ($residence->promoter_owner_id && (int) $current->owner_id === (int) $residence->promoter_owner_id) {
            return ['lot_id' => $lot->id, 'matched_owner_id' => $current->owner_id, 'match_result' => AccountMatchResult::OwnedByPromoter->value];
        }

        $owner = $current->owner;
        if ($cin && $owner->identity_number && hash_equals($owner->identity_number, $cin)) {
            return ['lot_id' => $lot->id, 'matched_owner_id' => $owner->id, 'match_result' => AccountMatchResult::Exact->value];
        }

        return ['lot_id' => $lot->id, 'matched_owner_id' => $current->owner_id, 'match_result' => AccountMatchResult::DifferentOwner->value];
    }

    public function markNeedsInfo(AccountRequest $request, int $reviewerId, ?string $note, bool $contactConfirmed = false, bool $documentsChecked = false): AccountRequest
    {
        $request->update([
            'status' => AccountRequestStatus::NeedsInfo->value,
            'review_note' => $note,
            'contact_confirmed' => $contactConfirmed || $request->contact_confirmed,
            'documents_checked' => $documentsChecked || $request->documents_checked,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);

        return $request->fresh();
    }

    public function reject(AccountRequest $request, int $reviewerId, string $reason): AccountRequest
    {
        $request->update([
            'status' => AccountRequestStatus::Rejected->value,
            'rejection_reason' => $reason,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);

        return $request->fresh();
    }

    /**
     * Approbation directe — autorisée UNIQUEMENT pour match exact.
     * Les autres cas passent par le wizard de transfert (jamais d’approbation directe).
     *
     * @return array{request: AccountRequest, activation_token: string}
     */
    public function approveExact(AccountRequest $request, int $reviewerId): array
    {
        if ($request->match_result !== AccountMatchResult::Exact) {
            throw new \LogicException('Approbation directe impossible : passer par le transfert.');
        }
        if (! $request->lot_id) {
            throw new \LogicException('Aucun lot associé à cette demande.');
        }

        return DB::transaction(function () use ($request, $reviewerId) {
            $login = User::where('lot_id', $request->lot_id)->firstOrFail();
            $issued = $this->accounts->issueActivation($login);
            $login->update(['current_owner_id' => $request->matched_owner_id]);

            AccountEventLogger::log($login->id, AccountEventType::ActivationLinkIssued, $reviewerId, $request->matched_owner_id, [
                'account_request_id' => $request->id,
            ]);

            $request->update([
                'status' => AccountRequestStatus::Approved->value,
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
                'approved_user_id' => $login->id,
                'activation_sent_at' => now(),
            ]);

            return ['request' => $request->fresh(), 'activation_token' => $issued['token']];
        });
    }
}
