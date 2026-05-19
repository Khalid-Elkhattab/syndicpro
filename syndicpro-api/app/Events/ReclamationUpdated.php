<?php

namespace App\Events;

use App\Models\Reclamation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReclamationUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Reclamation $reclamation)
    {
    }
}