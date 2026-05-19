<?php

namespace App\Policies;

use App\Models\Cotisation;
use App\Models\User;
use App\Models\CotisationDetail;
use App\Enums\UserRole;

class CotisationPolicy
{
    public function viewAny(User $user, \App\Models\Residence $residence): bool
    {
        return $user->id === $residence->syndic_id;
    }

    public function create(User $user, \App\Models\Residence $residence): bool
    {
        return $user->id === $residence->syndic_id;
    }

    public function viewMine(User $user, CotisationDetail $detail): bool
    {
        return $user->id === $detail->coproprietaire_id;
    }
}