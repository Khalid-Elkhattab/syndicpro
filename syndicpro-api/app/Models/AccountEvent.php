<?php

namespace App\Models;

use App\Enums\AccountEventType;
use App\Enums\ActorType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * APPEND-ONLY : toute tentative de update/delete lève une exception.
 * Spec §4.3b + §6 (trois couches d’historique).
 */
class AccountEvent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'owner_id', 'event', 'actor_type',
        'actor_user_id', 'ip', 'user_agent', 'meta', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'event' => AccountEventType::class,
            'actor_type' => ActorType::class,
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function update(array $attributes = [], array $options = []): bool
    {
        throw new \LogicException('account_events est append-only : mise à jour interdite.');
    }

    public function delete(): ?bool
    {
        throw new \LogicException('account_events est append-only : suppression interdite.');
    }

    public static function log(int $userId, AccountEventType $event, ActorType $actor, array $extra = []): self
    {
        return static::create(array_merge([
            'user_id' => $userId,
            'event' => $event->value,
            'actor_type' => $actor->value,
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ], $extra));
    }
}
