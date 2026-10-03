<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContributionFixedRate extends Model
{
    protected $fillable = [
        'contribution_id', 'lot_type', 'min_surface', 'max_surface', 'monthly_amount',
    ];

    protected function casts(): array
    {
        return [
            'min_surface' => 'decimal:2',
            'max_surface' => 'decimal:2',
            'monthly_amount' => 'decimal:2',
        ];
    }

    public function contribution(): BelongsTo
    {
        return $this->belongsTo(Contribution::class);
    }
}
