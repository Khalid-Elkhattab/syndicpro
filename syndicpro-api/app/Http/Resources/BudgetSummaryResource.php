<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'prevu_total' => (float) ($this->resource['prevu_total'] ?? 0),
            'consomme_total' => (float) ($this->resource['consomme_total'] ?? 0),
            'restant_total' => (float) ($this->resource['restant_total'] ?? 0),
            'hors_budget_total' => (float) ($this->resource['hors_budget_total'] ?? 0),
            'par_compte' => array_map(function ($compte) {
                return [
                    'id' => $compte['id'],
                    'compte_charge_id' => $compte['compte_charge_id'],
                    'compte_charge' => $compte['compte_charge'],
                    'montant_prevu' => (float) $compte['montant_prevu'],
                    'montant_consomme' => (float) $compte['montant_consomme'],
                    'montant_restant' => (float) $compte['montant_restant'],
                    'pourcentage_consomme' => (float) $compte['pourcentage_consomme'],
                    'est_depasse' => (bool) $compte['est_depasse'],
                    'sous_charges_detail' => array_map(function ($sc) {
                        return [
                            'sous_charge' => $sc['sous_charge'],
                            'consomme' => (float) $sc['consomme'],
                        ];
                    }, $compte['sous_charges_detail'] ?? []),
                ];
            }, $this->resource['par_compte'] ?? []),
        ];
    }
}