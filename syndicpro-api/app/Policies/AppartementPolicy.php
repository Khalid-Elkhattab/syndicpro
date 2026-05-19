<?php

namespace App\Policies;

use App\Models\Appartement;
use App\Models\User;
use App\Models\Residence;
use App\Enums\UserRole;

class AppartementPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Syndic;
    }

    public function view(User $user, Appartement $appartement): bool
    {
        return $appartement->residence?->syndic_id === $user->id
            || ($appartement->residence instanceof Residence ? $user->id === $appartement->residence->syndic_id : false);
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Syndic;
    }

    public function update(User $user, Appartement $appartement): bool
    {
        return $this->view($user, $appartement);
    }

    public function delete(User $user, Appartement $appartement): bool
    {
        return $this->view($user, $appartement);
    }

    public function assigner(User $user, Appartement $appartement): bool
    {
        return $this->view($user, $appartement);
    }
}