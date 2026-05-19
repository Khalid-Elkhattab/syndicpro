<?php

namespace App\Http\Requests\Syndic\Appartement;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppartementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'residence_id' => 'required|exists:residences,id',
            'immeuble_id' => 'required|exists:immeubles,id',
            'numero' => 'required|string|max:20',
            'etage' => 'required|integer|min:0',
            'tantieme' => 'required|numeric|min:0.0001|max:9999.9999',
            'coproprietaire_id' => 'nullable|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'residence_id.required' => 'La résidence est obligatoire.',
            'residence_id.exists' => 'La résidence sélectionnée est invalide.',
            'immeuble_id.required' => 'L\'immeuble est obligatoire.',
            'immeuble_id.exists' => 'L\'immeuble sélectionné est invalide.',
            'numero.required' => 'Le numéro de l\'appartement est obligatoire.',
            'numero.max' => 'Le numéro ne doit pas dépasser 20 caractères.',
            'etage.required' => 'L\'étage est obligatoire.',
            'etage.integer' => 'L\'étage doit être un nombre entier.',
            'etage.min' => 'L\'étage ne peut pas être négatif.',
            'tantieme.required' => 'Le tantième est obligatoire.',
            'tantieme.min' => 'Le tantième doit être supérieur à 0.',
            'tantieme.numeric' => 'Le tantième doit être un nombre.',
            'coproprietaire_id.exists' => 'Le copropriétaire sélectionné est invalide.',
        ];
    }
}