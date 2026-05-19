<?php

namespace App\Http\Requests\Syndic\Paiement;

use Illuminate\Foundation\Http\FormRequest;

class StorePaiementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $detail = \App\Models\CotisationDetail::with('cotisation.residence')->find($this->input('cotisation_detail_id'));

        if (!$detail) {
            return false;
        }

        return $detail->cotisation->residence->syndic_id === auth()->id();
    }

    public function rules(): array
    {
        return [
            'cotisation_detail_id' => 'required|exists:cotisation_details,id',
            'date_paiement' => 'required|date|before_or_equal:today',
            'montant' => 'required|numeric|min:0.01',
            'mode_paiement' => 'required|in:especes,virement,cheque,carte',
            'reference' => 'nullable|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'cotisation_detail_id.required' => 'Le détail de cotisation est obligatoire.',
            'cotisation_detail_id.exists' => 'Le détail de cotisation sélectionné est invalide.',
            'date_paiement.required' => 'La date de paiement est obligatoire.',
            'date_paiement.date' => 'La date doit être une date valide.',
            'date_payment.before_or_equal' => 'La date ne peut pas être dans le futur.',
            'montant.required' => 'Le montant est obligatoire.',
            'montant.numeric' => 'Le montant doit être un nombre.',
            'montant.min' => 'Le montant doit être supérieur à 0.',
            'mode_paiement.required' => 'Le mode de paiement est obligatoire.',
            'mode_paiement.in' => 'Le mode de paiement sélectionné est invalide.',
            'reference.max' => 'La référence ne doit pas dépasser 100 caractères.',
        ];
    }
}