<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\ReviewAccessRequestRequest;
use App\Http\Resources\AccountRequestResource;
use App\Models\AccountRequest;
use App\Services\AccessRequestService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccessRequestController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private AccessRequestService $requests) {}

    public function index(Request $request): JsonResponse
    {
        $query = AccountRequest::with(['residence', 'matchedOwner'])
            ->when($request->input('residence_id'), fn ($q, $id) => $q->where('residence_id', $id))
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('match_result'), fn ($q, $m) => $q->where('match_result', $m))
            ->latest();

        $perPage = min((int) $request->input('per_page', 20), 100);
        $result = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => AccountRequestResource::collection($result->items()),
            'message' => 'Succès.',
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
                'open_count' => AccountRequest::open()->count(),
            ],
        ]);
    }

    public function show(AccountRequest $accountRequest): JsonResponse
    {
        $this->authorize('review', $accountRequest);

        return ApiResponse::success(
            new AccountRequestResource($accountRequest->load(['residence', 'matchedOwner', 'lot.building']))
        );
    }

    public function review(ReviewAccessRequestRequest $request, AccountRequest $accountRequest): JsonResponse
    {
        $this->authorize('review', $accountRequest);
        $action = $request->input('action');

        if ($action === 'needs_info') {
            $updated = $this->requests->markNeedsInfo(
                $accountRequest,
                $request->user()->id,
                $request->input('review_note'),
                (bool) $request->input('contact_confirmed', false),
                (bool) $request->input('documents_checked', false)
            );

            return ApiResponse::success(new AccountRequestResource($updated), 'Demande mise en attente.');
        }

        if ($action === 'reject') {
            $updated = $this->requests->reject(
                $accountRequest,
                $request->user()->id,
                $request->input('rejection_reason')
            );

            return ApiResponse::success(new AccountRequestResource($updated), 'Demande rejetée.');
        }

        // approve : directe seulement si match exact, sinon via le wizard de transfert.
        if ($accountRequest->match_result !== \App\Enums\AccountMatchResult::Exact) {
            return response()->json([
                'success' => false,
                'data' => ['transfer_required' => true, 'lot_id' => $accountRequest->lot_id],
                'message' => 'Nouveau propriétaire : approuvez via le transfert du lot.',
            ], 422);
        }

        // Le lien part vers un contact vérifié : code phone OK + (contact au dossier ou confirmé).
        if (! $accountRequest->phone_verified_at) {
            return ApiResponse::error('Code téléphone non vérifié pour cette demande.', 422);
        }

        $result = $this->requests->approveExact($accountRequest, $request->user()->id);

        return ApiResponse::success(
            new AccountRequestResource($result['request']),
            'Demande approuvée. Transmettez le lien d’activation (affiché une seule fois).',
            200,
            ['activation_token' => $result['activation_token']]
        );
    }
}
