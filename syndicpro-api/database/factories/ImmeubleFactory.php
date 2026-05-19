<?php

namespace Database\Factories;

use App\Models\Residence;
use Illuminate\Database\Eloquent\Factories\Factory;

class ImmeubleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'residence_id' => Residence::factory(),
            'nom' => 'Bâtiment ' . fake()->randomLetter(),
        ];
    }
}