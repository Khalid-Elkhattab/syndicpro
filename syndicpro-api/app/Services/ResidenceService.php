<?php

namespace App\Services;

use App\Models\Residence;
use App\Repositories\ResidenceRepository;

class ResidenceService
{
    public function __construct(
        private readonly ResidenceRepository $repository
    ) {}

    public function getBySyndic(int $syndicId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findBySyndic($syndicId);
    }

    public function getWithStats(int $syndicId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findWithStats($syndicId);
    }

    public function create(array $data, int $syndicId): Residence
    {
        return $this->repository->create(array_merge($data, ['syndic_id' => $syndicId]));
    }

    public function update(int $id, array $data): Residence
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }
}