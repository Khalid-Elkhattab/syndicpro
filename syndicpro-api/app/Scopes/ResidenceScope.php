<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

/**
 * Limite les requêtes aux résidences affectées à l'utilisateur connecté.
 * Super-admin (can_access_all_residences) : aucune restriction.
 * Appliqué uniquement aux modèles ayant une colonne residence_id.
 */
class ResidenceScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = Auth::user();

        if (! $user || ($user->can_access_all_residences ?? false)) {
            return;
        }

        $ids = method_exists($user, 'assignedResidenceIds')
            ? $user->assignedResidenceIds()
            : [];

        // Sans affectation : aucune ligne (plutôt que tout exposer).
        if (empty($ids)) {
            $builder->whereRaw('1 = 0');

            return;
        }

        $builder->whereIn($model->getTable() . '.residence_id', $ids);
    }
}
