<?php

namespace App\Models;

use App\Enums\CotisationDetailStatut;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CotisationDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'cotisation_id',
        'appartement_id',
        'coproprietaire_id',
        'montant',
        'statut',
        'montant_paye',
    ];

    protected function casts(): array
    {
        return [
            'statut' => CotisationDetailStatut::class,
            'montant' => 'decimal:2',
            'montant_paye' => 'decimal:2',
        ];
    }

    public function cotisation(): BelongsTo
    {
        return $this->belongsTo(Cotisation::class);
    }

    public function appartement(): BelongsTo
    {
        return $this->belongsTo(Appartement::class);
    }

    public function coproprietaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coproprietaire_id');
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function getMontantRestantAttribute(): float
    {
        return (float) $this->montant - (float) $this->montant_paye;
    }
}