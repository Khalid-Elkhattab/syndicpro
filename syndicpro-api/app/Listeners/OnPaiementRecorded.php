<?php

namespace App\Listeners;

use App\Events\PaiementRecorded;

class OnPaiementRecorded
{
    public function handle(PaiementRecorded $event): void
    {
        // Will be implemented in Phase 9 (Paiements)
        // For now: dispatch GenerateReceipt, dispatch SendPaymentConfirmation
        // Update CotisationDetail via PaiementObserver
    }
}