<?php

namespace Database\Seeders;

use App\Models\Periode;
use App\Models\Residence;
use Illuminate\Database\Seeder;

class PeriodeSeeder extends Seeder
{
    public function run(): void
    {
        $residences = Residence::pluck('id');
        $total = 0;

        foreach ($residences as $residenceId) {
            Periode::create([
                'residence_id' => $residenceId,
                'annee' => 2025,
                'is_active' => false,
                'date_debut' => '2025-01-01',
                'date_fin' => '2025-12-31',
            ]);
            Periode::create([
                'residence_id' => $residenceId,
                'annee' => 2026,
                'is_active' => true,
                'date_debut' => '2026-01-01',
                'date_fin' => '2026-12-31',
            ]);
            $total += 2;
        }

        $this->command->info("✓ PeriodeSeeder: $total périodes créées");
    }
}
