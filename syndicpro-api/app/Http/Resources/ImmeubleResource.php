<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImmeubleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'residence_id' => $this->residence_id,
            'nb_appartements' => $this->appartements_count ?? $this->appartements?->count() ?? 0,
            'residence' => new ResidenceResource($this->whenLoaded('residence')),
            'appartements' => AppartementResource::collection($this->whenLoaded('appartements')),
            'created_at' => $this->created_at?->format('d/m/Y'),
        ];
    }
}