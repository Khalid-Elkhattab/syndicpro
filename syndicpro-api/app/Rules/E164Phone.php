<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** Téléphone E.164 : + suivi de 7 à 15 chiffres. */
class E164Phone implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $normalized = preg_replace('/[\s\-().]/', '', (string) $value);

        if (! preg_match('/^\+\d{7,15}$/', $normalized)) {
            $fail('Le :attribute doit être au format international (+2126…).');
        }
    }

    public static function normalize(string $value): string
    {
        return preg_replace('/[\s\-().]/', '', trim($value));
    }
}
