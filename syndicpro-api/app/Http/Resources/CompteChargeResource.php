<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompteChargeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'residence_id' => $this->residence_id,
            'nb_sous_charges' => $this->whenCounted('sousCharges'),
            'sous_charges' => SousChargeResource::collection($this->whenLoaded('sousCharges')),
            'created_at' => $this->created_at?->format('d/m/Y'),
        ];
    }
}