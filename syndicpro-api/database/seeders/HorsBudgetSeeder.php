<?php

namespace Database\Seeders;

use App\Models\HorsBudget;
use App\Models\Residence;
use Illuminate\Database\Seeder;

class HorsBudgetSeeder extends Seeder
{
    public function run(): void
    {
        $residences = Residence::pluck('id');
        $horsBudgets = [
            ['date' => '2026-02-15', 'montant' => 1200.00, 'description' => 'Réparation urgence fuite d\'eau principale'],
            ['date' => '2026-04-20', 'montant' => 3000.00, 'description' => 'Remplacement moteur portail électrique'],
            ['date' => '2026-06-10', 'montant' => 850.00, 'description' => 'Intervention pompiers pour dégât des eaux'],
        ];

        $total = 0;
        foreach ($residences as $residenceId) {
            $variation = $residenceId * 50;
            foreach ($horsBudgets as $hb) {
                HorsBudget::create([
                    'residence_id' => $residenceId,
                    'date' => $hb['date'],
                    'montant' => $hb['montant'] + $variation,
                    'description' => $hb['description'],
                    'justificatif_path' => null,
                ]);
                $total++;
            }
        }

        $this->command->info("✓ HorsBudgetSeeder: $total hors-budgets créés");
    }
}
