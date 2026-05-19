<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->optional()->phoneNumber(),
            'role' => \App\Enums\UserRole::Coproprietaire->value,
            'username' => fake()->unique()->userName(),
            'password' => static::$password ??= Hash::make('password'),
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function syndic(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => \App\Enums\UserRole::Syndic->value,
            'username' => 'syndic_' . fake()->unique()->userName(),
        ]);
    }

    public function coproprietaire(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => \App\Enums\UserRole::Coproprietaire->value,
        ]);
    }

    public function desactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
