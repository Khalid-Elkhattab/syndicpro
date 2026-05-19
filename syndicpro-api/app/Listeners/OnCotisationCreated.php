<?php

namespace App\Listeners;

use App\Events\CotisationCreated;

class OnCotisationCreated
{
    public function handle(CotisationCreated $event): void
    {
        // Will be implemented in Phase 8 (Cotisations)
        // For now: dispatch GenerateMonthlyCotisations if type is fixe, log audit
    }
}