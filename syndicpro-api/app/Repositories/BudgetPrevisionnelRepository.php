<?php

namespace App\Repositories;

use App\Models\BudgetPrevisionnel;
use Illuminate\Database\Eloquent\Collection;

class BudgetPrevisionnelRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new BudgetPrevisionnel());
    }

    public function findByPeriode(int $periodeId): Collection
    {
        return $this->model
            ->with(['compteCharge.sousCharges'])
            ->where('periode_id', $periodeId)
            ->get();
    }

    public function findWithCompteCharge(int $id): BudgetPrevisionnel
    {
        return $this->model
            ->with(['compteCharge', 'periode'])
            ->findOrFail($id);
    }

    public function getSummaryByPeriode(int $periodeId): array
    {
        $budgets = $this->model
            ->with(['compteCharge.sousCharges', 'periode'])
            ->where('periode_id', $periodeId)
            ->get();

        if ($budgets->isEmpty()) {
            return [
                'prevu_total' => 0,
                'consomme_total' => 0,
                'restant_total' => 0,
                'hors_budget_total' => 0,
                'par_compte' => [],
            ];
        }

        $residenceId = $budgets->first()->periode->residence_id;

        // Single grouped query for all sous-charge consumptions
        $allSousChargeIds = $budgets->flatMap(fn($b) => $b->compteCharge->sousCharges->pluck('id'))->unique()->values();

        $consommationParSousCharge = collect();
        if ($allSousChargeIds->isNotEmpty()) {
            $consommationParSousCharge = \App\Models\Depense::whereIn('sous_charge_id', $allSousChargeIds)
                ->where('residence_id', $residenceId)
                ->groupBy('sous_charge_id')
                ->selectRaw('sous_charge_id, SUM(montant) as total')
                ->pluck('total', 'sous_charge_id');
        }

        $prevuTotal = 0;
        $consommeTotal = 0;

        $parCompte = $budgets->map(function ($budget) use (&$prevuTotal, &$consommeTotal, $consommationParSousCharge) {
            $prevuTotal += (float) $budget->montant_prevu;
            $consommeTotal += (float) $budget->montant_consomme;

            $sousChargesDetail = $budget->compteCharge->sousCharges->map(function ($sousCharge) use ($consommationParSousCharge) {
                return [
                    'sous_charge' => [
                        'id' => $sousCharge->id,
                        'nom' => $sousCharge->nom,
                    ],
                    'consomme' => (float) ($consommationParSousCharge[$sousCharge->id] ?? 0),
                ];
            });

            return [
                'id' => $budget->id,
                'compte_charge_id' => $budget->compte_charge_id,
                'compte_charge' => [
                    'id' => $budget->compteCharge->id,
                    'nom' => $budget->compteCharge->nom,
                ],
                'montant_prevu' => (float) $budget->montant_prevu,
                'montant_consomme' => (float) $budget->montant_consomme,
                'montant_restant' => (float) $budget->montant_restant,
                'pourcentage_consomme' => (float) $budget->pourcentage_consomme,
                'est_depasse' => (bool) $budget->est_depasse,
                'sous_charges_detail' => $sousChargesDetail->toArray(),
            ];
        });

        // Direct query by residence_id instead of subquery through periodes
        $horsBudgetTotal = \App\Models\HorsBudget::where('residence_id', $residenceId)
            ->whereYear('date', $budgets->first()->periode->annee)
            ->sum('montant');

        return [
            'prevu_total' => $prevuTotal,
            'consomme_total' => $consommeTotal,
            'restant_total' => $prevuTotal - $consommeTotal,
            'hors_budget_total' => (float) $horsBudgetTotal,
            'par_compte' => $parCompte->toArray(),
        ];
    }

    public function updateConsomme(int $id, float $montant): void
    {
        $this->model->findOrFail($id)->update(['montant_consomme' => $montant]);
    }

    public function upsert(int $periodeId, int $compteChargeId, float $montantPrevu): BudgetPrevisionnel
    {
        $budget = $this->model->updateOrCreate(
            [
                'periode_id' => $periodeId,
                'compte_charge_id' => $compteChargeId,
            ],
            [
                'montant_prevu' => $montantPrevu,
            ]
        );

        return $budget->fresh(['compteCharge']);
    }

    public function findByResidence(int $residenceId): Collection
    {
        return $this->model
            ->whereHas('periode', fn($q) => $q->where('residence_id', $residenceId))
            ->with(['compteCharge', 'periode'])
            ->get();
    }

    public function createInitialBudgetsForPeriode(int $periodeId): Collection
    {
        $periode = \App\Models\Periode::with('residence.compteCharges')->findOrFail($periodeId);
        $compteCharges = $periode->residence->compteCharges()->where('is_active', true)->get();

        $budgets = [];

        foreach ($compteCharges as $compteCharge) {
            $budget = $this->model->create([
                'periode_id' => $periodeId,
                'compte_charge_id' => $compteCharge->id,
                'montant_prevu' => 0,
                'montant_consomme' => 0,
            ]);
            $budgets[] = $budget;
        }

        return new Collection($budgets);
    }
}