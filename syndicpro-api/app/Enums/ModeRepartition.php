<?php

namespace App\Enums;

enum ModeRepartition: string
{
    use HasLabel;

    case Egale = 'egale';
    case ParAppartement = 'par_appartement';
    case ParTantieme = 'par_tantieme';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Egale => 'Égale',
            self::ParAppartement => 'Par lot',
            self::ParTantieme => 'Par tantième',
        };
    }
}
