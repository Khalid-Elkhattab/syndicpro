<?php

namespace App\Http\Requests\Syndic\SousCharge;

use Illuminate\Auth\Access\AuthorizationException;
use App\Models\SousCharge;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSousChargeRequest extends FormRequest
{
    private ?string $authorizationMessage = null;

    public function authorize(): bool
    {
        $compteCharge = \App\Models\CompteCharge::with('residence')->find($this->route('comptes_charge'));

        if (!$compteCharge) {
            $this->authorizationMessage = 'Compte de charges introuvable.';
            return false;
        }

        if ($compteCharge->residence->syndic_id !== auth()->id()) {
            $this->authorizationMessage = 'Vous n\'êtes pas autorisé à gérer les sous-charges de ce compte.';
            return false;
        }

        return true;
    }

    protected function failedAuthorization()
    {
        throw new AuthorizationException($this->authorizationMessage ?? 'Accès non autorisé.');
    }

    public function rules(): array
    {
        return [
            'nom' => [
                'required',
                'string',
                'max:150',
                Rule::unique('sous_charges', 'nom')
                    ->where('compte_charge_id', $this->route('comptes_charge')),
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