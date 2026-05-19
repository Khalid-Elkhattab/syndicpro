<?php

namespace App\Listeners;

use App\Events\ReclamationUpdated;
use App\Notifications\ReclamationUpdatedNotification;

class OnReclamationUpdated
{
    public function handle(ReclamationUpdated $event): void
    {
        $event->reclamation->coproprietaire->notify(
            new ReclamationUpdatedNotification($event->reclamation)
        );
    }
}