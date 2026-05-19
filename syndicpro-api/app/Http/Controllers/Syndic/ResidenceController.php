<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\Residence\StoreResidenceRequest;
use App\Http\Requests\Syndic\Residence\UpdateResidenceRequest;
use App\Http\Resources\ResidenceResource;
use App\Models\Residence;
use App\Services\ResidenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResidenceController extends Controller
{
    public function __construct(
        private readonly ResidenceService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $residences = $this->service->getWithStats($request->user()->id);
        return ApiResponse::success(ResidenceResource::collection($residences));
    }

    public function store(StoreResidenceRequest $request): JsonResponse
    {
        $residence = $this->service->create($request->validated(), $request->user()->id);
        return ApiResponse::created(new ResidenceResource($residence), 'Résidence créée avec succès.');
    }

    public function show(int $id): JsonResponse
    {
        $residence = Residence::where('id', $id)
            ->where('syndic_id', auth()->id())
            ->with(['immeubles', 'periodes' => fn($q) => $q->where('is_active', true)->limit(1)])
            ->first();

        if (!$residence) {
            return ApiResponse::notFound();
        }

        return ApiResponse::success(new ResidenceResource($residence));
    }

    public function update(UpdateResidenceRequest $request, int $id): JsonResponse
    {
        $residence = $this->service->update($id, $request->validated());
        return ApiResponse::success(new ResidenceResource($residence), 'Résidence mise à jour avec succès.');
    }

    public function destroy(UpdateResidenceRequest $request, int $id): JsonResponse
    {
        $this->service->delete($id);
        return ApiResponse::success(null, 'Résidence supprimée avec succès.');
    }
}