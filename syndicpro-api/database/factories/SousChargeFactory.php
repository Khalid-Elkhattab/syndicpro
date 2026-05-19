<?php

namespace Database\Factories;

use App\Models\CompteCharge;
use Illuminate\Database\Eloquent\Factories\Factory;

class SousChargeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'compte_charge_id' => CompteCharge::factory(),
            'residence_id' => fn(array $attrs) => CompteCharge::find($attrs['compte_charge_id'])?->residence_id ?? 1,
            'nom' => fake()->randomElement([
                'Entretien électricité',
                'Réparation plomberie',
                'Peinture parties communes',
                'Entretien espaces verts',
                'Fournitures jardinage',
                'Nettoyage parties communes',
                'Produits ménagers',
                'Gardiennage',
                'Matériel sécurité',
                'Contrat maintenance ascenseur',
                'Réparation ascenseur',
            ]),
            'description' => fake()->sentence(),
        ];
    }
}