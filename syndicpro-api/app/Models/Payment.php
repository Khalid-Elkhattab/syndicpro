<?php

namespace App\Models;

use App\Enums\AllocationMode;
use App\Enums\PaymentMethod;
use App\Enums\PaymentSource;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/** Paiement cible. Jamais supprimé : annulation (statut + motif + recompute des dus). */
class Payment extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, LogsActivity;

    protected $fillable = [
        'residence_id', 'owner_id', 'lot_id', 'bank_account_id', 'bank_id',
        'paid_on', 'method', 'document_number', 'amount', 'allocation_mode',
        'status', 'source', 'receipt_number', 'verification_token', 'receipt_sent_at',
        'validated_by', 'validated_at', 'rejection_reason', 'cancelled_by',
        'cancelled_at', 'cancellation_reason', 'notes', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'paid_on' => 'date',
            'method' => PaymentMethod::class,
            'amount' => 'decimal:2',
            'allocation_mode' => AllocationMode::class,
            'status' => PaymentStatus::class,
            'source' => PaymentSource::class,
            'receipt_sent_at' => 'datetime',
            'validated_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logAll()->logOnlyDirty()->dontSubmitEmptyLogs();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('proof');
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
