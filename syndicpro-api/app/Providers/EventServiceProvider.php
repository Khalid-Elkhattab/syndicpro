<?php

namespace App\Providers;

use App\Events\CotisationCreated;
use App\Events\PaiementRecorded;
use App\Events\ReclamationUpdated;
use App\Listeners\OnCotisationCreated;
use App\Listeners\OnPaiementRecorded;
use App\Listeners\OnReclamationUpdated;
use Illuminate\Support\Facades\Event;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        CotisationCreated::class => [
            OnCotisationCreated::class,
        ],
        PaiementRecorded::class => [
            OnPaiementRecorded::class,
        ],
        ReclamationUpdated::class => [
            OnReclamationUpdated::class,
        ],
    ];

    public function boot(): void
    {
        //
    }

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}