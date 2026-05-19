<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetPrevisionnelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'periode_id' => $this->periode_id,
            'compte_charge_id' => $this->compte_charge_id,
            'montant_prevu' => (float) $this->montant_prevu,
            'montant_consomme' => (float) $this->montant_consomme,
            'montant_restant' => (float) $this->montant_restant,
            'pourcentage_consomme' => (float) $this->pourcentage_consomme,
            'est_depasse' => (bool) $this->est_depasse,
            'compte_charge' => $this->whenLoaded('compteCharge') ? [
                'id' => $this->compteCharge->id,
                'nom' => $this->compteCharge->nom,
            ] : null,
            'created_at' => $this->created_at?->format('d/m/Y'),
        ];
    }
}