<?php

namespace App\Services;

use App\Enums\AccountStatus;
use App\Enums\LotType;
use App\Enums\OwnerType;
use App\Enums\UserType;
use App\Models\Appartement;
use App\Models\Building;
use App\Models\Immeuble;
use App\Models\Lot;
use App\Models\LotAccountAssignment;
use App\Models\LotAnnex;
use App\Models\LotOwnership;
use App\Models\Owner;
use App\Models\Residence;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Import CSV des bâtiments + lots (tous types, pas seulement appartements).
 * Format : building, lot_number, type, surface, tantieme, land_title_no,
 *          parking, parking_numbers, box, box_numbers, floor, notes
 * Délimiteur auto (; ou ,), UTF-8. Dry-run d'abord, commit en 1 transaction.
 * Écrit en miroir dans immeubles/appartements (legacy) pour garder les écrans actuels.
 */
class LotImportService
{
    /** @return array{columns: array, delimiter: string, rows_total: int, to_create_buildings: int, to_create_lots: int, to_update_lots: int, warnings: array, errors: array, preview_rows: array} */
    public function preview(int $residenceId, UploadedFile $file): array
    {
        $parsed = $this->parse($file);
        if (! empty($parsed['errors'])) {
            return $this->summary($residenceId, $parsed, []);
        }

        return $this->summary($residenceId, $parsed, $parsed['rows']);
    }

    /** @return array{created_buildings: int, created_lots: int, updated_lots: int, created_logins: int, warnings: array} */
    public function commit(int $residenceId, UploadedFile $file): array
    {
        $parsed = $this->parse($file);
        if (! empty($parsed['errors'])) {
            throw new \InvalidArgumentException('Fichier invalide : '.implode(' | ', array_slice($parsed['errors'], 0, 3)));
        }

        return DB::transaction(function () use ($residenceId, $parsed) {
            $residence = Residence::findOrFail($residenceId);
            $this->ensureCode($residence);
            $promoter = $this->ensurePromoter($residence);

            $createdB = 0;
            $createdL = 0;
            $updatedL = 0;
            $createdLogins = 0;

            foreach ($parsed['rows'] as $row) {
                $building = Building::firstOrCreate(
                    ['residence_id' => $residenceId, 'number' => $row['building']],
                    ['label' => null]
                );
                if ($building->wasRecentlyCreated) {
                    $createdB++;
                }

                $immeuble = Immeuble::firstOrCreate(
                    ['residence_id' => $residenceId, 'nom' => $row['building']]
                );

                $lot = Lot::where('building_id', $building->id)->where('number', $row['lot_number'])->first();
                $isNew = $lot === null;
                $lot = Lot::updateOrCreate(
                    ['building_id' => $building->id, 'number' => $row['lot_number']],
                    [
                        'residence_id' => $residenceId,
                        'type' => $row['type'],
                        'surface' => $row['surface'],
                        'tantieme' => $row['tantieme'],
                        'land_title_no' => $row['land_title_no'],
                        'parking_status' => $row['parking'],
                        'has_box' => $row['has_box'],
                        'floor' => $row['floor'],
                        'notes' => $row['notes'],
                        'is_active' => true,
                    ]
                );
                $isNew ? $createdL++ : $updatedL++;

                // Spec §4.3b : un login portail par lot, créé avec le lot, jamais supprimé.
                $username = sprintf('%s-%s-%s', $residence->code, $building->number, $lot->number);
                $login = User::where('lot_id', $lot->id)->first();
                if (! $login) {
                    $login = User::create([
                        'name' => $username,
                        'email' => 'lot.'.$lot->id.'.'.Str::random(8).'@lot.local',
                        'username' => $username,
                        'password' => Hash::make(Str::random(40)),
                        'type' => UserType::Owner->value,
                        'status' => AccountStatus::PendingActivation->value,
                        'lot_id' => $lot->id,
                        'is_active' => true,
                    ]);
                    $createdLogins++;
                }

                // Spec §4.3 : lot sans propriétaire → promoteur (reason initial).
                $hasOwner = LotOwnership::where('lot_id', $lot->id)->whereNull('ended_on')->exists();
                if (! $hasOwner) {
                    $ownership = LotOwnership::create([
                        'lot_id' => $lot->id,
                        'owner_id' => $promoter->id,
                        'share_percent' => 100,
                        'is_billing_contact' => true,
                        'started_on' => today(),
                        'change_reason' => 'initial',
                    ]);
                    LotAccountAssignment::create([
                        'user_id' => $login->id,
                        'lot_id' => $lot->id,
                        'owner_id' => $promoter->id,
                        'lot_ownership_id' => $ownership->id,
                        'started_at' => now(),
                        'notes' => 'Assignation initiale (promoteur).',
                    ]);
                    $login->update(['current_owner_id' => $promoter->id]);
                }

                // Miroir legacy : appartements (écrans actuels).
                Appartement::updateOrCreate(
                    ['immeuble_id' => $immeuble->id, 'numero' => $row['lot_number']],
                    [
                        'residence_id' => $residenceId,
                        'etage' => $row['floor'] ?? 0,
                        'tantieme' => $row['tantieme'] ?? 0,
                    ]
                );

                // Annexes : resync simple.
                LotAnnex::where('lot_id', $lot->id)->delete();
                foreach ($row['parking_numbers'] as $n) {
                    LotAnnex::create(['lot_id' => $lot->id, 'type' => 'parking', 'number' => $n]);
                }
                foreach ($row['box_numbers'] as $n) {
                    LotAnnex::create(['lot_id' => $lot->id, 'type' => 'box', 'number' => $n]);
                }
            }

            return [
                'created_buildings' => $createdB,
                'created_lots' => $createdL,
                'updated_lots' => $updatedL,
                'created_logins' => $createdLogins,
                'warnings' => $parsed['warnings'],
            ];
        });
    }

    private function ensureCode(Residence $residence): void
    {
        if ($residence->code) {
            return;
        }
        $base = mb_strtoupper(preg_replace('/[^A-Z0-9]/', '', iconv('UTF-8', 'ASCII//TRANSLIT', $residence->nom)));
        $base = substr($base ?: 'RES', 0, 5);
        $code = $base;
        $i = 1;
        while (Residence::where('code', $code)->exists()) {
            $code = $base.$i;
            $i++;
        }
        $residence->update(['code' => $code]);
    }

    private function ensurePromoter(Residence $residence): Owner
    {
        if ($residence->promoter_owner_id) {
            return Owner::findOrFail($residence->promoter_owner_id);
        }
        $promoter = Owner::create([
            'type' => OwnerType::Company->value,
            'company_name' => 'Promoteur — '.$residence->nom,
            'preferred_locale' => 'fr',
            'internal_notes' => 'Promoteur (lots invendus). Exclu de l’activation en masse.',
        ]);
        $residence->update(['promoter_owner_id' => $promoter->id]);

        return $promoter;
    }

    /** @return array{columns: array, rows: array, warnings: array, errors: array, delimiter: string} */
    private function parse(UploadedFile $file): array
    {
        $content = file_get_contents($file->getRealPath());
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);
        $lines = preg_split('/\r\n|\r|\n/', trim($content));

        if (count($lines) < 2) {
            return ['columns' => [], 'rows' => [], 'warnings' => [], 'errors' => ['Fichier vide ou sans données.'], 'delimiter' => ';'];
        }

        $delimiter = substr_count($lines[0], ';') >= substr_count($lines[0], ',') ? ';' : ',';
        $headers = array_map(fn ($h) => mb_strtolower(trim($h)), str_getcsv($lines[0], $delimiter));
        $headers = array_map([$this, 'normalizeHeader'], $headers);

        foreach (['building', 'lot_number'] as $required) {
            if (! in_array($required, $headers, true)) {
                return ['columns' => $headers, 'rows' => [], 'warnings' => [], 'errors' => ["Colonne requise manquante : {$required}."], 'delimiter' => $delimiter];
            }
        }

        $rows = [];
        $warnings = [];
        $errors = [];
        $seenInFile = [];
        $titlesSeen = [];

        for ($i = 1; $i < count($lines); $i++) {
            if (trim($lines[$i]) === '') {
                continue;
            }
            $values = str_getcsv($lines[$i], $delimiter);
            if (count($values) !== count($headers)) {
                $errors[] = 'Ligne '.($i + 1).' : '.count($values).' colonnes au lieu de '.count($headers).'.';

                continue;
            }
            $assoc = array_combine($headers, array_map('trim', $values));
            $lineNo = $i + 1;

            $building = $assoc['building'] ?? '';
            $lotNumber = $assoc['lot_number'] ?? '';
            if ($building === '' || $lotNumber === '') {
                $errors[] = "Ligne {$lineNo} : building et lot_number sont requis.";

                continue;
            }
            $key = mb_strtolower($building.'||'.$lotNumber);
            if (isset($seenInFile[$key])) {
                $errors[] = "Ligne {$lineNo} : doublon dans le fichier (bâtiment {$building}, lot {$lotNumber}, déjà ligne {$seenInFile[$key]}).";

                continue;
            }
            $seenInFile[$key] = $lineNo;

            $typeRaw = $assoc['type'] ?? 'apartment';
            $type = LotType::fromInput($typeRaw === '' ? 'apartment' : $typeRaw);
            if ($type === null) {
                $warnings[] = "Ligne {$lineNo} : type '{$typeRaw}' inconnu → classé « Autre ».";
                $type = LotType::Other;
            }

            $surface = $this->toDecimal($assoc['surface'] ?? null, "Ligne {$lineNo} : surface invalide.", $errors);
            $tantieme = $this->toDecimal($assoc['tantieme'] ?? null, "Ligne {$lineNo} : tantième invalide.", $errors);
            if ($surface !== null && $surface < 0) {
                $errors[] = "Ligne {$lineNo} : surface négative.";
            }
            if ($tantieme !== null && $tantieme < 0) {
                $errors[] = "Ligne {$lineNo} : tantième négatif.";
            }

            $parking = mb_strtolower(trim($assoc['parking'] ?? 'no'));
            $parking = in_array($parking, ['yes', 'oui', 'no', 'non', 'common', 'commun'], true) ? $parking : 'no';
            $parking = strtr($parking, ['oui' => 'yes', 'non' => 'no', 'commun' => 'common']);

            $boxRaw = mb_strtolower(trim($assoc['box'] ?? ''));
            $boxNumbers = $this->splitList($assoc['box_numbers'] ?? '');
            $parkingNumbers = $this->splitList($assoc['parking_numbers'] ?? '');
            $hasBox = in_array($boxRaw, ['yes', 'oui', '1', 'true'], true) || ! empty($boxNumbers);

            $floorRaw = trim($assoc['floor'] ?? $assoc['etage'] ?? '');
            $floor = $floorRaw === '' ? null : (is_numeric($floorRaw) ? (int) $floorRaw : null);
            if ($floorRaw !== '' && $floor === null) {
                $errors[] = "Ligne {$lineNo} : étage invalide.";
            }

            $title = $assoc['land_title_no'] ?? null;
            $title = $title === '' ? null : mb_strtoupper(preg_replace('/\s+/', '', $title));
            if ($title && isset($titlesSeen[$title])) {
                $warnings[] = "Ligne {$lineNo} : titre foncier {$title} déjà présent ligne {$titlesSeen[$title]} (avertissement, pas d'erreur).";
            } elseif ($title) {
                $titlesSeen[$title] = $lineNo;
            }

            $rows[] = [
                'building' => $building,
                'lot_number' => $lotNumber,
                'type' => $type->value,
                'type_label' => $type->label(),
                'surface' => $surface,
                'tantieme' => $tantieme ?? 0,
                'land_title_no' => $title,
                'parking' => $parking,
                'parking_numbers' => $parkingNumbers,
                'has_box' => $hasBox,
                'box_numbers' => $boxNumbers,
                'floor' => $floor,
                'notes' => $assoc['notes'] ?? null,
            ];
        }

        return ['columns' => $headers, 'rows' => $rows, 'warnings' => $warnings, 'errors' => $errors, 'delimiter' => $delimiter];
    }

    private function summary(int $residenceId, array $parsed, array $rows): array
    {
        $buildingNames = array_unique(array_column($rows, 'building'));
        $existingB = Building::where('residence_id', $residenceId)->whereIn('number', $buildingNames)->pluck('number')->all();
        $existingLots = Lot::where('residence_id', $residenceId)->get(['building_id', 'number']);
        $existingKeys = [];
        $bldIds = Building::where('residence_id', $residenceId)->whereIn('number', $buildingNames)->pluck('id', 'number')->all();
        foreach ($existingLots as $l) {
            $existingKeys[] = $l->building_id.'||'.mb_strtolower($l->number);
        }

        $toUpdate = 0;
        foreach ($rows as $r) {
            $bid = $bldIds[$r['building']] ?? null;
            if ($bid && in_array($bid.'||'.mb_strtolower($r['lot_number']), $existingKeys, true)) {
                $toUpdate++;
            }
        }

        return [
            'columns' => $parsed['columns'],
            'delimiter' => $parsed['delimiter'],
            'rows_total' => count($rows),
            'to_create_buildings' => count(array_diff($buildingNames, $existingB)),
            'to_create_lots' => count($rows) - $toUpdate,
            'to_update_lots' => $toUpdate,
            'warnings' => $parsed['warnings'],
            'errors' => $parsed['errors'],
            'preview_rows' => array_slice($rows, 0, 5),
        ];
    }

    private function normalizeHeader(string $h): string
    {
        return match ($h) {
            'batiment', 'immeuble', 'building_name', 'bat' => 'building',
            'lot', 'appartement', 'numero', 'lot_no', 'numero_lot' => 'lot_number',
            'n_titre_foncier', 'titre_foncier', 'tf' => 'land_title_no',
            'etage' => 'floor',
            default => $h,
        };
    }

    /** @return string[] */
    private function splitList(?string $v): array
    {
        if ($v === null || trim($v) === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode('|', $v))));
    }

    private function toDecimal(mixed $v, string $msg, array &$errors): ?float
    {
        if ($v === null || trim((string) $v) === '') {
            return null;
        }
        $norm = str_replace([' ', "\u{00A0}"], '', (string) $v);
        $norm = str_contains($norm, ',') && ! str_contains($norm, '.') ? str_replace(',', '.', $norm) : str_replace(',', '', $norm);
        if (! is_numeric($norm)) {
            $errors[] = $msg;

            return null;
        }

        return (float) $norm;
    }
}
