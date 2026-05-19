<?php

namespace Database\Seeders;

use App\Enums\CotisationDetailStatut;
use App\Models\Appartement;
use App\Models\Cotisation;
use App\Models\CotisationDetail;
use Illuminate\Database\Seeder;

class CotisationDetailSeeder extends Seeder
{
    public function run(): void
    {
        $cotisations = Cotisation::with('periode')->get();
        $total = 0;

        foreach ($cotisations as $cotisation) {
            $appartements = Appartement::where('residence_id', $cotisation->residence_id)
                ->whereNotNull('coproprietaire_id')
                ->whereNull('deleted_at')
                ->orderBy('id')
                ->get();

            if ($appartements->isEmpty()) continue;

            if ($cotisation->type->value === 'fixe') {
                foreach ($appartements as $i => $appartement) {
                    $paye = $i % 2 === 0;
                    CotisationDetail::create([
                        'cotisation_id' => $cotisation->id,
                        'appartement_id' => $appartement->id,
                        'coproprietaire_id' => $appartement->coproprietaire_id,
                        'montant' => $cotisation->montant_mensuel ?? 200.00,
                        'statut' => $paye ? CotisationDetailStatut::Paye : CotisationDetailStatut::NonPaye,
                        'montant_paye' => $paye ? ($cotisation->montant_mensuel ?? 200.00) : 0.00,
                    ]);
                    $total++;
                }
            } else {
                $totalTantieme = $appartements->sum('tantieme');
                foreach ($appartements as $i => $appartement) {
                    $montant = $totalTantieme > 0
                        ? round(($appartement->tantieme / $totalTantieme) * $cotisation->montant_total, 2)
                        : 0;

                    $statuts = [
                        CotisationDetailStatut::NonPaye,
                        CotisationDetailStatut::PartiellementPaye,
                        CotisationDetailStatut::Paye,
                        CotisationDetailStatut::NonPaye,
                    ];
                    $statut = $statuts[$i % 4];
                    $montantPaye = match ($statut) {
                        CotisationDetailStatut::Paye => $montant,
                        CotisationDetailStatut::PartiellementPaye => round($montant * 0.5, 2),
                        default => 0,
                    };

                    CotisationDetail::create([
                        'cotisation_id' => $cotisation->id,
                        'appartement_id' => $appartement->id,
                        'coproprietaire_id' => $appartement->coproprietaire_id,
                        'montant' => $montant,
                        'statut' => $statut,
                        'montant_paye' => $montantPaye,
                    ]);
                    $total++;
                }
            }
        }

        $this->command->info("✓ CotisationDetailSeeder: $total détails créés");
    }
}
