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
        $residences = $this->findBySyndic($syndicId);

        foreach ($residences as $residence) {
            $residence->nb_immeubles = $residence->immeubles->count();
            $residence->nb_appartements = $residence->appartements()->whereNull('deleted_at')->count();
        }

        return $residences;
    }

    public function findWithRelations(int $id): ?Residence
    {
        return $this->model
            ->with(['syndic', 'immeubles.appartements.coproprietaire', 'periodes'])
            ->find($id);
    }
}