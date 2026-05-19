<?php

namespace App\Observers;

use App\Models\Paiement;
use App\Services\PaiementService;

class PaiementObserver
{
    public function created(Paiement $paiement): void
    {
        $this->updateCotisationDetailStatut($paiement);
    }

    public function deleted(Paiement $paiement): void
    {
        $this->updateCotisationDetailStatut($paiement);
    }

    private function updateCotisationDetailStatut(Paiement $paiement): void
    {
        $paiementService = app(PaiementService::class);
        $paiementService->updateCotisationDetailStatut($paiement->cotisation_detail_id);
    }
}