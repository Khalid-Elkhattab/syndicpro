<?php

namespace App\Enums;

enum CotisationDetailStatut: string
{
    case NonPaye = 'non_paye';
    case PartiellementPaye = 'partiellement_paye';
    case Paye = 'paye';
}