<?php

namespace App\Enums;

enum ModePaiement: string
{
    use HasLabel;

    case Especes = 'especes';
    case Virement = 'virement';
    case Cheque = 'cheque';
    case Carte = 'carte';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Especes => 'Espèces',
            self::Virement => 'Virement',
            self::Cheque => 'Chèque',
            self::Carte => 'Carte',
        };
    }
}
