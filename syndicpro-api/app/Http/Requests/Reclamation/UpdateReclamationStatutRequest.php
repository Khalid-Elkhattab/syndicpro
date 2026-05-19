<?php

namespace App\Http\Requests\Reclamation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReclamationStatutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'statut' => 'required|in:en_cours,traite,rejete',
            'reponse_syndic' => 'nullable|string|max:2000',
        ];
    }

    public function messages(): array
    {
        return [
            'statut.required' => 'Le statut est obligatoire.',
            'statut.in' => 'Le statut sélectionné est invalide.',
            'reponse_syndic.max' => 'La réponse ne doit pas dépasser :max caractères.',
        ];
    }
}