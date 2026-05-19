<?php

namespace Database\Factories;

use App\Models\Residence;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompteChargeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'residence_id' => Residence::factory(),
            'nom' => fake()->randomElement([
                'Entretien & Réparation',
                'Jardinage',
                'Ménage',
                'Sécurité',
                'Ascenseur',
            ]),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}