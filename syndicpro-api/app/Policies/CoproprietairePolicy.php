<?php

namespace App\Policies;

use App\Models\User;
use App\Enums\UserRole;

class CoproprietairePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Syndic;
    }

    public function view(User $user, User $coproprietaire): bool
    {
        if ($user->role !== UserRole::Syndic) {
            return false;
        }

        if ($user->id === $coproprietaire->id) {
            return true;
        }

        return $coproprietaire->appartements()
            ->whereHas('residence', fn($q) => $q->where('syndic_id', $user->id))
            ->exists();
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Syndic;
    }

    public function update(User $user, User $coproprietaire): bool
    {
        if ($user->role !== UserRole::Syndic) {
            return false;
        }

        return $coproprietaire->appartements()
            ->whereHas('residence', fn($q) => $q->where('syndic_id', $user->id))
            ->exists();
    }

    public function delete(User $user, User $coproprietaire): bool
    {
        return $this->update($user, $coproprietaire);
    }

    public function resetPassword(User $user, User $coproprietaire): bool
    {
        return $this->update($user, $coproprietaire);
    }

    public function toggleActif(User $user, User $coproprietaire): bool
    {
        return $this->update($user, $coproprietaire);
    }
}