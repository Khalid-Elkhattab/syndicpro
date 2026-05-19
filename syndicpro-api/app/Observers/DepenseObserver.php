<?php

namespace App\Observers;

use App\Models\BudgetPrevisionnel;
use App\Models\Depense;
use App\Services\BudgetService;
use Illuminate\Support\Facades\App;

class DepenseObserver
{
    public function created(Depense $depense): void
    {
        $this->recalculerConsomme($depense);
    }

    public function updated(Depense $depense): void
    {
        $this->recalculerConsomme($depense);
    }

    public function deleted(Depense $depense): void
    {
        $this->recalculerConsomme($depense);
    }

    private function recalculerConsomme(Depense $depense): void
    {
        $budget = BudgetPrevisionnel::query()
            ->whereHas('compteCharge.sousCharges', fn($q) =>
                $q->where('id', $depense->sous_charge_id))
            ->whereHas('periode', fn($q) =>
                $q->where('residence_id', $depense->residence_id)
                  ->where('is_active', true))
            ->first();

        if ($budget) {
            App::make(BudgetService::class)->recalculerConsomme($budget->id);
        }
    }
}