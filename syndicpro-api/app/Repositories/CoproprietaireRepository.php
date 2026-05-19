<?php

namespace App\Repositories;

use App\Models\User;
use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class CoproprietaireRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new User());
    }

    public function findBySyndic(int $syndicId): Collection
    {
        return $this->model
            ->where('role', UserRole::Coproprietaire)
            ->whereHas('appartements.residence', fn($q) => $q->where('syndic_id', $syndicId))
            ->with(['appartements.residence'])
            ->get();
    }

    public function findWithStats(int $id): User
    {
        return $this->model
            ->with([
                'appartements.residence.immeuble',
                'cotisationDetails' => fn($q) => $q->latest()->limit(5),
                'paiements' => fn($q) => $q->latest()->limit(5),
                'reclamations' => fn($q) => $q->latest()->limit(3),
            ])
            ->findOrFail($id);
    }

    public function paginateFiltered(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = $this->model
            ->where('role', UserRole::Coproprietaire)
            ->with(['appartements'])
            ->when(isset($filters['search']) && $filters['search'], fn($q) => $q->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('username', 'like', '%' . $filters['search'] . '%');
            }))
            ->when(isset($filters['residence_id']) && $filters['residence_id'], fn($q) => $q
                ->whereHas('appartements', fn($q2) => $q2->where('residence_id', $filters['residence_id']))
            )
            ->when(isset($filters['is_active']), fn($q) => $q->where('is_active', $filters['is_active']));

        return $query->orderBy('name')->paginate($perPage);
    }

    public function findActifsByResidence(int $residenceId): Collection
    {
        return $this->model
            ->where('role', UserRole::Coproprietaire)
            ->where('is_active', true)
            ->whereHas('appartements', fn($q) => $q->where('residence_id', $residenceId))
            ->with(['appartements' => fn($q) => $q->where('residence_id', $residenceId)])
            ->get();
    }
}