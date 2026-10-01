<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResidenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'ville' => $this->ville,
            'adresse' => $this->adresse,
            'nb_immeubles' => $this->immeubles_count ?? $this->whenLoaded('immeubles', fn() => $this->immeubles->count(), 0),
            'nb_appartements' => $this->appartements_count ?? $this->whenLoaded('immeubles', fn() => $this->immeubles->sum(fn($im) => $im->appartements->count()), 0),
            'syndic_id' => $this->syndic_id,
            'syndic' => new UserResource($this->whenLoaded('syndic')),
            'immeubles' => ImmeubleResource::collection($this->whenLoaded('immeubles')),
            'periodes' => PeriodeResource::collection($this->whenLoaded('periodes')),
            'created_at' => $this->created_at?->format('d/m/Y'),
        ];
    }
}