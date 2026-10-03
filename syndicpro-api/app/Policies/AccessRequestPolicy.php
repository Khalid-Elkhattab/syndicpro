<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\AccountRequest;
use App\Models\User;

class AccessRequestPolicy
{
    public function review(User $user, AccountRequest $request): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::tryFrom((string) $user->role);

        // Transition : rôle legacy `syndic` = toutes les permissions métier.
        if (! $user->can('account_requests.review') && $role !== UserRole::Syndic) {
            return false;
        }

        return in_array($request->residence_id, $user->assignedResidenceIds(), true)
            || ($user->can_access_all_residences ?? false);
    }
}
