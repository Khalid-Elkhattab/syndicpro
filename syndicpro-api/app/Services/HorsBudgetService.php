<?php

namespace App\Services;

use App\Models\HorsBudget;
use App\Repositories\HorsBudgetRepository;
use Illuminate\Pagination\LengthAwarePaginator;

class HorsBudgetService
{
    public function __construct(
        private readonly HorsBudgetRepository $repository
    ) {}

    public function getByResidence(int $residenceId, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->findByResidence($residenceId, $filters);
    }

    public function create(array $data, $justificatifFile = null): HorsBudget
    {
        $horsBudget = $this->repository->create($data);

        if ($justificatifFile) {
            $horsBudget->addMedia($justificatifFile)
                ->toMediaCollection('justificatifs', 'local');
        }

        return $horsBudget;
    }

    public function update(int $id, array $data, $justificatifFile = null): HorsBudget
    {
        $horsBudget = $this->repository->findOrFail($id);
        $horsBudget->update($data);

        if ($justificatifFile) {
            $horsBudget->clearMediaCollection('justificatifs');
            $horsBudget->addMedia($justificatifFile)
                ->toMediaCollection('justificatifs', 'local');
        }

        return $horsBudget->fresh();
    }

    public function delete(int $id): bool
    {
        $horsBudget = $this->repository->findOrFail($id);
        $horsBudget->clearMediaCollection('justificatifs');
        return $this->repository->delete($id);
    }

    public function getJustificatifUrl(int $id): ?string
    {
        $horsBudget = $this->repository->findOrFail($id);
        $media = $horsBudget->getMedia('justificatifs')->first();

        if (!$media) {
            return null;
        }

        return $media->getTemporaryUrl(now()->addMinutes(60));
    }

    public function sumByResidence(int $residenceId, ?int $periodeId = null): float
    {
        return $this->repository->sumByResidence($residenceId, $periodeId);
    }
}