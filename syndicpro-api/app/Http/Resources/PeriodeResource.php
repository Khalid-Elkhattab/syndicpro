<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PeriodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'residence_id' => $this->residence_id,
            'annee' => $this->annee,
            'is_active' => $this->is_active,
            'date_debut' => $this->date_debut?->format('d/m/Y'),
            'date_fin' => $this->date_fin?->format('d/m/Y'),
            'created_at' => $this->created_at?->format('d/m/Y'),
        ];
    }
}