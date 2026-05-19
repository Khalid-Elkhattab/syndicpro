<?php

namespace App\Jobs;

use App\Services\PaiementService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateReceipt implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public int $paiementId
    ) {}

    public function handle(PaiementService $paiementService): void
    {
        $paiementService->genererRecu($this->paiementId);
    }

    public function failed(\Throwable $exception): void
    {
        \Illuminate\Support\Facades\Log::error('GenerateReceipt failed for paiement ' . $this->paiementId, [
            'error' => $exception->getMessage(),
        ]);
    }
}