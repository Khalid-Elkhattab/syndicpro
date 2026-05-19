<?php

namespace App\Repositories;

use App\Models\SousCharge;
use Illuminate\Database\Eloquent\Collection;

class SousChargeRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new SousCharge());
    }

    public function findByCompteCharge(int $compteChargeId): Collection
    {
        return $this->model
            ->where('compte_charge_id', $compteChargeId)
            ->with(['compteCharge'])
            ->orderBy('nom')
            ->get();
    }

    public function findByResidence(int $residenceId): Collection
    {
        return $this->model
            ->where('residence_id', $residenceId)
            ->with(['compteCharge'])
            ->orderBy('nom')
            ->get();
    }

    public function findWithCompteCharge(int $id): ?SousCharge
    {
        return $this->model
            ->with(['compteCharge', 'residence'])
            ->find($id);
    }
}