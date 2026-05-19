<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $syndic = User::create([
            'name' => 'Ahmed Benali',
            'email' => 'ahmed@syndicpro.ma',
            'phone' => '+212 6 12 34 56 78',
            'username' => 'syndic',
            'password' => Hash::make('password'),
            'role' => UserRole::Syndic,
            'is_active' => true,
        ]);

        $syndic->assignRole('syndic');

        $this->command->info('✓ UserSeeder: Syndic créé (username: syndic, password: password)');
    }
}