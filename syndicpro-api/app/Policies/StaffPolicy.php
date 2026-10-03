<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class StaffPolicy
{
    private function isManager(User $user): bool
    {
        if (method_exists($user, 'isOwner') && $user->isOwner()) {
            return false;
        }

        $role = $user->role instanceof UserRole ? $user->role->value : (string) $user->role;

        return in_array($role, [UserRole::Syndic->value, 'super_admin'], true);
    }

    public function viewAny(User $user): bool
    {
        return $this->isManager($user);
    }

    public function view(User $user, User $staff): bool
    {
        return $this->isManager($user) && ! $staff->isOwner();
    }

    public function create(User $user): bool
    {
        return $this->isManager($user);
    }

    public function update(User $user, User $staff): bool
    {
        if (! $this->isManager($user) || $staff->isOwner()) {
            return false;
        }
        // On ne modifie pas son propre compte ici.
        if ((int) $staff->id === (int) $user->id) {
            return false;
        }

        return true;
    }

    public function delete(User $user, User $staff): bool
    {
        return $this->update($user, $staff);
    }
}
