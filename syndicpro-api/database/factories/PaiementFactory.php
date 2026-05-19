<?php

namespace Database\Factories;

use App\Models\CotisationDetail;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaiementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'cotisation_detail_id' => CotisationDetail::factory(),
            'coproprietaire_id' => User::factory(),
            'date_paiement' => fake()->dateTimeBetween('2026-01-01', '2026-04-30')->format('Y-m-d'),
            'montant' => fake()->randomFloat(2, 50, 500),
            'mode_paiement' => fake()->randomElement(['especes', 'virement', 'cheque', 'carte']),
            'reference' => fake()->optional()->numerify('CHQ-#####'),
            'recu_path' => null,
        ];
    }
}