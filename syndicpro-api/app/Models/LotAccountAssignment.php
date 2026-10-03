<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LotAccountAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'lot_id', 'owner_id', 'lot_ownership_id',
        'started_at', 'ended_at', 'end_reason', 'initialised_by', 'notes',
    ];

    protected function casts(): array
    {
        return ['started_at' => 'datetime', 'ended_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    public function scopeCurrent($query)
    {
        return $query->whereNull('ended_at');
    }
}
