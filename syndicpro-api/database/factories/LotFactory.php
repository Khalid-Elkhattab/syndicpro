<?php

namespace Database\Factories;

use App\Enums\LotType;
use App\Models\Building;
use App\Models\Lot;
use App\Models\Residence;
use Illuminate\Database\Eloquent\Factories\Factory;

class LotFactory extends Factory
{
    protected $model = Lot::class;

    public function definition(): array
    {
        return [
            'residence_id' => Residence::factory(),
            'building_id' => Building::factory(),
            'number' => $this->faker->unique()->bothify('A##'),
            'type' => $this->faker->randomElement(array_column(LotType::cases(), 'value')),
            'surface' => $this->faker->randomFloat(2, 20, 200),
            'tantieme' => $this->faker->randomFloat(4, 10, 500),
            'land_title_no' => null,
            'parking_status' => 'no',
            'has_box' => false,
            'floor' => $this->faker->numberBetween(0, 8),
            'is_active' => true,
        ];
    }
}
