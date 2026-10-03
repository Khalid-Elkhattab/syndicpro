<?php

namespace Database\Seeders;

use App\Support\SpecPermissions;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $syndic = Role::firstOrCreate(['name' => 'syndic', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'coproprietaire', 'guard_name' => 'web']);
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'assistant', 'guard_name' => 'web']);

        foreach (SpecPermissions::all() as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // Transition : le rôle legacy `syndic` reçoit toutes les permissions métier.
        $syndic->givePermissionTo(SpecPermissions::all());
        $superAdmin->givePermissionTo(SpecPermissions::all());

        $this->command->info('✓ RoleSeeder: rôles + ' . count(SpecPermissions::all()) . ' permissions (plan §2.1)');
    }
}