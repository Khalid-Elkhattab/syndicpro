<?php

namespace App\Models;

use App\Enums\DueStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Mensualité par lot. `amount_paid`/`status` = cache recalculé par DueSettlementService.
 * « En retard » = dérivé (statut impayé/partiel + due_date < aujourd’hui), jamais stocké.
 */
class Due extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'residence_id', 'contribution_lot_id', 'lot_id', 'owner_id',
        'period_start', 'period_end', 'days', 'amount', 'amount_paid',
        'due_date', 'status',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'due_date' => 'date',
            'status' => DueStatus::class,
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logAll()->logOnlyDirty()->dontSubmitEmptyLogs();
    }

    public function getIsOverdueAttribute(): bool
    {
        return in_array($this->status, [DueStatus::Unpaid, DueStatus::Partial], true)
            && $this->due_date->isPast();
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }
}
