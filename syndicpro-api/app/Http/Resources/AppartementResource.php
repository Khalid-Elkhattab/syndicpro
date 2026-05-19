<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppartementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'etage' => $this->etage,
            'tantieme' => (float) $this->tantieme,
            'immeuble_id' => $this->immeuble_id,
            'residence_id' => $this->residence_id,
            'coproprietaire_id' => $this->coproprietaire_id,
            'deleted_at' => $this->deleted_at?->format('d/m/Y'),
            'created_at' => $this->created_at?->format('d/m/Y'),
            'immeuble' => new ImmeubleResource($this->whenLoaded('immeuble')),
            'residence' => new ResidenceResource($this->whenLoaded('residence')),
            'coproprietaire' => new UserResource($this->whenLoaded('coproprietaire')),
        ];
    }
}