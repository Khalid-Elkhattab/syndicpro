<?php

namespace App\Http\Requests\Syndic\Appartement;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppartementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'numero' => 'sometimes|required|string|max:20',
            'etage' => 'sometimes|required|integer|min:0',
            'tantieme' => 'sometimes|required|numeric|min:0.0001|max:9999.9999',
        ];
    }

    public function messages(): array
    {
        return [
            'numero.required' => 'Le numéro de l\'appartement est obligatoire.',
            'numero.max' => 'Le numéro ne doit pas dépasser 20 caractères.',
            'etage.required' => 'L\'étage est obligatoire.',
            'etage.integer' => 'L\'étage doit être un nombre entier.',
            'tantieme.required' => 'Le tantième est obligatoire.',
            'tantieme.min' => 'Le tantième doit être supérieur à 0.',
        ];
    }
}