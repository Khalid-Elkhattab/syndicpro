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
            ->where('residence_id', $residenceId)
            ->with(['sousCharge.compteCharge'])
            ->orderByDesc('date');

        if (!empty($filters['sous_charge_id'])) {
            $query->where('sous_charge_id', $filters['sous_charge_id']);
        }

        if (!empty($filters['compte_charge_id'])) {
            $query->whereHas('sousCharge', fn($q) => $q->where('compte_charge_id', $filters['compte_charge_id']));
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
        return (float) $this->model
            ->whereHas('sousCharge', fn($q) => $q->where('compte_charge_id', $compteChargeId))
            ->where('residence_id', fn($q) => $q->select('id')->from('periodes')->where('id', $periodeId)->value('residence_id'))
            ->whereHas('residence.periodes', fn($q) => $q->where('id', $periodeId)->where('is_active', true))
            ->sum('montant');
    }

    public function sumBySousCharge(int $sousChargeId, int $periodeId): float
    {
        return (float) $this->model
            ->where('sous_charge_id', $sousChargeId)
            ->whereHas('residence.periodes', fn($q) => $q->where('id', $periodeId)->where('is_active', true))
            ->sum('montant');
    }

    public function getBySousChargeForPeriode(int $sousChargeId, int $periodeId): Collection
    {
        return $this->model
            ->where('sous_charge_id', $sousChargeId)
            ->whereHas('residence.periodes', fn($q) => $q->where('id', $periodeId))
            ->with(['sousCharge.compteCharge'])
            ->orderByDesc('date')
            ->get();
    }
}