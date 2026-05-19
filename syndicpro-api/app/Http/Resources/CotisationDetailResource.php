<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CotisationDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $statutValue = $this->statut instanceof \App\Enums\CotisationDetailStatut ? $this->statut->value : $this->statut;

        return [
            'id' => $this->id,
            'cotisation_id' => $this->cotisation_id,
            'appartement_id' => $this->appartement_id,
            'coproprietaire_id' => $this->coproprietaire_id,
            'montant' => (float) $this->montant,
            'montant_paye' => (float) $this->montant_paye,
            'montant_restant' => (float) ($this->montant - $this->montant_paye),
            'statut' => $statutValue,
            'statut_label' => $this->getStatutLabel($statutValue),
            'anciennete_jours' => $this->created_at ? now()->diffInDays($this->created_at) : null,
            'created_at' => $this->created_at?->format('d/m/Y'),
            'appartement' => new AppartementResource($this->whenLoaded('appartement')),
            'coproprietaire' => new UserResource($this->whenLoaded('coproprietaire')),
            'cotisation' => $this->whenLoaded('cotisation') ? [
                'id' => $this->cotisation->id,
                'label' => $this->cotisation->label,
                'type' => $this->cotisation->type,
            ] : null,
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),
        ];
    }

    private function getStatutLabel(string $statut): string
    {
        return match ($statut) {
            'paye' => 'Payé',
            'partiellement_paye' => 'Partiellement payé',
            'non_paye' => 'Non payé',
            default => 'Inconnu',
        };
    }
}