<?php

namespace Database\Factories;

use App\Models\Appartement;
use App\Models\Immeuble;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AppartementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'numero' => 'A' . fake()->unique()->numberBetween(1000, 9999),
            'etage' => fake()->numberBetween(0, 5),
            'immeuble_id' => Immeuble::factory(),
            'residence_id' => 1,
            'coproprietaire_id' => null,
            'tantieme' => fake()->numberBetween(50, 200),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Appartement $appartement) {
            if ($appartement->residence_id === 1) {
                $appartement->residence_id = $appartement->immeuble->residence_id;
                $appartement->save();
            }
        });
    }
}
