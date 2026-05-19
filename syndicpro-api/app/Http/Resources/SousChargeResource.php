<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SousChargeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'description' => $this->description,
            'compte_charge_id' => $this->compte_charge_id,
            'residence_id' => $this->residence_id,
            'compte_charge' => new CompteChargeResource($this->whenLoaded('compteCharge')),
            'created_at' => $this->created_at?->format('d/m/Y'),
        ];
    }
}