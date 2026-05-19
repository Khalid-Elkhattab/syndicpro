<?php

namespace App\Http\Requests\Syndic\Depense;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $depense = \App\Models\Depense::with('sousCharge.compteCharge.residence')->find($this->route('depense'));

        if (!$depense) {
            return false;
        }

        return $depense->sousCharge->compteCharge->residence->syndic_id === auth()->id();
    }

    public function rules(): array
    {
        return [
            'date' => 'sometimes|required|date|before_or_equal:today',
            'montant' => 'sometimes|required|numeric|min:0.01|max:999999.99',
            'description' => 'sometimes|required|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'date.required' => 'La date est obligatoire.',
            'date.date' => 'La date doit être une date valide.',
            'date.before_or_equal' => 'La date ne peut pas être dans le futur.',
            'montant.required' => 'Le montant est obligatoire.',
            'montant.numeric' => 'Le montant doit être un nombre.',
            'montant.min' => 'Le montant doit être supérieur à 0.',
            'montant.max' => 'Le montant ne doit pas dépasser 999 999,99 DH.',
            'description.required' => 'La description est obligatoire.',
            'description.max' => 'La description ne doit pas dépasser 1000 caractères.',
        ];
    }
}