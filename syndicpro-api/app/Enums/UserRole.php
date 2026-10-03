<?php

namespace App\Enums;

enum UserRole: string
{
    use HasLabel;

    case Syndic = 'syndic';
    case Coproprietaire = 'coproprietaire';
    case Assistant = 'assistant';
    case SuperAdmin = 'super_admin';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Syndic => 'Syndic',
            self::Coproprietaire => 'Copropriétaire',
            self::Assistant => 'Assistant',
            self::SuperAdmin => 'Super admin',
        };
    }
}
