<?php

namespace App\Events;

use App\Models\Paiement;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaiementRecorded
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Paiement $paiement)
    {
    }
}