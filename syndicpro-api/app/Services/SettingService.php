<?php

namespace App\Services;

use App\Models\Setting;

/**
 * Réglages du syndic (table settings clé/valeur).
 * Clés connues + défauts ; toute autre clé est refusée à l’écriture.
 */
class SettingService
{
    public const DEFAULTS = [
        // Validité (jours) d’un quitus de vente à l’émission.
        'quitus_validity_days' => 30,
        // Relance auto : impayé à partir de X mois de retard.
        'reminder_after_months' => 1,
        // Mise en demeure : impayé à partir de X mois de retard.
        'formal_notice_after_months' => 3,
        // Passage au juridique : impayé à partir de X mois de retard.
        'lawyer_after_months' => 12,
        // Taille max d’upload de documents (Mo).
        'document_max_mb' => 10,
    ];

    public const RULES = [
        'quitus_validity_days' => 'integer|min:1|max:365',
        'reminder_after_months' => 'integer|min:0|max:36',
        'formal_notice_after_months' => 'integer|min:0|max:36',
        'lawyer_after_months' => 'integer|min:0|max:60',
        'document_max_mb' => 'integer|min:1|max:100',
    ];

    public static function all(): array
    {
        $stored = Setting::whereIn('key', array_keys(self::DEFAULTS))->pluck('value', 'key')->all();
        $out = [];
        foreach (self::DEFAULTS as $key => $default) {
            $value = $stored[$key] ?? null;
            $out[$key] = is_array($value) && array_key_exists('v', $value) ? $value['v'] : ($value ?? $default);
        }

        return $out;
    }

    public static function get(string $key): mixed
    {
        if (! array_key_exists($key, self::DEFAULTS)) {
            throw new \InvalidArgumentException("Réglage inconnu : {$key}.");
        }

        return self::all()[$key];
    }

    public static function set(string $key, mixed $value): void
    {
        if (! array_key_exists($key, self::DEFAULTS)) {
            throw new \InvalidArgumentException("Réglage inconnu : {$key}.");
        }

        Setting::updateOrCreate(['key' => $key], ['value' => ['v' => $value]]);
    }
}
