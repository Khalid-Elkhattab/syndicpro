<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiKey extends Model
{
    protected $fillable = [
        'name', 'prefix', 'key_hash', 'abilities', 'residence_ids',
        'requires_approval_for_writes', 'last_used_at', 'expires_at',
        'revoked_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'abilities' => 'array',
            'residence_ids' => 'array',
            'requires_approval_for_writes' => 'boolean',
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function can(string $ability): bool
    {
        return in_array($ability, $this->abilities ?? [], true);
    }
}
