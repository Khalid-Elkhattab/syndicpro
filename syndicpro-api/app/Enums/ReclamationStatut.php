<?php

namespace App\Enums;

enum ReclamationStatut: string
{
    case Nouveau = 'nouveau';
    case EnCours = 'en_cours';
    case Traite = 'traite';
    case Rejete = 'rejete';
}