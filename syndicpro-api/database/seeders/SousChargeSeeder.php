<?php

namespace Database\Seeders;

use App\Models\CompteCharge;
use App\Models\SousCharge;
use Illuminate\Database\Seeder;

class SousChargeSeeder extends Seeder
{
    public function run(): void
    {
        $sousChargesTemplate = [
            ['nom' => 'Entretien électricité', 'description' => 'Maintenance installations électriques'],
            ['nom' => 'Réparation plomberie', 'description' => 'Réparations fuites et canalisations'],
            ['nom' => 'Peinture parties communes', 'description' => 'Travaux de peinture couloirs et escaliers'],
            ['nom' => 'Entretien espaces verts', 'description' => 'Tonte, taille, arrosage'],
            ['nom' => 'Fournitures jardinage', 'description' => 'Plants, engrais, outils'],
            ['nom' => 'Nettoyage parties communes', 'description' => 'Nettoyage quotidien halls et couloirs'],
            ['nom' => 'Produits ménagers', 'description' => 'Produits nettoyants et fournitures'],
            ['nom' => 'Gardiennage', 'description' => 'Service de gardien 24/24'],
            ['nom' => 'Matériel sécurité', 'description' => 'Caméras, interphones, alarmes'],
            ['nom' => 'Contrat maintenance ascenseur', 'description' => 'Contrat annuel de maintenance'],
            ['nom' => 'Réparation ascenseur', 'description' => 'Réparations imprévues'],
        ];

        // Mapping: which sous-charges belong to which compte (by position)
        $compteMapping = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5];

        $comptes = CompteCharge::orderBy('id')->get()->groupBy('residence_id');
        $total = 0;

        foreach ($comptes as $residenceId => $residenceComptes) {
            foreach ($sousChargesTemplate as $i => $sc) {
                $compte = $residenceComptes->values()[$compteMapping[$i] - 1] ?? $residenceComptes->first();
                SousCharge::create([
                    'compte_charge_id' => $compte->id,
                    'residence_id' => $residenceId,
                    'nom' => $sc['nom'],
                    'description' => $sc['description'],
                ]);
                $total++;
            }
        }

        $this->command->info("✓ SousChargeSeeder: $total sous-charges créées");
    }
}
