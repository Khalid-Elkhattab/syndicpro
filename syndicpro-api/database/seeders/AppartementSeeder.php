<?php

namespace Database\Seeders;

use App\Models\Appartement;
use App\Models\Immeuble;
use Illuminate\Database\Seeder;

class AppartementSeeder extends Seeder
{
    public function run(): void
    {
        $immeubles = Immeuble::with('residence')->get();
        $total = 0;

        foreach ($immeubles as $immeuble) {
            $nbAppartements = $immeuble->id <= 2 ? 4 : 5;
            $baseTantieme = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190][$total % 10];

            for ($i = 0; $i < $nbAppartements; $i++) {
                $numero = str_pad((string)($total + 1), 2, '0', STR_PAD_LEFT);
                $etage = $i % 2;
                $tantieme = $baseTantieme + ($i * 5);

                Appartement::insert([
                    'numero' => $numero,
                    'etage' => $etage,
                    'immeuble_id' => $immeuble->id,
                    'residence_id' => $immeuble->residence_id,
                    'coproprietaire_id' => null,
                    'tantieme' => $tantieme,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $total++;
            }
        }

        $this->command->info("✓ AppartementSeeder: $total appartements créés");
    }
}
