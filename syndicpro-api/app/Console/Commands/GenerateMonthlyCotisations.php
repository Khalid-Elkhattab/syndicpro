<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Génération mensuelle des cotisations (fixe).
 * Stub intentionnel : la génération réelle arrivera avec le moteur dues/contributions.
 * Existe pour que le scheduler (AppServiceProvider) ne plante plus en silence.
 */
class GenerateMonthlyCotisations extends Command
{
    protected $signature = 'cotisations:generate-monthly {--dry-run : affiche ce qui serait généré sans rien créer}';

    protected $description = 'Génère les cotisations fixes du mois (stub — à brancher sur DueGenerator)';

    public function handle(): int
    {
        if ($this->option('dry-run')) {
            $this->info('Dry-run : rien à générer pour le moment (moteur dues à venir).');

            return self::SUCCESS;
        }

        $this->warn('Moteur de génération non encore branché (voir newplan.md §6). Rien créé.');

        return self::SUCCESS;
    }
}
