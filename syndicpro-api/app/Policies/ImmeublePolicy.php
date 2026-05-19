<?php

namespace App\Policies;

use App\Models\Immeuble;
use App\Models\User;
use App\Models\Residence;
use App\Enums\UserRole;

class ImmeublePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Syndic;
    }

    public function view(User $user, Immeuble $immeuble): bool
    {
        return $user->id === $immeuble->residence?->syndic_id
            || ($immeuble->residence instanceof Residence ? $user->id === $immeuble->residence->syndic_id : false);
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Syndic;
    }

    public function update(User $user, Immeuble $immeuble): bool
    {
        return $this->view($user, $immeuble);
    }

    public function delete(User $user, Immeuble $immeuble): bool
    {
        return $this->view($user, $immeuble);
    }
}