<?php

namespace App\Http\Requests\Syndic\Immeuble;

use Illuminate\Foundation\Http\FormRequest;

class StoreImmeubleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'residence_id' => 'required|exists:residences,id',
            'nom' => 'required|string|max:100|unique:immeubles,nom,NULL,id,residence_id,' . $this->input('residence_id'),
        ];
    }

    public function messages(): array
    {
        return [
            'residence_id.required' => 'La résidence est obligatoire.',
            'residence_id.exists' => 'La résidence sélectionnée est invalide.',
            'nom.required' => 'Le nom de l\'immeuble est obligatoire.',
            'nom.unique' => 'Un immeuble avec ce nom existe déjà dans cette résidence.',
            'nom.max' => 'Le nom ne doit pas dépasser 100 caractères.',
        ];
    }
}