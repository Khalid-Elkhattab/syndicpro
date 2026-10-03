<?php

namespace App\Enums;

enum CotisationDetailStatut: string
{
    use HasLabel;

    case NonPaye = 'non_paye';
    case PartiellementPaye = 'partiellement_paye';
    case Paye = 'paye';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::NonPaye => 'Non payé',
            self::PartiellementPaye => 'Partiellement payé',
            self::Paye => 'Payé',
        };
    }
}
