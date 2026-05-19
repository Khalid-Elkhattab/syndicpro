<?php

namespace App\Repositories;

use App\Models\Immeuble;
use Illuminate\Database\Eloquent\Collection;

class ImmeubleRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Immeuble());
    }

    public function findByResidence(int $residenceId): Collection
    {
        return $this->model
            ->where('residence_id', $residenceId)
            ->withCount('appartements')
            ->orderBy('nom')
            ->get();
    }

    public function findBySyndic(int $syndicId): Collection
    {
        return $this->model
            ->whereHas('residence', fn($q) => $q->where('syndic_id', $syndicId))
            ->with(['residence', 'appartements'])
            ->get();
    }

    public function findWithAppartements(int $id): ?Immeuble
    {
        return $this->model
            ->with(['residence', 'appartements.coproprietaire'])
            ->find($id);
    }

    public function findBySyndicFiltered(int $syndicId, array $filters = []): Collection
    {
        return $this->model
            ->whereHas('residence', fn($q) => $q->where('syndic_id', $syndicId))
            ->when(isset($filters['residence_id']), fn($q) => $q->where('residence_id', $filters['residence_id']))
            ->with(['residence', 'appartements'])
            ->get();
    }
}