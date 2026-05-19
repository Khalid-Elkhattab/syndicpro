<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ResidenceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'syndic_id' => User::factory(),
            'nom' => fake()->company() . ' Residence',
            'ville' => fake()->city(),
            'adresse' => fake()->address(),
            'nb_immeubles' => 0,
        ];
    }
}