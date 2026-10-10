<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class PaymentPolicy
{
    public function record(User $user): bool
    {
        return $user->can('payments.create') || $user->role === UserRole::Syndic;
    }

    public function cancel(User $user): bool
    {
        return $user->can('payments.cancel') || $user->role === UserRole::Syndic;
    }
}
