<?php

namespace App\Policies;

use App\Models\Reclamation;
use App\Models\User;
use App\Enums\UserRole;

class ReclamationPolicy
{
    public function create(User $user, \App\Models\Residence $residence): bool
    {
        return $user->role === UserRole::Coproprietaire;
    }

    public function view(User $user, Reclamation $reclamation): bool
    {
        return $user->id === $reclamation->coproprietaire_id 
            || $user->id === $reclamation->residence->syndic_id;
    }

    public function updateStatut(User $user, Reclamation $reclamation): bool
    {
        return $user->id === $reclamation->residence->syndic_id;
    }
}