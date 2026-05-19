<?php

namespace Database\Seeders;

use App\Enums\ModePaiement;
use App\Models\CotisationDetail;
use App\Models\Paiement;
use Illuminate\Database\Seeder;

class PaiementSeeder extends Seeder
{
    public function run(): void
    {
        // Get paid and partially paid details
        $details = CotisationDetail::whereIn('statut', ['paye', 'partiellement_paye'])
            ->whereHas('cotisation', fn($q) => $q->where('type', 'fixe'))
            ->with('cotisation')
            ->get();

        $total = 0;
        $modes = [ModePaiement::Virement, ModePaiement::Cheque, ModePaiement::Especes];

        foreach ($details as $detail) {
            $montant = $detail->montant_paye > 0 ? $detail->montant_paye : $detail->montant;

            Paiement::create([
                'cotisation_detail_id' => $detail->id,
                'coproprietaire_id' => $detail->coproprietaire_id,
                'date_paiement' => '2026-01-' . str_pad((string)random_int(5, 28), 2, '0', STR_PAD_LEFT),
                'montant' => $montant,
                'mode_paiement' => $modes[array_rand($modes)],
                'reference' => random_int(0, 1) ? 'VIR-202601-' . str_pad((string)$detail->id, 3, '0', STR_PAD_LEFT) : null,
                'recu_path' => null,
            ]);
            $total++;
        }

        // Also create some payments for exceptionnelle cotisation details
        $excDetails = CotisationDetail::whereIn('statut', ['paye', 'partiellement_paye'])
            ->whereHas('cotisation', fn($q) => $q->where('type', 'exceptionnelle'))
            ->with('cotisation')
            ->get();

        foreach ($excDetails as $detail) {
            $montant = $detail->montant_paye > 0 ? $detail->montant_paye : $detail->montant;

            Paiement::create([
                'cotisation_detail_id' => $detail->id,
                'coproprietaire_id' => $detail->coproprietaire_id,
                'date_paiement' => '2026-03-' . str_pad((string)random_int(1, 28), 2, '0', STR_PAD_LEFT),
                'montant' => $montant,
                'mode_paiement' => $modes[array_rand($modes)],
                'reference' => random_int(0, 1) ? 'VIR-202603-' . str_pad((string)$detail->id, 3, '0', STR_PAD_LEFT) : null,
                'recu_path' => null,
            ]);
            $total++;
        }

        $this->command->info("✓ PaiementSeeder: $total paiements créés");
    }
}
