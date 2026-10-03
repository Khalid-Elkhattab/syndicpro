<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CoproprietaireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'username' => $this->username,
            'type' => $this->type instanceof \App\Enums\UserType ? $this->type->value : $this->type,
            'status' => $this->status instanceof \App\Enums\AccountStatus ? $this->status->value : $this->status,
            'is_active' => $this->is_active,
            'nb_appartements' => $this->relationLoaded('appartements')
                ? $this->appartements->count()
                : $this->appartements_count ?? 0,
            'created_at' => $this->created_at?->format('d/m/Y'),
            'appartements' => AppartementResource::collection($this->whenLoaded('appartements')),
            'cotisation_details' => CotisationDetailResource::collection($this->whenLoaded('cotisationDetails')),
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),
            'reclamations' => ReclamationResource::collection($this->whenLoaded('reclamations')),
        ];
    }
}