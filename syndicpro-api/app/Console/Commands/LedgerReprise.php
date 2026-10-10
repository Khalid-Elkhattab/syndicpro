<?php

namespace App\Console\Commands;

use App\Enums\ContributionStatus;
use App\Enums\ContributionType;
use App\Models\Building;
use App\Models\Contribution;
use App\Models\ContributionLot;
use App\Models\Due;
use App\Models\Lot;
use App\Models\LotOwnership;
use App\Models\Residence;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Reprise des soldes d'ouverture (ex-legacy) : un dû unique par ligne, porté
 * par une contribution « Reprise des soldes ». Prévisualisation par défaut,
 * --commit pour écrire. CSV : lot_number,building_number,owner_id,amount[,label].
 */
class LedgerReprise extends Command
{
    protected $signature = 'ledger:reprise {residence : ID de la résidence} {csv : chemin du fichier CSV}'
        .' {--as-of= : date de reprise (Y-m-d, défaut : aujourd’hui)}'
        .' {--commit : écrit réellement, sinon prévisualisation}';

    protected $description = 'Importe des soldes d’ouverture (reprise) comme dus uniques.';

    public function handle(): int
    {
        $residence = Residence::find($this->argument('residence'));
        if (! $residence) {
            $this->error('Résidence introuvable.');

            return self::FAILURE;
        }
        $path = $this->argument('csv');
        if (! is_readable($path)) {
            $this->error("CSV illisible : {$path}");

            return self::FAILURE;
        }
        $asOf = $this->option('as-of') ?: today()->toDateString();
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $asOf)) {
            $this->error('Date --as-of invalide (Y-m-d).');

            return self::FAILURE;
        }

        $rows = $this->readCsv($path);
        $valid = [];
        $errors = [];
        foreach ($rows as $i => $row) {
            $line = $i + 2; // + en-tête
            $check = $this->validateRow($residence->id, $row);
            if ($check === true) {
                $valid[] = $row;
            } else {
                $errors[] = "Ligne {$line} : {$check}";
            }
        }

        $total = round(array_sum(array_column($valid, 'amount')), 2);
        $this->table(
            ['Lot', 'Imm.', 'Propriétaire', 'Montant', 'Libellé'],
            array_map(fn ($r) => [$r['lot_number'], $r['building_number'], $r['owner_name'], number_format($r['amount'], 2, ',', ' '), $r['label']], $valid)
        );
        $this->info(count($valid).' ligne(s) valide(s) — total '.number_format($total, 2, ',', ' ').' MAD.');
        foreach ($errors as $e) {
            $this->error($e);
        }

        if (! $this->option('commit')) {
            $this->warn('Prévisualisation : rien n’a été créé. Relancez avec --commit.');

            return $errors ? self::FAILURE : self::SUCCESS;
        }

        if ($errors) {
            $this->error('Commit refusé : corrigez les lignes en erreur.');

            return self::FAILURE;
        }

        if (Contribution::where('residence_id', $residence->id)
            ->where('name', 'Reprise des soldes au '.$asOf)->exists()) {
            $this->error("Une reprise existe déjà pour le {$asOf}.");

            return self::FAILURE;
        }

        $contribution = DB::transaction(function () use ($residence, $asOf, $valid) {
            $contribution = Contribution::create([
                'residence_id' => $residence->id,
                'type' => ContributionType::Exceptional->value,
                'name' => 'Reprise des soldes au '.$asOf,
                'starts_on' => $asOf,
                'ends_on' => $asOf,
                'calculation_mode' => 'fixed',
                'status' => ContributionStatus::Published->value,
                'published_at' => now(),
            ]);

            foreach ($valid as $row) {
                $clot = ContributionLot::create([
                    'contribution_id' => $contribution->id,
                    'residence_id' => $residence->id,
                    'lot_id' => $row['lot_id'],
                    'tantieme_snapshot' => $row['tantieme'],
                    'surface_snapshot' => $row['surface'],
                    'annual_amount' => $row['amount'],
                    'monthly_amount' => $row['amount'],
                ]);
                Due::create([
                    'residence_id' => $residence->id,
                    'contribution_lot_id' => $clot->id,
                    'lot_id' => $row['lot_id'],
                    'owner_id' => $row['owner_id'],
                    'period_start' => $asOf,
                    'period_end' => $asOf,
                    'days' => 1,
                    'amount' => $row['amount'],
                    'due_date' => $asOf,
                    'status' => 'unpaid',
                ]);
            }

            return $contribution;
        });

        $this->info("Reprise créée (contribution #{$contribution->id}) : ".count($valid).' dus, total '.number_format($total, 2, ',', ' ').' MAD.');

        return self::SUCCESS;
    }

    /** @return array<int, array<string, mixed>> */
    private function readCsv(string $path): array
    {
        $rows = [];
        if (($h = fopen($path, 'r')) === false) {
            return [];
        }
        $header = fgetcsv($h);
        if (! $header) {
            fclose($h);

            return [];
        }
        $header = array_map(fn ($c) => strtolower(trim((string) $c)), $header);
        while (($data = fgetcsv($h)) !== false) {
            if (count(array_filter($data, fn ($c) => trim((string) $c) !== '')) === 0) {
                continue;
            }
            $rows[] = array_combine($header, array_pad($data, count($header), ''));
        }
        fclose($h);

        return $rows;
    }

    private function validateRow(int $residenceId, array &$row): bool|string
    {
        $row['lot_number'] = trim((string) ($row['lot_number'] ?? ''));
        $row['building_number'] = trim((string) ($row['building_number'] ?? ''));
        $row['owner_id'] = (int) ($row['owner_id'] ?? 0);
        $row['amount'] = round((float) str_replace([' ', ','], ['', '.'], (string) ($row['amount'] ?? 0)), 2);
        $row['label'] = trim((string) ($row['label'] ?? 'Soldes antérieurs'));

        if ($row['lot_number'] === '' || $row['building_number'] === '' || $row['owner_id'] <= 0) {
            return 'lot_number, building_number et owner_id sont obligatoires.';
        }
        if ($row['amount'] <= 0) {
            return 'amount doit être > 0.';
        }

        $building = Building::where('residence_id', $residenceId)
            ->where('number', $row['building_number'])->first();
        if (! $building) {
            return "Immeuble {$row['building_number']} introuvable dans la résidence.";
        }
        $lot = Lot::where('residence_id', $residenceId)
            ->where('building_id', $building->id)
            ->where('number', $row['lot_number'])->first();
        if (! $lot) {
            return "Lot {$row['lot_number']} introuvable dans l’immeuble {$row['building_number']}.";
        }
        $owns = LotOwnership::where('lot_id', $lot->id)
            ->where('owner_id', $row['owner_id'])
            ->whereNull('ended_on')->exists();
        if (! $owns) {
            return "Le propriétaire #{$row['owner_id']} ne détient pas actuellement ce lot.";
        }

        $row['lot_id'] = $lot->id;
        $row['tantieme'] = $lot->tantieme;
        $row['surface'] = $lot->surface;
        $row['owner_name'] = $lot->ownerships->firstWhere('owner_id', $row['owner_id'])?->owner?->display_name ?? ('#'.$row['owner_id']);

        return true;
    }
}
