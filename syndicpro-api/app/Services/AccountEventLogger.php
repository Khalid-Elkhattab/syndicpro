<?php

namespace App\Services;

use App\Enums\AccountEventType;
use App\Enums\ActorType;
use App\Models\AccountEvent;

class AccountEventLogger
{
    public static function log(
        int $userId,
        AccountEventType $event,
        ?int $actorUserId = null,
        ?int $ownerId = null,
        array $meta = []
    ): AccountEvent {
        return AccountEvent::create([
            'user_id' => $userId,
            'owner_id' => $ownerId,
            'event' => $event->value,
            'actor_type' => $actorUserId ? ActorType::Staff->value : ActorType::System->value,
            'actor_user_id' => $actorUserId,
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'meta' => $meta ?: null,
        ]);
    }
}
