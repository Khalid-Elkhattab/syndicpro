<?php

namespace App\Services;

use App\Models\Appartement;
use App\Repositories\AppartementRepository;

class AppartementService
{
    public function __construct(
        private readonly AppartementRepository $repository
    ) {}

    public function findByResidence(int $residenceId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findByResidence($residenceId);
    }

    public function findByImmeuble(int $immeubleId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findByImmeuble($immeubleId);
    }

    public function findBySyndic(int $syndicId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findBySyndic($syndicId);
    }

    public function create(array $data): Appartement
    {
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): Appartement
    {
        return $this->repository->update($id, $data);
    }

    public function assigner(int $id, ?int $coproprietaireId): Appartement
    {
        return $this->repository->assigner($id, $coproprietaireId);
    }

    public function delete(int $id): bool
    {
        return $this->repository->softDelete($id);
    }
}