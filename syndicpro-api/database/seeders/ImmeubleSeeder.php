<?php

namespace Database\Seeders;

use App\Models\Immeuble;
use App\Models\Residence;
use Illuminate\Database\Seeder;

class ImmeubleSeeder extends Seeder
{
    public function run(): void
    {
        $residences = Residence::pluck('id')->toArray();
        $letters = ['A', 'B', 'C'];
        $total = 0;

        foreach ($residences as $residenceId) {
            $count = $residenceId === 1 ? 2 : ($residenceId === 3 ? 3 : 2);
            for ($i = 0; $i < $count; $i++) {
                Immeuble::create([
                    'residence_id' => $residenceId,
                    'nom' => 'Bâtiment ' . $letters[$i],
                ]);
                $total++;
            }
        }

        $this->command->info("✓ ImmeubleSeeder: $total immeubles créés");
    }
}
