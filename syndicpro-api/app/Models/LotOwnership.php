<?php

namespace App\Models;

use App\Enums\OwnershipChangeReason;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LotOwnership extends Model
{
    use HasFactory;

    protected $fillable = [
        'lot_id', 'owner_id', 'share_percent', 'is_billing_contact',
        'started_on', 'ended_on', 'change_reason', 'notes',
        'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'share_percent' => 'decimal:2',
            'is_billing_contact' => 'boolean',
            'started_on' => 'date',
            'ended_on' => 'date',
            'change_reason' => OwnershipChangeReason::class,
        ];
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    public function scopeCurrent($query)
    {
        return $query->whereNull('ended_on');
    }
}
