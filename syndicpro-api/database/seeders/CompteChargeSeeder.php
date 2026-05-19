<?php

namespace Database\Seeders;

use App\Models\CompteCharge;
use App\Models\Residence;
use Illuminate\Database\Seeder;

class CompteChargeSeeder extends Seeder
{
    public function run(): void
    {
        $comptes = [
            ['nom' => 'Entretien & Réparation', 'description' => 'Entretien des équipements et réparations diverses'],
            ['nom' => 'Jardinage', 'description' => 'Entretien des espaces verts et jardin'],
            ['nom' => 'Ménage', 'description' => 'Nettoyage des parties communes'],
            ['nom' => 'Sécurité', 'description' => 'Gardiennage et surveillance'],
            ['nom' => 'Ascenseur', 'description' => 'Maintenance et réparation ascenseur'],
        ];

        $residences = Residence::pluck('id');
        $total = 0;

        foreach ($residences as $residenceId) {
            foreach ($comptes as $compte) {
                CompteCharge::create([
                    'residence_id' => $residenceId,
                    'nom' => $compte['nom'],
                    'description' => $compte['description'],
                    'is_active' => true,
                ]);
                $total++;
            }
        }

        $this->command->info("✓ CompteChargeSeeder: $total comptes charges créés");
    }
}
