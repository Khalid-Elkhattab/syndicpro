<?php

namespace App\Policies;

use App\Models\Residence;
use App\Models\User;
use App\Enums\UserRole;

class ResidencePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Syndic;
    }

    public function view(User $user, Residence $residence): bool
    {
        return $user->id === $residence->syndic_id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Syndic;
    }

    public function update(User $user, Residence $residence): bool
    {
        return $user->id === $residence->syndic_id;
    }

    public function delete(User $user, Residence $residence): bool
    {
        return $user->id === $residence->syndic_id;
    }
}