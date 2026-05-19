<?php

namespace Database\Factories;

use App\Models\Cotisation;
use App\Models\Periode;
use Illuminate\Database\Eloquent\Factories\Factory;

class CotisationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'periode_id' => Periode::factory(),
            'residence_id' => 1,
            'type' => 'fixe',
            'label' => 'Charges mensuelles',
            'montant_total' => 12000.00,
            'montant_mensuel' => 200.00,
            'mode_repartition' => null,
            'mois' => now()->month,
            'annee' => now()->year,
            'description' => fake()->sentence(),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Cotisation $cotisation) {
            if ($cotisation->residence_id === 1) {
                $cotisation->residence_id = $cotisation->periode->residence_id;
                $cotisation->save();
            }
        });
    }
}
