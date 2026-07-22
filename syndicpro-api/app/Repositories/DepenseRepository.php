<?php

namespace App\Repositories;

use App\Models\Depense;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class DepenseRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Depense());
    }

    public function findByResidence(int $residenceId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model
            ->where('depenses.residence_id', $residenceId)
            ->with(['sousCharge.compteCharge'])
            ->orderByDesc('depenses.date');

        if (!empty($filters['sous_charge_id'])) {
            $query->where('sous_charge_id', $filters['sous_charge_id']);
        }

        if (!empty($filters['compte_charge_id'])) {
            $query->join('sous_charges', 'depenses.sous_charge_id', '=', 'sous_charges.id')
                  ->where('sous_charges.compte_charge_id', $filters['compte_charge_id'])
                  ->select('depenses.*');
        }

        if (!empty($filters['date_debut'])) {
            $query->where('date', '>=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $query->where('date', '<=', $filters['date_fin']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $query->paginate($perPage);
    }

    public function sumByCompteCharge(int $compteChargeId, int $periodeId): float
    {
        $residenceId = \App\Models\Periode::where('id', $periodeId)->value('residence_id');

        if (!$residenceId) {
            return 0;
        }

        return (float) $this->model
            ->join('sous_charges', 'depenses.sous_charge_id', '=', 'sous_charges.id')
            ->where('sous_charges.compte_charge_id', $compteChargeId)
            ->where('depenses.residence_id', $residenceId)
            ->sum('depenses.montant');
    }

    public function sumBySousCharge(int $sousChargeId, int $periodeId): float
    {
        $residenceId = \App\Models\Periode::where('id', $periodeId)->value('residence_id');

        if (!$residenceId) {
            return 0;
        }

        return (float) $this->model
            ->where('sous_charge_id', $sousChargeId)
            ->where('residence_id', $residenceId)
            ->sum('montant');
    }

    public function getBySousChargeForPeriode(int $sousChargeId, int $periodeId): Collection
    {
        $residenceId = \App\Models\Periode::where('id', $periodeId)->value('residence_id');

        return $this->model
            ->where('sous_charge_id', $sousChargeId)
            ->where('residence_id', $residenceId)
            ->with(['sousCharge.compteCharge'])
            ->orderByDesc('date')
            ->get();
    }
}
