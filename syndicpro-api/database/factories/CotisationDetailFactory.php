<?php

namespace Database\Factories;

use App\Models\Appartement;
use App\Models\Cotisation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CotisationDetailFactory extends Factory
{
    public function definition(): array
    {
        return [
            'cotisation_id' => Cotisation::factory(),
            'appartement_id' => Appartement::factory(),
            'coproprietaire_id' => User::factory(),
            'montant' => fake()->randomFloat(2, 100, 500),
            'statut' => 'non_paye',
            'montant_paye' => 0,
        ];
    }
}