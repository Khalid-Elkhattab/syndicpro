<?php

namespace Database\Factories;

use App\Models\CompteCharge;
use App\Models\Periode;
use Illuminate\Database\Eloquent\Factories\Factory;

class BudgetPrevisionnelFactory extends Factory
{
    public function definition(): array
    {
        return [
            'periode_id' => Periode::factory(),
            'compte_charge_id' => CompteCharge::factory(),
            'montant_prevu' => fake()->randomFloat(2, 5000, 30000),
            'montant_consomme' => 0,
        ];
    }
}