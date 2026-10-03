<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'residence' => $this->whenLoaded('residence', fn () => [
                'id' => $this->residence->id, 'nom' => $this->residence->nom,
            ]),
            'building_input' => $this->building_input,
            'lot_input' => $this->lot_input,
            'lot_id' => $this->lot_id,
            'lot' => $this->whenLoaded('lot', fn () => [
                'id' => $this->lot->id,
                'number' => $this->lot->number,
                'type_label' => $this->lot->type_label,
                'building' => $this->lot->relationLoaded('building') ? $this->lot->building->number : null,
            ]),
            'match_result' => $this->match_result instanceof \App\Enums\AccountMatchResult
                ? $this->match_result->value : $this->match_result,
            'matched_owner' => $this->whenLoaded('matchedOwner', fn () => $this->matchedOwner ? [
                'id' => $this->matchedOwner->id,
                'display_name' => $this->matchedOwner->display_name,
            ] : null),
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'status' => $this->status instanceof \App\Enums\AccountRequestStatus
                ? $this->status->value : $this->status,
            'contact_confirmed' => $this->contact_confirmed,
            'documents_checked' => $this->documents_checked,
            'review_note' => $this->review_note,
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
