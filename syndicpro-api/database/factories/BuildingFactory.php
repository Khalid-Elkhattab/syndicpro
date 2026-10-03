<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\Residence;
use Illuminate\Database\Eloquent\Factories\Factory;

class BuildingFactory extends Factory
{
    protected $model = Building::class;

    public function definition(): array
    {
        return [
            'residence_id' => Residence::factory(),
            'number' => $this->faker->unique()->lexify('?'),
            'label' => null,
            'floors' => $this->faker->numberBetween(0, 10),
        ];
    }
}
