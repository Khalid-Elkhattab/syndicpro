<?php

namespace App\Support;

/**
 * Permissions `<module>.<action>` — plan §2.1. Rôles staff uniquement.
 * Les propriétaires (users.type = owner) n’ont ni rôle ni permission.
 */
class SpecPermissions
{
    public static function all(): array
    {
        $modules = [
            'residences', 'buildings', 'lots', 'owners', 'contributions',
            'payments', 'budgets', 'expenses', 'treasury', 'collection',
            'complaints', 'assemblies', 'quitus', 'documents', 'announcements',
            'imports', 'api_keys', 'settings',
        ];

        $perms = [];
        foreach ($modules as $module) {
            foreach (['view', 'create', 'update', 'delete'] as $action) {
                $perms[] = "{$module}.{$action}";
            }
        }

        return array_merge($perms, [
            'staff.manage_assistants',
            'owner_accounts.initialize',
            'owner_accounts.reset',
            'account_requests.review',
            'payments.validate',
            'payments.cancel',
            'contributions.publish',
            'budgets.approve',
            'collection.send',
            'collection.formal_notice',
            'assemblies.convene',
            'quitus.issue',
            'owners.view_identity',
            'owners.handover',
            'owners.handover_override',
            'documents.upload',
            'imports.run',
            'approvals.review',
            'benchmarks.view',
            'trash.restore',
            'audit.view',
        ]);
    }
}
