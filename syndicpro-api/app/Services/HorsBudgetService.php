<?php

namespace App\Services;

use App\Models\HorsBudget;
use App\Models\Periode;
use App\Repositories\HorsBudgetRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

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

        $this->clearBudgetCache($data['residence_id'], $data['date']);

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

        $this->clearBudgetCache($horsBudget->residence_id, $horsBudget->date);

        return $horsBudget->fresh();
    }

    public function delete(int $id): bool
    {
        $horsBudget = $this->repository->findOrFail($id);
        $horsBudget->clearMediaCollection('justificatifs');

        $this->clearBudgetCache($horsBudget->residence_id, $horsBudget->date);

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

    private function clearBudgetCache(int $residenceId, string $date): void
    {
        $year = date('Y', strtotime($date));
        $periodes = Periode::where('residence_id', $residenceId)
            ->where('annee', $year)
            ->get();

        foreach ($periodes as $periode) {
            Cache::forget("budget_summary_{$periode->id}");
        }
    }
}