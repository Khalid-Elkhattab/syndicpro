<?php

namespace Database\Seeders;

use App\Models\BudgetPrevisionnel;
use App\Models\Depense;
use App\Models\Periode;
use App\Models\SousCharge;
use Illuminate\Database\Seeder;

class DepenseSeeder extends Seeder
{
    public function run(): void
    {
        // Template: for each residence, create similar expenses but with varied amounts
        $depensesTemplate = [
            ['sous_charge_index' => 0, 'date' => '2026-01-15', 'montant_base' => 450, 'desc' => 'Remplacement ampoules hall et escaliers'],
            ['sous_charge_index' => 0, 'date' => '2026-03-20', 'montant_base' => 280, 'desc' => 'Réparation prise électrique RDC'],
            ['sous_charge_index' => 1, 'date' => '2026-02-10', 'montant_base' => 650, 'desc' => 'Réparation fuite canalisation'],
            ['sous_charge_index' => 1, 'date' => '2026-04-05', 'montant_base' => 180, 'desc' => 'Débouchage évier'],
            ['sous_charge_index' => 2, 'date' => '2026-01-28', 'montant_base' => 2500, 'desc' => 'Peinture couloir 1er étage'],
            ['sous_charge_index' => 3, 'date' => '2026-02-01', 'montant_base' => 800, 'desc' => 'Tonte et taille haies'],
            ['sous_charge_index' => 3, 'date' => '2026-03-15', 'montant_base' => 750, 'desc' => 'Entretien jardin'],
            ['sous_charge_index' => 4, 'date' => '2026-02-20', 'montant_base' => 350, 'desc' => 'Achats plants et engrais'],
            ['sous_charge_index' => 5, 'date' => '2026-01-10', 'montant_base' => 1200, 'desc' => 'Service nettoyage'],
            ['sous_charge_index' => 5, 'date' => '2026-02-10', 'montant_base' => 1200, 'desc' => 'Service nettoyage'],
            ['sous_charge_index' => 5, 'date' => '2026-03-10', 'montant_base' => 1200, 'desc' => 'Service nettoyage'],
            ['sous_charge_index' => 5, 'date' => '2026-04-10', 'montant_base' => 1200, 'desc' => 'Service nettoyage'],
            ['sous_charge_index' => 6, 'date' => '2026-01-25', 'montant_base' => 280, 'desc' => 'Produits nettoyants'],
            ['sous_charge_index' => 7, 'date' => '2026-01-31', 'montant_base' => 4500, 'desc' => 'Salaire gardien'],
            ['sous_charge_index' => 7, 'date' => '2026-02-28', 'montant_base' => 4500, 'desc' => 'Salaire gardien'],
            ['sous_charge_index' => 7, 'date' => '2026-03-31', 'montant_base' => 4500, 'desc' => 'Salaire gardien'],
            ['sous_charge_index' => 7, 'date' => '2026-04-30', 'montant_base' => 4500, 'desc' => 'Salaire gardien'],
            ['sous_charge_index' => 8, 'date' => '2026-03-05', 'montant_base' => 520, 'desc' => 'Remplacement batteries interphone'],
            ['sous_charge_index' => 9, 'date' => '2026-01-01', 'montant_base' => 3000, 'desc' => 'Contrat maintenance annuel ascenseur'],
            ['sous_charge_index' => 10, 'date' => '2026-04-15', 'montant_base' => 850, 'desc' => 'Réparation porte ascenseur'],
        ];

        $residences = \App\Models\Residence::pluck('id');
        $totalDepenses = 0;

        foreach ($residences as $residenceId) {
            $sousCharges = SousCharge::where('residence_id', $residenceId)
                ->orderBy('id')
                ->get();

            if ($sousCharges->count() < 11) continue;

            $variation = $residenceId * 100;

            foreach ($depensesTemplate as $d) {
                Depense::create([
                    'sous_charge_id' => $sousCharges[$d['sous_charge_index']]->id,
                    'residence_id' => $residenceId,
                    'date' => $d['date'],
                    'montant' => $d['montant_base'] + $variation,
                    'description' => $d['desc'] . ' (Résidence #' . $residenceId . ')',
                    'justificatif_path' => null,
                ]);
                $totalDepenses++;
            }
        }

        // Update budgets montant_consomme
        $periodes2026 = Periode::where('annee', 2026)->get();
        foreach ($periodes2026 as $periode) {
            $sousCharges = SousCharge::where('residence_id', $periode->residence_id)
                ->with('compteCharge')
                ->get();

            $byCompte = [];
            $compteMap = [
                0 => 1, 1 => 1, 2 => 1,
                3 => 2, 4 => 2,
                5 => 3, 6 => 3,
                7 => 4, 8 => 4,
                9 => 5, 10 => 5,
            ];

            foreach ($sousCharges as $i => $sc) {
                $compteIdx = $compteMap[$i] ?? 1;
                $totalDep = Depense::where('sous_charge_id', $sc->id)->sum('montant');
                if (!isset($byCompte[$compteIdx])) $byCompte[$compteIdx] = 0;
                $byCompte[$compteIdx] += $totalDep;
            }

            $comptes = \App\Models\CompteCharge::where('residence_id', $periode->residence_id)
                ->orderBy('id')
                ->get();

            foreach ($comptes as $i => $compte) {
                $consomme = $byCompte[$i + 1] ?? 0;
                BudgetPrevisionnel::where('periode_id', $periode->id)
                    ->where('compte_charge_id', $compte->id)
                    ->update(['montant_consomme' => $consomme]);
            }
        }

        $this->command->info("✓ DepenseSeeder: $totalDepenses dépenses créées");
    }
}
