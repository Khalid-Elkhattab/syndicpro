<?php

namespace App\Models;

use App\Enums\OwnerType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Owner extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'type', 'first_name', 'last_name', 'company_name',
        'identity_number', 'preferred_locale', 'internal_notes',
        'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return ['type' => OwnerType::class];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logAll()->logOnlyDirty()->dontSubmitEmptyLogs();
    }

    public function getDisplayNameAttribute(): string
    {
        if ($this->type === OwnerType::Company) {
            return (string) $this->company_name;
        }

        return trim(($this->first_name ?? '').' '.($this->last_name ?? ''));
    }

    /** CIN/RC normalisé : majuscules, sans espaces. */
    public function setIdentityNumberAttribute(?string $value): void
    {
        $this->attributes['identity_number'] = $value === null || trim($value) === ''
            ? null
            : mb_strtoupper(preg_replace('/\s+/', '', trim($value)));
    }

    public function phones(): HasMany
    {
        return $this->hasMany(OwnerPhone::class);
    }

    public function emails(): HasMany
    {
        return $this->hasMany(OwnerEmail::class);
    }

    public function ownerships(): HasMany
    {
        return $this->hasMany(LotOwnership::class);
    }

    public function currentOwnerships(): HasMany
    {
        return $this->hasMany(LotOwnership::class)->whereNull('ended_on');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
