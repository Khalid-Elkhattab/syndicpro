<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\Immeuble\StoreImmeubleRequest;
use App\Http\Requests\Syndic\Immeuble\UpdateImmeubleRequest;
use App\Http\Resources\ImmeubleResource;
use App\Services\ImmeubleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImmeubleController extends Controller
{
    public function __construct(
        private readonly ImmeubleService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $syndicId = $request->user()->id;
        $filters = $request->only(['residence_id']);

        if (!empty($filters)) {
            $immeubles = $this->service->findBySyndic($syndicId)->filter(fn($i) =>
                empty($filters['residence_id']) || $i->residence_id == $filters['residence_id']
            )->values();
        } else {
            $immeubles = $this->service->findBySyndic($syndicId);
        }

        return ApiResponse::success(ImmeubleResource::collection($immeubles));
    }

    public function store(StoreImmeubleRequest $request): JsonResponse
    {
        $immeuble = $this->service->create($request->validated());
        return ApiResponse::created(new ImmeubleResource($immeuble->load('residence')), 'Immeuble créé avec succès.');
    }

    public function show(int $id): JsonResponse
    {
        $immeuble = $this->service->findBySyndic(auth()->id())
            ->firstWhere('id', $id);

        if (!$immeuble) {
            return ApiResponse::notFound();
        }

        return ApiResponse::success(new ImmeubleResource($immeuble->load(['residence', 'appartements'])));
    }

    public function update(UpdateImmeubleRequest $request, int $id): JsonResponse
    {
        $immeuble = $this->service->update($id, $request->validated());
        return ApiResponse::success(new ImmeubleResource($immeuble), 'Immeuble mis à jour avec succès.');
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);
            return ApiResponse::success(null, 'Immeuble supprimé avec succès.');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 409);
        }
    }
}