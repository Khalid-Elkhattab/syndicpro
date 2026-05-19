<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'syndic', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'coproprietaire', 'guard_name' => 'web']);

        $this->command->info('✓ RoleSeeder: Rôles créés (syndic, coproprietaire)');
    }
}