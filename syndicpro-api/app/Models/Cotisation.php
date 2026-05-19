<?php

namespace App\Models;

use App\Enums\CotisationType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cotisation extends Model
{
    use HasFactory;

    protected $fillable = [
        'residence_id',
        'periode_id',
        'type',
        'label',
        'montant_total',
        'montant_mensuel',
        'mode_repartition',
        'mois',
        'annee',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'type' => CotisationType::class,
            'montant_total' => 'decimal:2',
            'montant_mensuel' => 'decimal:2',
        ];
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }

    public function cotisationDetails(): HasMany
    {
        return $this->hasMany(CotisationDetail::class);
    }
}