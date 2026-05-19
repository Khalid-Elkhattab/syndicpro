<?php

namespace Database\Factories;

use App\Models\Residence;
use Illuminate\Database\Eloquent\Factories\Factory;

class PeriodeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'residence_id' => Residence::factory(),
            'annee' => fake()->randomElement([2025, 2026]),
            'is_active' => false,
            'date_debut' => '2026-01-01',
            'date_fin' => '2026-12-31',
        ];
    }
}