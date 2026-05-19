<?php

namespace Database\Seeders;

use App\Enums\CotisationType;
use App\Enums\ModeRepartition;
use App\Models\Appartement;
use App\Models\Cotisation;
use App\Models\Periode;
use App\Models\Residence;
use Illuminate\Database\Seeder;

class CotisationSeeder extends Seeder
{
    public function run(): void
    {
        $periodes2026 = Periode::where('annee', 2026)->get();

        foreach ($periodes2026 as $periode) {
            $nbAppartements = Appartement::where('residence_id', $periode->residence_id)
                ->whereNull('deleted_at')
                ->count();

            if ($nbAppartements === 0) continue;

            $montantMensuel = 200.00;
            $montantTotal = $montantMensuel * $nbAppartements;

            // Cotisation fixe
            Cotisation::create([
                'residence_id' => $periode->residence_id,
                'periode_id' => $periode->id,
                'type' => CotisationType::Fixe,
                'label' => 'Charges mensuelles',
                'montant_total' => $montantTotal,
                'montant_mensuel' => $montantMensuel,
                'mode_repartition' => null,
                'mois' => 1,
                'annee' => 2026,
                'description' => 'Charges communes mensuelles',
            ]);

            // Cotisation exceptionnelle
            $montantExceptionnel = $nbAppartements * 1500;
            Cotisation::create([
                'residence_id' => $periode->residence_id,
                'periode_id' => $periode->id,
                'type' => CotisationType::Exceptionnelle,
                'label' => 'Travaux façade',
                'montant_total' => $montantExceptionnel,
                'montant_mensuel' => null,
                'mode_repartition' => ModeRepartition::ParTantieme,
                'mois' => null,
                'annee' => 2026,
                'description' => 'Travaux de ravalement de façade et isolation',
            ]);
        }

        $this->command->info('✓ CotisationSeeder: 2 cotisations par résidence créées');
    }
}
