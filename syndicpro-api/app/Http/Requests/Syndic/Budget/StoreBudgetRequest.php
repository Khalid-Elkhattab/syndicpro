<?php

namespace App\Http\Requests\Syndic\Budget;

use Illuminate\Foundation\Http\FormRequest;

class StoreBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'compte_charge_id' => 'required|integer|exists:compte_charges,id',
            'montant_prevu' => 'required|numeric|min:0|max:999999999.99',
        ];
    }

    public function messages(): array
    {
        return [
            'compte_charge_id.required' => 'Le compte charge est obligatoire.',
            'compte_charge_id.exists' => 'Le compte charge sélectionné est invalide.',
            'montant_prevu.required' => 'Le montant prévu est obligatoire.',
            'montant_prevu.numeric' => 'Le montant doit être un nombre.',
            'montant_prevu.min' => 'Le montant ne peut pas être négatif.',
            'montant_prevu.max' => 'Le montant ne peut pas dépasser 999 999 999,99 DH.',
        ];
    }
}