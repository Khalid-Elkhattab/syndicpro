<?php

namespace App\Services;

use App\Models\SousCharge;
use App\Repositories\SousChargeRepository;

class SousChargeService
{
    public function __construct(
        private readonly SousChargeRepository $repository
    ) {}

    public function getByCompteCharge(int $compteChargeId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findByCompteCharge($compteChargeId);
    }

    public function getByResidence(int $residenceId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findByResidence($residenceId);
    }

    public function create(array $data, int $compteChargeId, int $residenceId): SousCharge
    {
        return $this->repository->create(array_merge($data, [
            'compte_charge_id' => $compteChargeId,
            'residence_id' => $residenceId,
        ]));
    }

    public function update(int $id, array $data): SousCharge
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        $sousCharge = $this->repository->findOrFail($id);

        $sousCharge->load('depenses');

        foreach ($sousCharge->depenses as $depense) {
            $depense->clearMediaCollection('justificatifs');
            $depense->delete();
        }

        return $this->repository->delete($id);
    }
}