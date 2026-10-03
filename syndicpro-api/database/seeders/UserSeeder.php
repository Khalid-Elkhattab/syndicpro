<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $syndic = User::firstOrCreate(
            ['email' => 'ahmed@syndicpro.ma'],
            [
                'name' => 'Ahmed Benali',
                'phone' => '+212 6 12 34 56 78',
                'username' => 'syndic',
                'password' => Hash::make('password'),
                'role' => UserRole::Syndic,
                'type' => UserType::Staff,
                'is_active' => true,
            ]
        );

        Role::findOrCreate('syndic', 'web');
        if (! $syndic->hasRole('syndic')) {
            $syndic->assignRole('syndic');
        }

        $this->command->info('✓ UserSeeder: Syndic (username: syndic, password: password)');

        $admin = User::firstOrCreate(
            ['email' => 'admin@syndicpro.ma'],
            [
                'name' => 'Super Admin',
                'username' => 'superadmin',
                'password' => Hash::make('password'),
                'role' => UserRole::SuperAdmin,
                'type' => UserType::Staff,
                'is_active' => true,
                'can_access_all_residences' => true,
            ]
        );

        Role::findOrCreate('super_admin', 'web');
        if (! $admin->hasRole('super_admin')) {
            $admin->assignRole('super_admin');
        }

        $this->command->info('✓ UserSeeder: SuperAdmin (username: superadmin, password: password)');
    }
}