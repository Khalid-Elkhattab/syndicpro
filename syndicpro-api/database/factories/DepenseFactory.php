<?php

namespace Database\Factories;

use App\Models\Depense;
use App\Models\SousCharge;
use Illuminate\Database\Eloquent\Factories\Factory;

class DepenseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'sous_charge_id' => SousCharge::factory(),
            'residence_id' => fn(array $attrs) => SousCharge::find($attrs['sous_charge_id'])?->residence_id ?? 1,
            'date' => fake()->dateTimeBetween('2026-01-01', '2026-04-30')->format('Y-m-d'),
            'montant' => fake()->randomFloat(2, 50, 2000),
            'description' => fake()->sentence(),
            'justificatif_path' => null,
        ];
    }
}