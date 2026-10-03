<?php

namespace App\Models;

use App\Enums\AccountMatchResult;
use App\Enums\AccountRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class AccountRequest extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'reference', 'residence_id', 'building_input', 'lot_input', 'lot_id',
        'matched_owner_id', 'match_result', 'full_name', 'identity_number',
        'phone', 'email', 'locale', 'message', 'phone_verified_at', 'status',
        'review_note', 'rejection_reason', 'contact_confirmed', 'documents_checked',
        'reviewed_by', 'reviewed_at', 'approved_user_id', 'activation_channel',
        'activation_sent_at', 'ip', 'user_agent', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'match_result' => AccountMatchResult::class,
            'status' => AccountRequestStatus::class,
            'contact_confirmed' => 'boolean',
            'documents_checked' => 'boolean',
            'phone_verified_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'activation_sent_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function setIdentityNumberAttribute(?string $value): void
    {
        $this->attributes['identity_number'] = $value === null ? null
            : mb_strtoupper(preg_replace('/\s+/', '', trim($value)));
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('proof');
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function matchedOwner(): BelongsTo
    {
        return $this->belongsTo(Owner::class, 'matched_owner_id');
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['submitted', 'needs_info']);
    }
}
