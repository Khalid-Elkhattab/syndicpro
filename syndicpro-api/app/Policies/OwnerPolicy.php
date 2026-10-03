<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Lot;
use App\Models\Owner;
use App\Models\Residence;
use App\Models\User;

class OwnerPolicy
{
    private function inScope(User $user, Owner $owner): bool
    {
        $residenceIds = $owner->ownerships()->with('lot')->get()
            ->pluck('lot.residence_id')->filter()->unique()->all();

        if (empty($residenceIds)) {
            return $user->role === UserRole::Syndic;
        }

        return ! empty(array_intersect($residenceIds, $user->assignedResidenceIds()))
            || ($user->can_access_all_residences ?? false);
    }

    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Syndic || $user->can('owners.view');
    }

    public function view(User $user, Owner $owner): bool
    {
        return $this->inScope($user, $owner);
    }

    public function viewIdentity(User $user, Owner $owner): bool
    {
        return $user->can('owners.view_identity') && $this->inScope($user, $owner);
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Syndic || $user->can('owners.create');
    }

    /**
     * Modifier la fiche (identité, contacts, notes).
     * Les biens se changent uniquement via transfert.
     */
    public function update(User $user, Owner $owner): bool
    {
        if ($user->role !== UserRole::Syndic && ! $user->can('owners.update')) {
            return false;
        }

        return $this->inScope($user, $owner);
    }

    /**
     * Supprimer (soft) : uniquement sans lot courant (transférer d’abord)
     * et jamais un promoteur encore référencé par une résidence.
     */
    public function delete(User $user, Owner $owner): bool
    {
        if ($user->role !== UserRole::Syndic && ! $user->can('owners.delete')) {
            return false;
        }

        if (! $this->inScope($user, $owner)) {
            return false;
        }

        if ($owner->currentOwnerships()->exists()) {
            return false;
        }

        return ! Residence::where('promoter_owner_id', $owner->id)->exists();
    }
}
