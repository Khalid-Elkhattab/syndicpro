<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Residence;

class BudgetPolicy
{
    public function manage(User $user, Residence $residence): bool
    {
        return $user->id === $residence->syndic_id;
    }
}