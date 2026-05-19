<?php

namespace App\Repositories;

use App\Models\Appartement;
use Illuminate\Database\Eloquent\Collection;

class AppartementRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Appartement());
    }

    public function findByResidence(int $residenceId): Collection
    {
        return $this->model
            ->where('residence_id', $residenceId)
            ->whereNull('deleted_at')
            ->with(['immeuble', 'coproprietaire'])
            ->orderBy('numero')
            ->get();
    }

    public function findByImmeuble(int $immeubleId): Collection
    {
        return $this->model
            ->where('immeuble_id', $immeubleId)
            ->whereNull('deleted_at')
            ->with(['coproprietaire'])
            ->get();
    }

    public function findBySyndic(int $syndicId): Collection
    {
        return $this->model
            ->whereHas('residence', fn($q) => $q->where('syndic_id', $syndicId))
            ->whereNull('deleted_at')
            ->with(['immeuble.residence', 'coproprietaire'])
            ->get();
    }

    public function findWithDetails(int $id): ?Appartement
    {
        return $this->model
            ->whereNull('deleted_at')
            ->with(['immeuble.residence', 'coproprietaire', 'residence'])
            ->find($id);
    }

    public function findBySyndicFiltered(int $syndicId, array $filters = []): Collection
    {
        return $this->model
            ->whereHas('residence', fn($q) => $q->where('syndic_id', $syndicId))
            ->whereNull('deleted_at')
            ->when(isset($filters['residence_id']), fn($q) => $q->where('residence_id', $filters['residence_id']))
            ->when(isset($filters['immeuble_id']), fn($q) => $q->where('immeuble_id', $filters['immeuble_id']))
            ->with(['immeuble.residence', 'coproprietaire'])
            ->get();
    }

    public function assigner(int $id, ?int $coproprietaireId): Appartement
    {
        $appartement = $this->findOrFail($id);
        $appartement->update(['coproprietaire_id' => $coproprietaireId]);
        return $appartement->fresh(['immeuble', 'coproprietaire']);
    }

    public function softDelete(int $id): bool
    {
        return $this->findOrFail($id)->delete();
    }

public function findActifsByResidence(int $residenceId): Collection
    {
        return $this->model
            ->where('residence_id', $residenceId)
            ->whereNull('deleted_at')
            ->whereNotNull('coproprietaire_id')
            ->with('coproprietaire')
            ->get();
    }

    public function findByCoproprietaires(int $coproprietairesId): Collection
    {
        return $this->model
            ->where('coproprietaire_id', $coproprietairesId)
            ->whereNull('deleted_at')
            ->with(['immeuble', 'residence'])
            ->orderBy('numero')
            ->get();
    }
}