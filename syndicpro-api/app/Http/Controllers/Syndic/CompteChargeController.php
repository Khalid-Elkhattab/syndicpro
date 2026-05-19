<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\CompteCharge\StoreCompteChargeRequest;
use App\Http\Requests\Syndic\CompteCharge\UpdateCompteChargeRequest;
use App\Http\Resources\CompteChargeResource;
use App\Services\CompteChargeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompteChargeController extends Controller
{
    public function __construct(
        private readonly CompteChargeService $service
    ) {}

    public function index(Request $request, int $residence): JsonResponse
    {
        $comptes = $this->service->getByResidence($residence);
        return ApiResponse::success(CompteChargeResource::collection($comptes));
    }

    public function store(StoreCompteChargeRequest $request, int $residence): JsonResponse
    {
        $compte = $this->service->create($request->validated(), $residence);
        return ApiResponse::created(new CompteChargeResource($compte), 'Compte de charges créé avec succès.');
    }

    public function show(int $residence, int $compteCharge): JsonResponse
    {
        $compte = $this->service->getByResidence($residence)->firstWhere('id', $compteCharge);

        if (!$compte) {
            return ApiResponse::notFound();
        }

        return ApiResponse::success(new CompteChargeResource($compte->load(['sousCharges', 'budgetPrevisionnels'])));
    }

    public function update(UpdateCompteChargeRequest $request, int $residence, int $compteCharge): JsonResponse
    {
        $compte = $this->service->update($compteCharge, $request->validated());
        return ApiResponse::success(new CompteChargeResource($compte), 'Compte de charges mis à jour avec succès.');
    }

    public function destroy(int $residence, int $compteCharge): JsonResponse
    {
        try {
            $this->service->delete($compteCharge);
            return ApiResponse::success(null, 'Compte de charges supprimé avec succès.');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 409);
        }
    }
}