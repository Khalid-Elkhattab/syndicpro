<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\Budget\StoreBudgetRequest;
use App\Http\Requests\Syndic\Budget\UpdateBudgetRequest;
use App\Http\Resources\BudgetPrevisionnelResource;
use App\Http\Resources\BudgetSummaryResource;
use App\Models\Periode;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class BudgetPrevisionnelController extends Controller
{
    public function __construct(
        private readonly BudgetService $budgetService
    ) {}

    public function summary(Periode $periode): JsonResponse
    {
        $this->authorize('view', $periode);

        $summary = $this->budgetService->getBudgetSummary($periode->id);
        return ApiResponse::success(new BudgetSummaryResource($summary));
    }

    public function store(StoreBudgetRequest $request, Periode $periode): JsonResponse
    {
        $this->authorize('view', $periode);

        $budget = $this->budgetService->setBudget(
            $periode->id,
            $request->input('compte_charge_id'),
            (float) $request->input('montant_prevu')
        );

        return ApiResponse::created(new BudgetPrevisionnelResource($budget), 'Budget enregistré avec succès.');
    }

    public function update(UpdateBudgetRequest $request, \App\Models\BudgetPrevisionnel $budget): JsonResponse
    {
        $this->authorize('view', $budget->periode);

        $budget->update([
            'montant_prevu' => (float) $request->input('montant_prevu'),
        ]);

        Cache::forget("budget_summary_{$budget->periode_id}");

        return ApiResponse::success(new BudgetPrevisionnelResource($budget->fresh(['compteCharge'])), 'Budget mis à jour avec succès.');
    }
}