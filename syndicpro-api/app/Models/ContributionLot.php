<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContributionLot extends Model
{
    protected $fillable = [
        'contribution_id', 'residence_id', 'lot_id',
        'tantieme_snapshot', 'surface_snapshot', 'annual_amount', 'monthly_amount',
    ];

    protected function casts(): array
    {
        return [
            'tantieme_snapshot' => 'decimal:4',
            'surface_snapshot' => 'decimal:2',
            'annual_amount' => 'decimal:2',
            'monthly_amount' => 'decimal:2',
        ];
    }

    public function contribution(): BelongsTo
    {
        return $this->belongsTo(Contribution::class);
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function dues(): HasMany
    {
        return $this->hasMany(Due::class);
    }
}
