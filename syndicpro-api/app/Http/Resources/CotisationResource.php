<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CotisationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'residence_id' => $this->residence_id,
            'periode_id' => $this->periode_id,
            'type' => $this->type instanceof \App\Enums\CotisationType ? $this->type->value : $this->type,
            'type_label' => $this->type === 'fixe' ? 'Fixe' : 'Exceptionnelle',
            'label' => $this->label,
            'montant_total' => (float) $this->montant_total,
            'montant_mensuel' => $this->montant_mensuel ? (float) $this->montant_mensuel : null,
            'mode_repartition' => $this->mode_repartition,
            'mode_repartition_label' => $this->getModeRepartitionLabel(),
            'mois' => $this->mois,
            'annee' => $this->annee,
            'description' => $this->description,
            'details_count' => $this->whenLoaded('cotisationDetails', fn() => $this->cotisationDetails->count()),
            'created_at' => $this->created_at?->format('d/m/Y'),
            'periode' => new PeriodeResource($this->whenLoaded('periode')),
            'residence' => new ResidenceResource($this->whenLoaded('residence')),
            'cotisationDetails' => CotisationDetailResource::collection($this->whenLoaded('cotisationDetails')),
        ];
    }

    private function getModeRepartitionLabel(): ?string
    {
        return match ($this->mode_repartition) {
            'egale' => 'Répartition égale',
            'par_apppartement' => 'Par appartement',
            'par_tantieme' => 'Par tantième',
            default => null,
        };
    }
}