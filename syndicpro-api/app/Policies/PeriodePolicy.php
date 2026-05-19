<?php

namespace App\Policies;

use App\Models\Periode;
use App\Models\User;
use App\Enums\UserRole;

class PeriodePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Syndic;
    }

    public function view(User $user, Periode $periode): bool
    {
        return $user->id === $periode->residence->syndic_id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Syndic;
    }

    public function update(User $user, Periode $periode): bool
    {
        return $user->id === $periode->residence->syndic_id;
    }

    public function delete(User $user, Periode $periode): bool
    {
        return $user->id === $periode->residence->syndic_id;
    }
}