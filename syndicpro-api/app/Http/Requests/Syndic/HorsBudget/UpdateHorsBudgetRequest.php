<?php

namespace App\Http\Requests\Syndic\HorsBudget;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHorsBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        $horsBudget = \App\Models\HorsBudget::with('residence')->find($this->route('hors_budget'));

        if (!$horsBudget) {
            return false;
        }

        return $horsBudget->residence->syndic_id === auth()->id();
    }

    public function rules(): array
    {
        return [
            'date' => 'sometimes|required|date|before_or_equal:today',
            'montant' => 'sometimes|required|numeric|min:0.01',
            'description' => 'sometimes|required|string|max:1000',
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
        ];
    }
}