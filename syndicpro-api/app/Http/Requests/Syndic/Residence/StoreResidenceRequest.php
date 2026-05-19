<?php

namespace App\Http\Requests\Syndic\Residence;

use Illuminate\Foundation\Http\FormRequest;

class StoreResidenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:150',
            'ville' => 'required|string|max:100',
            'adresse' => 'required|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de la résidence est obligatoire.',
            'nom.max' => 'Le nom ne doit pas dépasser 150 caractères.',
            'ville.required' => 'La ville est obligatoire.',
            'ville.max' => 'La ville ne doit pas dépasser 100 caractères.',
            'adresse.required' => 'L\'adresse est obligatoire.',
            'adresse.max' => 'L\'adresse ne doit pas dépasser 500 caractères.',
        ];
    }
}