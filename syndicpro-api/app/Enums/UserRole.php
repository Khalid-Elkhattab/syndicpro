<?php

namespace App\Enums;

enum UserRole: string
{
    case Syndic = 'syndic';
    case Coproprietaire = 'coproprietaire';
}