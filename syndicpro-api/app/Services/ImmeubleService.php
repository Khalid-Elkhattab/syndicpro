<?php

namespace App\Services;

use App\Models\Immeuble;
use App\Repositories\ImmeubleRepository;

class ImmeubleService
{
    public function __construct(
        private readonly ImmeubleRepository $repository
    ) {}

    public function findByResidence(int $residenceId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findByResidence($residenceId);
    }

    public function findBySyndic(int $syndicId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findBySyndic($syndicId);
    }

    public function create(array $data): Immeuble
    {
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): Immeuble
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        $immeuble = $this->repository->findOrFail($id);

        if ($immeuble->appartements()->exists()) {
            throw new \InvalidArgumentException('Cet immeuble possède des appartements. Supprimez-les d\'abord.');
        }

        return $this->repository->delete($id);
    }
}