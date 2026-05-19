<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\Appartement\StoreAppartementRequest;
use App\Http\Requests\Syndic\Appartement\UpdateAppartementRequest;
use App\Http\Resources\AppartementResource;
use App\Services\AppartementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppartementController extends Controller
{
    public function __construct(
        private readonly AppartementService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $syndicId = $request->user()->id;
        $filters = $request->only(['residence_id', 'immeuble_id']);

        $appartements = $this->service->findBySyndic($syndicId);

        if (!empty($filters['residence_id'])) {
            $appartements = $appartements->where('residence_id', $filters['residence_id']);
        }
        if (!empty($filters['immeuble_id'])) {
            $appartements = $appartements->where('immeuble_id', $filters['immeuble_id']);
        }

        return ApiResponse::success(AppartementResource::collection($appartements->values()));
    }

    public function store(StoreAppartementRequest $request): JsonResponse
    {
        $appartement = $this->service->create($request->validated());
        return ApiResponse::created(new AppartementResource($appartement->load(['immeuble', 'coproprietaire'])), 'Appartement créé avec succès.');
    }

    public function show(int $id): JsonResponse
    {
        $appartement = $this->service->findBySyndic(auth()->id())
            ->firstWhere('id', $id);

        if (!$appartement) {
            return ApiResponse::notFound();
        }

        return ApiResponse::success(new AppartementResource($appartement->load(['immeuble', 'coproprietaire'])));
    }

    public function update(UpdateAppartementRequest $request, int $id): JsonResponse
    {
        $appartement = $this->service->update($id, $request->validated());
        return ApiResponse::success(new AppartementResource($appartement->load(['immeuble', 'coproprietaire'])), 'Appartement mis à jour avec succès.');
    }

    public function assigner(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'coproprietaire_id' => 'nullable|exists:users,id',
        ]);

        $appartement = $this->service->assigner($id, $request->input('coproprietaire_id'));
        return ApiResponse::success(new AppartementResource($appartement), 'Copropriétaire assigné avec succès.');
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);
        return ApiResponse::success(null, 'Appartement supprimé avec succès.');
    }
}