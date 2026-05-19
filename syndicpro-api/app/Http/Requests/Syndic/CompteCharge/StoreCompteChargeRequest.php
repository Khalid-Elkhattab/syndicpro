<?php

namespace App\Http\Requests\Syndic\CompteCharge;

use App\Models\CompteCharge;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompteChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => [
                'required',
                'string',
                'max:150',
                Rule::unique('comptes_charges', 'nom')
                    ->where('residence_id', $this->route('residence')),
            ],
            'description' => 'nullable|string|max:500',
            'is_active' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom du compte de charges est obligatoire.',
            'nom.max' => 'Le nom ne doit pas dépasser 150 caractères.',
            'nom.unique' => 'Un compte de charges avec ce nom existe déjà pour cette résidence.',
            'description.max' => 'La description ne doit pas dépasser 500 caractères.',
        ];
    }
}