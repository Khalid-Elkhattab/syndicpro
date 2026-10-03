<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Lot;
use App\Models\User;

class LotTransferPolicy
{
    public function handover(User $user, Lot $lot): bool
    {
        if (! $user->can('owners.handover') && $user->role !== UserRole::Syndic) {
            return false;
        }

        return in_array($lot->residence_id, $user->assignedResidenceIds(), true)
            || ($user->can_access_all_residences ?? false);
    }

    public function handoverOverride(User $user, Lot $lot): bool
    {
        // Transition : rôle legacy `syndic` = toutes les permissions métier.
        if (! $user->can('owners.handover_override') && $user->role !== UserRole::Syndic) {
            return false;
        }

        return $this->handover($user, $lot);
    }
}
