<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\SousCharge\StoreSousChargeRequest;
use App\Http\Requests\Syndic\SousCharge\UpdateSousChargeRequest;
use App\Http\Resources\SousChargeResource;
use App\Services\SousChargeService;
use App\Models\SousCharge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SousChargeController extends Controller
{
    public function __construct(
        private readonly SousChargeService $service
    ) {}

    public function indexByCompteCharge(int $compteCharge): JsonResponse
    {
        $sousCharges = $this->service->getByCompteCharge($compteCharge);
        return ApiResponse::success(SousChargeResource::collection($sousCharges));
    }

    public function indexByResidence(Request $request, int $residence): JsonResponse
    {
        $sousCharges = $this->service->getByResidence($residence);
        return ApiResponse::success(SousChargeResource::collection($sousCharges));
    }

    public function store(StoreSousChargeRequest $request, int $compteCharge): JsonResponse
    {
        $compteChargeModel = \App\Models\CompteCharge::with('residence')->findOrFail($compteCharge);

        $sousCharge = $this->service->create(
            $request->validated(),
            $compteCharge,
            $compteChargeModel->residence_id
        );

        return ApiResponse::created(new SousChargeResource($sousCharge), 'Sous-charge créée avec succès.');
    }

    public function show(int $compteCharge, int $sousCharge): JsonResponse
    {
        $sousChargeModel = SousCharge::with(['compteCharge', 'residence'])->find($sousCharge);

        if (!$sousChargeModel || $sousChargeModel->compte_charge_id !== $compteCharge) {
            return ApiResponse::notFound();
        }

        return ApiResponse::success(new SousChargeResource($sousChargeModel));
    }

    public function update(UpdateSousChargeRequest $request, int $compteCharge, int $sousCharge): JsonResponse
    {
        $sousChargeModel = $this->service->update($sousCharge, $request->validated());
        return ApiResponse::success(new SousChargeResource($sousChargeModel), 'Sous-charge mise à jour avec succès.');
    }

    public function destroy(int $compteCharge, int $sousCharge): JsonResponse
    {
        try {
            $this->service->delete($sousCharge);
            return ApiResponse::success(null, 'Sous-charge supprimée avec succès.');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 409);
        }
    }
}