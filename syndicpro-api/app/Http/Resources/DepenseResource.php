<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sous_charge_id' => $this->sous_charge_id,
            'residence_id' => $this->residence_id,
            'date' => $this->date?->format('d/m/Y'),
            'montant' => (float) $this->montant,
            'description' => $this->description,
            'has_justificatif' => $this->getMedia('justificatifs')->isNotEmpty(),
            'justificatif_url' => $this->when(
                $this->getMedia('justificatifs')->isNotEmpty(),
                fn() => $this->getMedia('justificatifs')->first()?->getTemporaryUrl(now()->addMinutes(60))
            ),
            'sous_charge' => new SousChargeResource($this->whenLoaded('sousCharge')),
            'created_at' => $this->created_at?->format('d/m/Y'),
        ];
    }
}