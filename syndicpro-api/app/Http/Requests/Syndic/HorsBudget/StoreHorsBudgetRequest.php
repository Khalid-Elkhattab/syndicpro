<?php

namespace App\Http\Requests\Syndic\HorsBudget;

use Illuminate\Foundation\Http\FormRequest;

class StoreHorsBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        $residence = \App\Models\Residence::find($this->route('residence'));

        if (!$residence) {
            return false;
        }

        return $residence->syndic_id === auth()->id();
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date|before_or_equal:today',
            'montant' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:1000',
            'justificatif' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
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
            'description.required' => 'La description est obligatoire.',
            'description.max' => 'La description ne doit pas dépasser 1000 caractères.',
            'justificatif.mimes' => 'Le fichier doit être au format PDF, JPG ou PNG.',
            'justificatif.max' => 'Le fichier ne doit pas dépasser 5 Mo.',
        ];
    }
}