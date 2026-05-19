<?php

namespace App\Repositories;

use App\Models\CompteCharge;
use Illuminate\Database\Eloquent\Collection;

class CompteChargeRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new CompteCharge());
    }

    public function findByResidence(int $residenceId): Collection
    {
        return $this->model
            ->where('residence_id', $residenceId)
            ->with(['sousCharges', 'budgetPrevisionnels'])
            ->orderBy('nom')
            ->get();
    }

    public function findWithSousCharges(int $id): ?CompteCharge
    {
        return $this->model
            ->with(['sousCharges', 'residence'])
            ->find($id);
    }

    public function findByResidenceActive(int $residenceId): Collection
    {
        return $this->model
            ->where('residence_id', $residenceId)
            ->where('is_active', true)
            ->with(['sousCharges' => fn($q) => $q->orderBy('nom')])
            ->orderBy('nom')
            ->get();
    }
}