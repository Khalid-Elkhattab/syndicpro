<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\StoreOwnerRequest;
use App\Http\Resources\OwnerResource;
use App\Models\CollectionAction;
use App\Models\Document;
use App\Models\Owner;
use App\Models\Payment;
use App\Models\Residence;
use App\Services\OwnerService;
use App\Services\OwnerSituationService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OwnerController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private OwnerService $owners) {}

    /** Recherche globale : CIN/RC prioritaire, puis nom, téléphone, email, référence lot. */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Owner::class);

        $search = trim((string) $request->input('search', ''));
        $query = Owner::with(['phones', 'ownerships.lot.building']);

        $residenceIds = array_values(array_filter(array_map(
            'intval',
            (array) $request->input('residence_ids', [])
        )));
        if ($residenceIds !== []) {
            $query->whereHas('ownerships.lot', fn ($qq) => $qq->whereIn('residence_id', $residenceIds));
        }

        if ($search !== '') {
            $cin = OwnerService::normalizeIdentity($search);
            $query->where(function ($q) use ($search, $cin) {
                $q->where('identity_number', 'like', $cin.'%')
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhereHas('phones', fn ($qq) => $qq->where('number', 'like', '%'.preg_replace('/\D/', '', $search).'%'))
                    ->orWhereHas('emails', fn ($qq) => $qq->where('email', 'like', "%{$search}%"))
                    // Référence local : n° de lot ou de bâtiment.
                    ->orWhereHas('ownerships.lot', fn ($qq) => $qq->where('number', 'like', "%{$search}%"))
                    ->orWhereHas('ownerships.lot.building', fn ($qq) => $qq->where('number', 'like', "%{$search}%"));
            });
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $result = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => OwnerResource::collection($result->items()),
            'message' => 'Succès.',
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function store(StoreOwnerRequest $request): JsonResponse
    {
        $this->authorize('create', Owner::class);

        $owner = $this->owners->findOrCreate($request->validated());

        return ApiResponse::success(
            new OwnerResource($owner->load(['phones', 'emails'])),
            'Propriétaire enregistré (CIN existant → dossier lié, pas de doublon).',
            201
        );
    }

    public function update(StoreOwnerRequest $request, Owner $owner): JsonResponse
    {
        $this->authorize('update', $owner);

        $data = $request->validated();
        $owner->update([
            'type' => $data['type'] ?? $owner->type,
            'first_name' => $data['first_name'] ?? $owner->first_name,
            'last_name' => $data['last_name'] ?? $owner->last_name,
            'company_name' => $data['company_name'] ?? $owner->company_name,
            'identity_number' => array_key_exists('identity_number', $data)
                ? OwnerService::normalizeIdentity($data['identity_number'])
                : $owner->identity_number,
            'preferred_locale' => $data['preferred_locale'] ?? $owner->preferred_locale,
            'internal_notes' => $data['internal_notes'] ?? $owner->internal_notes,
        ]);

        if (array_key_exists('phones', $data)) {
            $owner->phones()->delete();
            foreach ($data['phones'] ?? [] as $phone) {
                $owner->phones()->create([
                    'number' => $phone['number'],
                    'is_whatsapp' => $phone['is_whatsapp'] ?? false,
                    'is_primary' => $phone['is_primary'] ?? false,
                ]);
            }
        }

        if (array_key_exists('emails', $data)) {
            $owner->emails()->delete();
            foreach ($data['emails'] ?? [] as $email) {
                $owner->emails()->create([
                    'email' => $email['email'],
                    'is_primary' => $email['is_primary'] ?? false,
                ]);
            }
        }

        return ApiResponse::success(
            new OwnerResource($owner->fresh()->load(['phones', 'emails'])),
            'Fiche propriétaire mise à jour.'
        );
    }

    public function destroy(Owner $owner): JsonResponse
    {
        $this->authorize('delete', $owner);

        if ($owner->currentOwnerships()->exists()) {
            return ApiResponse::error('Ce propriétaire détient encore un lot : transférez-le d’abord.', 422);
        }

        if (Residence::where('promoter_owner_id', $owner->id)->exists()) {
            return ApiResponse::error('Ce compte est le promoteur d’une résidence : suppression interdite.', 422);
        }

        $owner->delete();

        return ApiResponse::success(null, 'Propriétaire supprimé (corbeille).');
    }

    /** Dossier propriétaire : identité, biens, situation, paiements, relances, documents. */
    public function show(Request $request, Owner $owner): JsonResponse
    {
        $this->authorize('view', $owner);
        $owner->load(['phones', 'emails', 'ownerships.lot.building']);

        // Ouverture du dossier tracée (données personnelles).
        activity()->on($owner)->log('owner_file_opened');

        return ApiResponse::success([
            'owner' => new OwnerResource($owner),
            'situation' => OwnerSituationService::forOwner($owner->id),
            'payments' => Payment::where('owner_id', $owner->id)
                ->latest('paid_on')->limit(20)->get(['id', 'paid_on', 'method', 'amount', 'status', 'receipt_number', 'allocation_receipt_number']),
            'reminders' => CollectionAction::where('owner_id', $owner->id)
                ->latest()->limit(20)->get(['id', 'type', 'channel', 'status', 'amount_due', 'sent_at']),
            'documents' => Document::where('owner_id', $owner->id)
                ->latest()->limit(20)->get(['id', 'type', 'title', 'number', 'created_at']),
        ]);
    }
}
