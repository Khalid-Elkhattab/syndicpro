<?php

namespace App\Http\Requests\Syndic\Periode;

use Illuminate\Foundation\Http\FormRequest;

class StorePeriodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $residenceId = $this->route('residence') ?? $this->input('residence_id');

        return [
            'annee' => 'required|integer|min:2020|max:2100|unique:periodes,annee,NULL,id,residence_id,' . ($residenceId ?? 'null'),
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'is_active' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'annee.required' => 'L\'année est obligatoire.',
            'annee.integer' => 'L\'année doit être un nombre entier.',
            'annee.unique' => 'Une période existe déjà pour cette année.',
            'annee.min' => 'L\'année doit être supérieure ou égale à 2020.',
            'annee.max' => 'L\'année ne peut pas dépasser 2100.',
            'date_debut.required' => 'La date de début est obligatoire.',
            'date_debut.date' => 'La date de début doit être une date valide.',
            'date_fin.required' => 'La date de fin est obligatoire.',
            'date_fin.date' => 'La date de fin doit être une date valide.',
            'date_fin.after' => 'La date de fin doit être postérieure à la date de début.',
        ];
    }
}