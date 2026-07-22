<?php

namespace App\Repositories;

use App\Models\HorsBudget;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class HorsBudgetRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new HorsBudget());
    }

    public function findByResidence(int $residenceId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model
            ->where('residence_id', $residenceId)
            ->orderByDesc('date');

        if (!empty($filters['date_debut'])) {
            $query->where('date', '>=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $query->where('date', '<=', $filters['date_fin']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);
        return $query->paginate($perPage);
    }
}
