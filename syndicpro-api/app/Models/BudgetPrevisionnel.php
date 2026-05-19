<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetPrevisionnel extends Model
{
    use HasFactory;

    protected $fillable = [
        'periode_id',
        'compte_charge_id',
        'montant_prevu',
        'montant_consomme',
    ];

    protected function casts(): array
    {
        return [
            'montant_prevu' => 'decimal:2',
            'montant_consomme' => 'decimal:2',
        ];
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }

    public function compteCharge(): BelongsTo
    {
        return $this->belongsTo(CompteCharge::class);
    }

    public function getMontantRestantAttribute(): float
    {
        return (float) $this->montant_prevu - (float) $this->montant_consomme;
    }

    public function getPourcentageConsommeAttribute(): float
    {
        if ($this->montant_prevu == 0) {
            return 0;
        }
        return ((float) $this->montant_consomme / (float) $this->montant_prevu) * 100;
    }

    public function getEstDepasseAttribute(): bool
    {
        return (float) $this->montant_consomme > (float) $this->montant_prevu;
    }
}