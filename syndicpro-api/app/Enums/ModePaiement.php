<?php

namespace App\Enums;

enum ModePaiement: string
{
    case Especes = 'especes';
    case Virement = 'virement';
    case Cheque = 'cheque';
    case Carte = 'carte';
}