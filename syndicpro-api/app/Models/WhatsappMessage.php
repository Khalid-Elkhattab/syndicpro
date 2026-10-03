<?php

namespace App\Models;

use App\Enums\DeliveryStatus;
use App\Enums\MessageDirection;
use Illuminate\Database\Eloquent\Model;

class WhatsappMessage extends Model
{
    protected $table = 'whatsapp_messages';

    protected $fillable = [
        'conversation_id', 'direction', 'wa_message_id', 'body',
        'payload', 'status', 'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'direction' => MessageDirection::class,
            'payload' => 'array',
            'status' => DeliveryStatus::class,
            'sent_at' => 'datetime',
        ];
    }
}
