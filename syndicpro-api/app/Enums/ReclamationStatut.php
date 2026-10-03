<?php

namespace App\Enums;

enum ReclamationStatut: string
{
    use HasLabel;

    case Nouveau = 'nouveau';
    case EnCours = 'en_cours';
    case Traite = 'traite';
    case Rejete = 'rejete';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Nouveau => 'Nouveau',
            self::EnCours => 'En cours',
            self::Traite => 'Traité',
            self::Rejete => 'Rejeté',
        };
    }
}
