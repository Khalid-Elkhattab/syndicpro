<?php

namespace App\Services;

use App\Models\CompteCharge;
use App\Repositories\CompteChargeRepository;

class CompteChargeService
{
    public function __construct(
        private readonly CompteChargeRepository $repository
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
        return $this->repository->create(array_merge($data, ['residence_id' => $residenceId]));
    }

    public function update(int $id, array $data): CompteCharge
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        $compte = $this->repository->findOrFail($id);

        if ($compte->sousCharges()->count() > 0) {
            throw new \InvalidArgumentException('Ce compte a des sous-charges associées.');
        }

        if ($compte->budgetPrevisionnels()->count() > 0) {
            throw new \InvalidArgumentException('Ce compte est lié à des budgets prévisionnels.');
        }

        return $this->repository->delete($id);
    }
}