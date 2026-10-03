<?php

namespace Database\Factories;

use App\Models\Owner;
use Illuminate\Database\Eloquent\Factories\Factory;

class OwnerFactory extends Factory
{
    protected $model = Owner::class;

    public function definition(): array
    {
        return [
            'type' => 'individual',
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'identity_number' => mb_strtoupper(fake()->unique()->bothify('??######')),
            'preferred_locale' => 'fr',
        ];
    }

    public function company(): static
    {
        return $this->state(fn () => [
            'type' => 'company',
            'first_name' => null,
            'last_name' => null,
            'company_name' => fake()->company(),
        ]);
    }
}
