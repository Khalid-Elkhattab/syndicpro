<?php

namespace App\Console\Commands;

use App\Enums\CotisationDetailStatut;
use App\Models\Cotisation;
use App\Repositories\AppartementRepository;
use Illuminate\Console\Command;

class GenerateMonthlyCotisations extends Command
{
    protected $signature = 'cotisations:generate-monthly';
    protected $description = 'Génère les cotisations fixes mensuelles pour tous les appartements';

    public function __construct(
        private AppartementRepository $appartementRepo,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Démarrage de la génération mensuelle des cotisations...');

        $currentMonth = now()->month;
        $currentYear = now()->year;

        $cotisationsFixe = Cotisation::where('type', 'fixe')
            ->with(['residence'])
            ->get();

        $created = 0;
        $skipped = 0;

        foreach ($cotisationsFixe as $cotisation) {
            $this->info("Traitement de la cotisation: {$cotisation->label}");

            $existingForMonth = Cotisation::where('residence_id', $cotisation->residence_id)
                ->where('type', 'fixe')
                ->where('mois', $currentMonth)
                ->where('annee', $currentYear)
                ->exists();

            if ($existingForMonth) {
                $this->info("  -> Cotisations pour {$currentMonth}/{$currentYear} déjà existantes, ignoré.");
                $skipped++;
                continue;
            }

            $newCotisation = Cotisation::create([
                'residence_id' => $cotisation->residence_id,
                'periode_id' => $cotisation->periode_id,
                'type' => 'fixe',
                'label' => $cotisation->label,
                'montant_total' => $cotisation->montant_mensuel,
                'montant_mensuel' => $cotisation->montant_mensuel,
                'mois' => $currentMonth,
                'annee' => $currentYear,
                'description' => $cotisation->description,
            ]);

            $appartements = $this->appartementRepo->findActifsByResidence($cotisation->residence_id);

            foreach ($appartements as $appartement) {
                \App\Models\CotisationDetail::create([
                    'cotisation_id' => $newCotisation->id,
                    'appartement_id' => $appartement->id,
                    'coproprietaire_id' => $appartement->coproprietaire_id,
                    'montant' => $cotisation->montant_mensuel,
                    'statut' => CotisationDetailStatut::NonPaye,
                    'montant_paye' => 0,
                ]);

                $created++;
            }

            $this->info("  -> {$created} détails créés pour {$currentMonth}/{$currentYear}");
        }

        $this->info("Génération terminée : {$created} créés, {$skipped} ignorés (déjà existants).");

        return Command::SUCCESS;
    }
}