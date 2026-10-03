<?php

namespace App\Services;

use App\Enums\AccountStatus;
use App\Enums\UserType;
use App\Models\User;
use App\Repositories\CoproprietaireRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class CoproprietaireService
{
    public function __construct(
        private readonly CoproprietaireRepository $repository,
        private readonly OwnerAccountService $accounts,
    ) {}

    public function index(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->repository->paginateFiltered($filters, $perPage);
    }

    public function findBySyndic(int $syndicId): Collection
    {
        return $this->repository->findBySyndic($syndicId);
    }

    public function getWithStats(int $id): User
    {
        return $this->repository->findWithStats($id);
    }

    /**
     * Crée le compte. Avec mot de passe (transition legacy) → actif immédiat.
     * Sans mot de passe (recommandé) → pending_activation + lien à transmettre.
     *
     * @return array{user: User, activation_token: ?string}
     */
    public function create(array $data): array
    {
        $withPassword = ! empty($data['password']);

        if ($withPassword) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
            // Colonne password non-nullable (transition) : hash inutilisable en attendant l’activation.
            $data['password'] = Hash::make(Str::random(40));
        }

        $baseUsername = $data['username'];
        $counter = 1;
        while (User::where('username', $data['username'])->exists()) {
            $data['username'] = $baseUsername.$counter;
            $counter++;
        }

        $data['type'] = UserType::Owner->value;
        $data['status'] = $withPassword
            ? AccountStatus::Active->value
            : AccountStatus::PendingActivation->value;

        $user = $this->repository->create($data);
        // Le rôle peut ne pas exister sur une base fraîche (seeders non joués) : le créer au besoin.
        Role::findOrCreate('coproprietaire', 'web');
        $user->assignRole('coproprietaire');

        $token = null;
        if (! $withPassword) {
            $token = $this->accounts->issueActivation($user)['token'];
            $user->refresh();
        } else {
            $user->forceFill(['password_set_at' => now()])->save();
        }

        return ['user' => $user, 'activation_token' => $token];
    }

    public function update(int $id, array $data): User
    {
        if (isset($data['password']) && ! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (isset($data['username'])) {
            $baseUsername = $data['username'];
            $counter = 1;
            while (User::where('username', $data['username'])->where('id', '!=', $id)->exists()) {
                $data['username'] = $baseUsername.$counter;
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
        $user->is_active = ! $user->is_active;
        $user->save();

        if (! $user->is_active) {
            $user->delete();
        } else {
            $user->restore();
        }

        return $user->fresh();
    }
}
