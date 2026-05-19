<?php

namespace Database\Factories;

use App\Models\Appartement;
use App\Models\Residence;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReclamationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'coproprietaire_id' => User::factory(),
            'residence_id' => fn() => \App\Models\Residence::factory()->create()->id,
            'appartement_id' => Appartement::factory(),
            'titre' => fake()->randomElement([
                'Panne ascenseur',
                'Éclairage défectueux',
                'Fuite d\'eau',
                'Problème de sécurité',
                'Bruit excessif',
            ]),
            'description' => fake()->paragraph(),
            'statut' => 'nouveau',
            'priorite' => fake()->randomElement(['normale', 'urgente']),
            'reponse_syndic' => null,
            'date_reponse' => null,
        ];
    }
}