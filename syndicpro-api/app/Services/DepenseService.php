<?php

namespace App\Services;

use App\Models\Depense;
use App\Repositories\DepenseRepository;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;

class DepenseService
{
    public function __construct(
        private readonly DepenseRepository $repository
    ) {}

    public function getByResidence(int $residenceId, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->findByResidence($residenceId, $filters);
    }

    public function create(array $data, $justificatifFile = null): Depense
    {
        $depense = $this->repository->create($data);

        if ($justificatifFile) {
            $depense->addMedia($justificatifFile)
                ->toMediaCollection('justificatifs', 'local');
        }

        return $depense->load(['sousCharge.compteCharge']);
    }

    public function update(int $id, array $data, $justificatifFile = null): Depense
    {
        $depense = $this->repository->findOrFail($id);
        $depense->update($data);

        if ($justificatifFile) {
            $depense->clearMediaCollection('justificatifs');
            $depense->addMedia($justificatifFile)
                ->toMediaCollection('justificatifs', 'local');
        }

        return $depense->fresh(['sousCharge.compteCharge']);
    }

    public function delete(int $id): bool
    {
        $depense = $this->repository->findOrFail($id);
        $depense->clearMediaCollection('justificatifs');
        return $this->repository->delete($id);
    }

    public function getJustificatifUrl(int $id): ?string
    {
        $depense = $this->repository->findOrFail($id);
        $media = $depense->getMedia('justificatifs')->first();

        if (!$media) {
            return null;
        }

        return $media->getTemporaryUrl(now()->addMinutes(60));
    }

    public function sumByCompteCharge(int $compteChargeId, int $periodeId): float
    {
        return $this->repository->sumByCompteCharge($compteChargeId, $periodeId);
    }

    public function sumBySousCharge(int $sousChargeId, int $periodeId): float
    {
        return $this->repository->sumBySousCharge($sousChargeId, $periodeId);
    }

    public function getBySousChargeForPeriode(int $sousChargeId, int $periodeId): Collection
    {
        return $this->repository->getBySousChargeForPeriode($sousChargeId, $periodeId);
    }
}