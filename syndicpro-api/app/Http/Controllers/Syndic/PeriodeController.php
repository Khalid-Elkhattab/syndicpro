<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\Periode\StorePeriodeRequest;
use App\Http\Requests\Syndic\Periode\UpdatePeriodeRequest;
use App\Http\Resources\PeriodeResource;
use App\Models\Periode;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodeController extends Controller
{
    public function __construct(
        private readonly BudgetService $budgetService
    ) {}

    public function index(Request $request, int $residenceId): JsonResponse
    {
        $periodes = Periode::where('residence_id', $residenceId)
            ->orderByDesc('annee')
            ->get();

        return ApiResponse::success(PeriodeResource::collection($periodes));
    }

    public function store(StorePeriodeRequest $request, int $residenceId): JsonResponse
    {
        $periode = $this->budgetService->createPeriode($request->validated(), $residenceId);
        return ApiResponse::created(new PeriodeResource($periode), 'Période créée avec succès.');
    }

    public function show(Periode $periode): JsonResponse
    {
        $this->authorize('view', $periode);
        return ApiResponse::success(new PeriodeResource($periode->load(['budgetsPrevisionnels'])));
    }

    public function update(UpdatePeriodeRequest $request, Periode $periode): JsonResponse
    {
        $this->authorize('update', $periode);

        $periode->update($request->validated());

        if ($request->boolean('is_active')) {
            Periode::where('residence_id', $periode->residence_id)
                ->where('id', '!=', $periode->id)
                ->update(['is_active' => false]);
        }

        return ApiResponse::success(new PeriodeResource($periode->fresh()), 'Période mise à jour avec succès.');
    }

    public function destroy(Periode $periode): JsonResponse
    {
        $this->authorize('delete', $periode);

        if ($periode->budgetsPrevisionnels()->exists()) {
            return ApiResponse::error('Impossible de supprimer une période avec des budgets.', 409);
        }

        $periode->delete();
        return ApiResponse::success(null, 'Période supprimée avec succès.');
    }
}