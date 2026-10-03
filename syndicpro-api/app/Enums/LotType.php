<?php

namespace App\Enums;

/**
 * Tous les types de lots — pas seulement les appartements.
 * Stocké en string (jamais en DB enum) pour ajouter un cas sans migration.
 */
enum LotType: string
{
    use HasLabel;

    case Apartment = 'apartment';
    case Studio = 'studio';
    case Duplex = 'duplex';
    case Shop = 'shop';
    case Office = 'office';
    case House = 'house';
    case LargeSurface = 'large_surface';
    case Other = 'other';

    // Labels FR natifs (l'UI reste en français quelle que soit la locale applicative).
    public function frenchLabel(): string
    {
        return match ($this) {
            self::Apartment => 'Appartement',
            self::Studio => 'Studio',
            self::Duplex => 'Duplex',
            self::Shop => 'Magasin / Commerce',
            self::Office => 'Bureau',
            self::House => 'Villa / Maison',
            self::LargeSurface => 'Grande surface',
            self::Other => 'Autre',
        };
    }

    /** Accepte les libellés FR usuels + alias CSV (insensible casse/accents/espaces). */
    public static function fromInput(?string $input): ?self
    {
        if ($input === null || trim($input) === '') {
            return null;
        }

        $norm = mb_strtolower(trim($input), 'UTF-8');
        $norm = strtr($norm, [
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'à' => 'a',
            'ç' => 'c', 'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'ù' => 'u',
        ]);
        $norm = preg_replace('/[\s_\-]+/', '_', $norm);

        $map = [
            'apartment' => self::Apartment, 'apartement' => self::Apartment,
            'appartement' => self::Apartment, 'appart' => self::Apartment, 'apt' => self::Apartment,
            'studio' => self::Studio, 'studette' => self::Studio,
            'duplex' => self::Duplex,
            'shop' => self::Shop, 'magasin' => self::Shop, 'commerce' => self::Shop,
            'local_commercial' => self::Shop, 'local' => self::Shop,
            'office' => self::Office, 'bureau' => self::Office, 'bureaux' => self::Office,
            'house' => self::House, 'maison' => self::House, 'villa' => self::House,
            'pavillon' => self::House,
            'large_surface' => self::LargeSurface, 'grande_surface' => self::LargeSurface,
            'other' => self::Other, 'autre' => self::Other, 'divers' => self::Other,
        ];

        return $map[$norm] ?? self::tryFrom($norm);
    }
}
