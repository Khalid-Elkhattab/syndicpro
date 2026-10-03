<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class QuitusPolicy
{
    public function issue(User $user): bool
    {
        return $user->can('quitus.issue') || $user->role === UserRole::Syndic;
    }
}
