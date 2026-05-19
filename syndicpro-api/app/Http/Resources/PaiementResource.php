<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaiementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $modePaiementValue = $this->mode_paiement instanceof \App\Enums\ModePaiement
            ? $this->mode_paiement->value
            : $this->mode_paiement;

        return [
            'id' => $this->id,
            'cotisation_detail_id' => $this->cotisation_detail_id,
            'coproprietaire_id' => $this->coproprietaire_id,
            'date_paiement' => $this->date_paiement?->format('d/m/Y'),
            'montant' => (float) $this->montant,
            'mode_paiement' => $modePaiementValue,
            'mode_paiement_label' => $this->getModeLabel($modePaiementValue),
            'reference' => $this->reference,
            'has_recu' => !empty($this->recu_path),
            'recu_url' => null,
            'created_at' => $this->created_at?->format('d/m/Y'),
            'cotisation_detail' => $this->whenLoaded('cotisationDetail') ? new CotisationDetailResource($this->cotisationDetail) : null,
            'coproprietaire' => $this->whenLoaded('coproprietaire') ? new UserResource($this->coproprietaire) : null,
        ];
    }

    private function getModeLabel(string $mode): string
    {
        return match ($mode) {
            'especes' => 'Espèces',
            'virement' => 'Virement',
            'cheque' => 'Chèque',
            'carte' => 'Carte bancaire',
            default => $mode,
        };
    }
}