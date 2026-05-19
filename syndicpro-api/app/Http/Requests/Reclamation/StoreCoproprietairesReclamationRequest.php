<?php

namespace App\Http\Requests\Reclamation;

use App\Models\Appartement;
use Illuminate\Foundation\Http\FormRequest;

class StoreCoproprietairesReclamationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $appartement = Appartement::findOrFail($this->appartement_id);
        return $appartement->coproprietaire_id === auth()->id();
    }

    public function rules(): array
    {
        return [
            'appartement_id' => 'required|exists:appartements,id',
            'titre' => 'required|string|max:200',
            'description' => 'required|string|max:2000',
            'priorite' => 'required|in:normale,urgente',
        ];
    }

    public function messages(): array
    {
        return [
            'appartement_id.required' => 'L\'appartement est obligatoire.',
            'appartement_id.exists' => 'L\'appartement sélectionné est invalide.',
            'titre.required' => 'Le titre est obligatoire.',
            'titre.max' => 'Le titre ne doit pas dépasser :max caractères.',
            'description.required' => 'La description est obligatoire.',
            'description.max' => 'La description ne doit pas dépasser :max caractères.',
            'priorite.required' => 'La priorité est obligatoire.',
            'priorite.in' => 'La priorité sélectionnée est invalide.',
        ];
    }
}