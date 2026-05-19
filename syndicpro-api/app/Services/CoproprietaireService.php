<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\CoproprietaireRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class CoproprietaireService
{
    public function __construct(
        private readonly CoproprietaireRepository $repository
    ) {}

    public function index(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->repository->paginateFiltered($filters, $perPage);
    }

    public function findBySyndic(int $syndicId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->findBySyndic($syndicId);
    }

    public function getWithStats(int $id): User
    {
        return $this->repository->findWithStats($id);
    }

    public function create(array $data): User
    {
        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $baseUsername = $data['username'];
        $counter = 1;
        while (User::where('username', $data['username'])->exists()) {
            $data['username'] = $baseUsername . $counter;
            $counter++;
        }

        $user = $this->repository->create($data);
        $user->assignRole('coproprietaire');

        return $user;
    }

    public function update(int $id, array $data): User
    {
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (isset($data['username'])) {
            $baseUsername = $data['username'];
            $counter = 1;
            while (User::where('username', $data['username'])->where('id', '!=', $id)->exists()) {
                $data['username'] = $baseUsername . $counter;
                $counter++;
            }
        }

        return $this->repository->update($id, $data);
    }

    public function resetPassword(int $id, string $password): User
    {
        return $this->repository->update($id, [
            'password' => Hash::make($password),
        ]);
    }

    public function toggleActif(int $id): User
    {
        $user = $this->repository->findOrFail($id);
        $user->is_active = !$user->is_active;
        $user->save();

        if (!$user->is_active) {
            $user->delete();
        } else {
            $user->restore();
        }

        return $user->fresh();
    }
}