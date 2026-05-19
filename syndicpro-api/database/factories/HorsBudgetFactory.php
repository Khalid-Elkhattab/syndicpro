<?php

namespace Database\Factories;

use App\Models\Residence;
use Illuminate\Database\Eloquent\Factories\Factory;

class HorsBudgetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'residence_id' => Residence::factory(),
            'date' => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'montant' => fake()->randomFloat(2, 200, 5000),
            'description' => fake()->sentence(8),
            'justificatif_path' => null,
        ];
    }
}
