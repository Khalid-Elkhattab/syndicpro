<?php

namespace App\Services;

use App\Models\CompteCharge;
use App\Repositories\BudgetPrevisionnelRepository;
use App\Repositories\CompteChargeRepository;
use Illuminate\Support\Facades\Cache;

class CompteChargeService
{
    public function __construct(
        private readonly CompteChargeRepository $repository,
        private readonly BudgetPrevisionnelRepository $budgetRepo,
    ) {}

    public function getByResidence(int $residenceId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findByResidence($residenceId);
    }

    public function getByResidenceActive(int $residenceId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findByResidenceActive($residenceId);
    }

    public function create(array $data, int $residenceId): CompteCharge
    {
        $compte = $this->repository->create(array_merge($data, ['residence_id' => $residenceId]));

        $budgets = $this->budgetRepo->syncCompteChargeToPeriods($compte->id, $residenceId);

        foreach ($budgets as $budget) {
            Cache::forget("budget_summary_{$budget->periode_id}");
        }

        return $compte;
    }

    public function update(int $id, array $data): CompteCharge
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        $compte = $this->repository->findOrFail($id);

        $compte->load(['budgetPrevisionnels', 'sousCharges.depenses']);

        $periodeIds = $compte->budgetPrevisionnels->pluck('periode_id')->unique()->toArray();

        foreach ($compte->sousCharges as $sousCharge) {
            foreach ($sousCharge->depenses as $depense) {
                $depense->clearMediaCollection('justificatifs');
                $depense->deleteQuietly();
            }
            $sousCharge->delete();
        }

        $compte->budgetPrevisionnels()->delete();

        foreach ($periodeIds as $periodeId) {
            Cache::forget("budget_summary_{$periodeId}");
        }

        return $this->repository->delete($id);
    }
}