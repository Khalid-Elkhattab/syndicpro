<?php

namespace Database\Seeders;

use App\Models\BudgetPrevisionnel;
use App\Models\CompteCharge;
use App\Models\Periode;
use Illuminate\Database\Seeder;

class BudgetPrevisionnelSeeder extends Seeder
{
    public function run(): void
    {
        $montants = [
            1 => 20000.00, // Entretien
            2 => 10000.00, // Jardinage
            3 => 8000.00,  // Ménage
            4 => 18000.00, // Sécurité
            5 => 12000.00, // Ascenseur
        ];

        $periodes2026 = Periode::where('annee', 2026)->get();
        $total = 0;

        foreach ($periodes2026 as $periode) {
            $comptes = CompteCharge::where('residence_id', $periode->residence_id)
                ->orderBy('id')
                ->get();

            foreach ($comptes as $i => $compte) {
                $montantPrevu = $montants[$i + 1] ?? 10000.00;
                BudgetPrevisionnel::create([
                    'periode_id' => $periode->id,
                    'compte_charge_id' => $compte->id,
                    'montant_prevu' => $montantPrevu,
                    'montant_consomme' => 0,
                ]);
                $total++;
            }
        }

        $this->command->info("✓ BudgetPrevisionnelSeeder: $total budgets créés");
    }
}
