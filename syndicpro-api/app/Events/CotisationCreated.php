<?php

namespace App\Events;

use App\Models\Cotisation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CotisationCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Cotisation $cotisation)
    {
    }
}