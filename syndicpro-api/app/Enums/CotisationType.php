<?php

namespace App\Enums;

enum CotisationType: string
{
    use HasLabel;

    case Fixe = 'fixe';
    case Exceptionnelle = 'exceptionnelle';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Fixe => 'Fixe',
            self::Exceptionnelle => 'Exceptionnelle',
        };
    }
}
