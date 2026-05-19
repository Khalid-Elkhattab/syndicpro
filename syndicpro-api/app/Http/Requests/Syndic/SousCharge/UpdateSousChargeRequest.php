<?php

namespace App\Http\Requests\Syndic\SousCharge;

use App\Models\SousCharge;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSousChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $sousCharge = \App\Models\SousCharge::with('compteCharge.residence')->find($this->route('sous_charge'));

        if (!$sousCharge) {
            return false;
        }

        return $sousCharge->compteCharge->residence->syndic_id === auth()->id();
    }

    public function rules(): array
    {
        $sousChargeId = $this->route('sous_charge');
        $compteChargeId = $this->route('compte_charge');

        return [
            'nom' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                Rule::unique('sous_charges', 'nom')
                    ->where('compte_charge_id', $compteChargeId)
                    ->ignore($sousChargeId),
            ],
            'description' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de la sous-charge est obligatoire.',
            'nom.max' => 'Le nom ne doit pas dépasser 150 caractères.',
            'nom.unique' => 'Une sous-charge avec ce nom existe déjà pour ce compte.',
            'description.max' => 'La description ne doit pas dépasser 500 caractères.',
        ];
    }
}