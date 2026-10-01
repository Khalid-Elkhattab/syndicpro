<?php

namespace App\Repositories;

use App\Models\Reclamation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class ReclamationRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Reclamation());
    }

    protected function model(): Reclamation
    {
        return new Reclamation();
    }

    public function findByResidence(int $residenceId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model()
            ->with(['coproprietaire', 'appartement'])
            ->where('residence_id', $residenceId);

        $query = $this->applyFilters($query, $filters);

        return $query->orderByRaw("CASE WHEN priorite = 'urgente' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20, ['*'], 'page', $filters['page'] ?? 1);
    }

    public function findByCoproprietaire(int $coproprietaireId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model()
            ->with(['appartement', 'residence'])
            ->where('coproprietaire_id', $coproprietaireId)
            ->orderByRaw("CASE WHEN priorite = 'urgente' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->get();
    }

    public function findWithDetails(int $id): ?Reclamation
    {
        return $this->model()
            ->with(['coproprietaire', 'residence', 'appartement'])
            ->find($id);
    }

    public function findWithDetailsForCoproprietaires(int $id): ?Reclamation
    {
        return $this->model()
            ->with(['appartement.immeuble', 'residence'])
            ->find($id);
    }

    public function update(int $id, array $data): Reclamation
    {
        $reclamation = $this->findOrFail($id);
        $reclamation->update($data);
        return $reclamation->fresh();
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        if (!empty($filters['priorite'])) {
            $query->where('priorite', $filters['priorite']);
        }

        if (!empty($filters['date_debut'])) {
            $query->whereDate('created_at', '>=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $query->whereDate('created_at', '<=', $filters['date_fin']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('coproprietaire', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return $query;
    }
}