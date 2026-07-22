<?php

namespace App\Repositories;

use App\Models\Residence;
use Illuminate\Database\Eloquent\Collection;

class ResidenceRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Residence());
    }

    public function findBySyndic(int $syndicId): Collection
    {
        return $this->model
            ->where('syndic_id', $syndicId)
            ->with([
                'immeubles',
                'periodes' => fn($q) => $q->where('is_active', true)->limit(1),
            ])
            ->orderBy('nom')
            ->get();
    }

    public function findWithStats(int $syndicId): Collection
    {
        return $this->model
            ->where('syndic_id', $syndicId)
            ->with([
                'immeubles',
                'periodes' => fn($q) => $q->where('is_active', true)->limit(1),
            ])
            ->withCount(['appartements' => fn($q) => $q->whereNull('deleted_at')])
            ->withCount('immeubles')
            ->orderBy('nom')
            ->get();
    }

    public function findWithRelations(int $id): ?Residence
    {
        return $this->model
            ->with(['syndic', 'immeubles.appartements.coproprietaire', 'periodes'])
            ->find($id);
    }
}