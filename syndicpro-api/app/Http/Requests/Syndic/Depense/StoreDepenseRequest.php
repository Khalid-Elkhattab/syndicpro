<?php

namespace App\Http\Requests\Syndic\Depense;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $sousCharge = \App\Models\SousCharge::with('compteCharge.residence')->find($this->input('sous_charge_id'));

        if (!$sousCharge) {
            return false;
        }

        return $sousCharge->compteCharge->residence->syndic_id === auth()->id();
    }

    public function rules(): array
    {
        return [
            'sous_charge_id' => 'required|exists:sous_charges,id',
            'date' => 'required|date|before_or_equal:today',
            'montant' => 'required|numeric|min:0.01|max:999999.99',
            'description' => 'required|string|max:1000',
            'justificatif' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'sous_charge_id.required' => 'La sous-charge est obligatoire.',
            'sous_charge_id.exists' => 'La sous-charge sélectionnée est invalide.',
            'date.required' => 'La date est obligatoire.',
            'date.date' => 'La date doit être une date valide.',
            'date.before_or_equal' => 'La date ne peut pas être dans le futur.',
            'montant.required' => 'Le montant est obligatoire.',
            'montant.numeric' => 'Le montant doit être un nombre.',
            'montant.min' => 'Le montant doit être supérieur à 0.',
            'montant.max' => 'Le montant ne doit pas dépasser 999 999,99 DH.',
            'description.required' => 'La description est obligatoire.',
            'description.max' => 'La description ne doit pas dépasser 1000 caractères.',
            'justificatif.mimes' => 'Le fichier doit être au format PDF, JPG ou PNG.',
            'justificatif.max' => 'Le fichier ne doit pas dépasser 5 Mo.',
        ];
    }
}