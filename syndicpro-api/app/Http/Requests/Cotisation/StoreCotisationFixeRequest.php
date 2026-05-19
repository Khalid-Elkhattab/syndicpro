<?php

namespace App\Http\Requests\Cotisation;

use Illuminate\Foundation\Http\FormRequest;

class StoreCotisationFixeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $residenceId = $this->route('residence');
        $residence = \App\Models\Residence::find($residenceId);

        return $residence && $residence->syndic_id === auth()->id();
    }

    public function rules(): array
    {
        return [
            'label' => 'required|string|max:200',
            'montant_mensuel' => 'required|numeric|min:1',
            'periode_id' => 'required|exists:periodes,id',
            'description' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'label.required' => 'Le label de la cotisation est obligatoire.',
            'label.max' => 'Le label ne doit pas dépasser 200 caractères.',
            'montant_mensuel.required' => 'Le montant mensuel est obligatoire.',
            'montant_mensuel.numeric' => 'Le montant doit être un nombre.',
            'montant_mensuel.min' => 'Le montant doit être au minimum 1 DH.',
            'periode_id.required' => 'La période est obligatoire.',
            'periode_id.exists' => 'La période sélectionnée est invalide.',
            'description.max' => 'La description ne doit pas dépasser 500 caractères.',
        ];
    }
}