<?php

namespace App\Http\Resources;

use App\Services\OwnerSituationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OwnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $showFull = $request->routeIs('*.owners.show')
            && $request->user()?->can('owners.view_identity');

        return [
            'id' => $this->id,
            'type' => $this->type instanceof \App\Enums\OwnerType ? $this->type->value : $this->type,
            'display_name' => $this->display_name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'company_name' => $this->company_name,
            'identity_number' => $showFull
                ? $this->identity_number
                : OwnerSituationService::maskIdentity($this->identity_number),
            'phones' => $this->whenLoaded('phones', fn () => $this->phones->map(fn ($p) => [
                'number' => $p->number, 'is_whatsapp' => $p->is_whatsapp, 'is_primary' => $p->is_primary,
            ])),
            'emails' => $this->whenLoaded('emails', fn () => $this->emails->map(fn ($e) => [
                'email' => $e->email, 'is_primary' => $e->is_primary,
            ])),
            'properties' => $this->whenLoaded('ownerships', fn () => $this->ownerships->map(fn ($o) => [
                'lot_id' => $o->lot_id,
                'lot_number' => $o->lot?->number,
                'building' => $o->lot?->building?->number,
                'residence_id' => $o->lot?->residence_id,
                'share_percent' => $o->share_percent,
                'started_on' => $o->started_on,
                'ended_on' => $o->ended_on,
            ])),
        ];
    }
}
