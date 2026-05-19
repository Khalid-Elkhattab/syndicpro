<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReclamationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'coproprietaire_id' => $this->coproprietaire_id,
            'residence_id' => $this->residence_id,
            'appartement_id' => $this->appartement_id,
            'titre' => $this->titre,
            'description' => $this->description,
            'statut' => $this->statut instanceof \App\Enums\ReclamationStatut ? $this->statut->value : $this->statut,
            'statut_label' => $this->getStatutLabel(),
            'priorite' => $this->priorite,
            'priorite_label' => $this->priorite === 'urgente' ? 'Urgente' : 'Normale',
            'reponse_syndic' => $this->reponse_syndic,
            'date_reponse' => $this->date_reponse?->format('d/m/Y à H:i'),
            'anciennete_jours' => $this->created_at ? now()->diffInDays($this->created_at) : 0,
            'created_at' => $this->created_at?->format('d/m/Y'),
            'coproprietaire' => new UserResource($this->whenLoaded('coproprietaire')),
            'residence' => new ResidenceResource($this->whenLoaded('residence')),
            'appartement' => new AppartementResource($this->whenLoaded('appartement')),
        ];
    }

    private function getStatutLabel(): string
    {
        return match ($this->statut instanceof \App\Enums\ReclamationStatut ? $this->statut->value : $this->statut) {
            'nouveau' => 'Nouveau',
            'en_cours' => 'En cours',
            'traite' => 'Traité',
            'rejete' => 'Rejeté',
            default => 'Inconnu',
        };
    }
}