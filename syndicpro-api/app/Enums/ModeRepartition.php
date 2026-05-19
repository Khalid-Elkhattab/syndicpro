<?php

namespace App\Enums;

enum ModeRepartition: string
{
    case Egale = 'egale';
    case ParAppartement = 'par_appartement';
    case ParTantieme = 'par_tantieme';
}