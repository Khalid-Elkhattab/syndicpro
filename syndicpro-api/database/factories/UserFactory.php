<?php

namespace Database\Factories;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Enums\UserType;
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
            'role' => UserRole::Coproprietaire->value,
            'type' => UserType::Owner->value,
            'status' => AccountStatus::Active->value,
            'locale' => 'fr',
            'username' => fake()->unique()->userName(),
            'password' => static::$password ??= Hash::make('password'),
            'password_set_at' => now(),
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function syndic(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Syndic->value,
            'type' => UserType::Staff->value,
            'username' => 'syndic_'.fake()->unique()->userName(),
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AccountStatus::PendingActivation->value,
        ]);
    }

    public function coproprietaire(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Coproprietaire->value,
        ]);
    }

    public function desactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
            'status' => AccountStatus::Suspended->value,
        ]);
    }
}
