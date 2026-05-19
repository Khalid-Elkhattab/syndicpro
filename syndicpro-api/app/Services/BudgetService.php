<?php

namespace App\Services;

use App\Models\BudgetPrevisionnel;
use App\Models\Periode;
use App\Repositories\BudgetPrevisionnelRepository;
use App\Repositories\DepenseRepository;
use Illuminate\Support\Facades\Cache;

class BudgetService
{
    public function __construct(
        private BudgetPrevisionnelRepository $budgetRepo,
        private DepenseRepository $depenseRepo,
    ) {}

    public function createPeriode(array $data, int $residenceId): Periode
    {
        $periode = Periode::create([
            'residence_id' => $residenceId,
            'annee' => $data['annee'],
            'date_debut' => $data['date_debut'],
            'date_fin' => $data['date_fin'],
            'is_active' => $data['is_active'] ?? false,
        ]);

        $this->budgetRepo->createInitialBudgetsForPeriode($periode->id);

        return $periode->load(['budgetsPrevisionnels.compteCharge']);
    }

    public function setBudget(int $periodeId, int $compteChargeId, float $montant): BudgetPrevisionnel
    {
        $budget = $this->budgetRepo->upsert($periodeId, $compteChargeId, $montant);

        Cache::forget("budget_summary_{$periodeId}");

        return $budget;
    }

    public function recalculerConsomme(int $budgetPrevisionnelId): void
    {
        $budget = $this->budgetRepo->findWithCompteCharge($budgetPrevisionnelId);

        if (!$budget || !$budget->compteCharge) {
            return;
        }

        $consomme = $this->depenseRepo->sumByCompteCharge(
            $budget->compte_charge_id,
            $budget->periode_id
        );

        $this->budgetRepo->updateConsomme($budgetPrevisionnelId, $consomme);

        Cache::forget("budget_summary_{$budget->periode_id}");
    }

    public function getBudgetSummary(int $periodeId): array
    {
        return Cache::remember(
            "budget_summary_{$periodeId}",
            now()->addDay(),
            function () use ($periodeId) {
                return $this->budgetRepo->getSummaryByPeriode($periodeId);
            }
        );
    }

    public function checkDepassement(int $budgetPrevisionnelId): bool
    {
        $budget = $this->budgetRepo->findWithCompteCharge($budgetPrevisionnelId);
        return (float) $budget->montant_consomme > (float) $budget->montant_prevu;
    }

    public function getActivePeriodeForResidence(int $residenceId): ?Periode
    {
        return Periode::where('residence_id', $residenceId)
            ->where('is_active', true)
            ->first();
    }
}