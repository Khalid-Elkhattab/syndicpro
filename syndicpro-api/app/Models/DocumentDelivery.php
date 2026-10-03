<?php

namespace App\Models;

use App\Enums\DeliveryStatus;
use App\Enums\NotificationChannel;
use Illuminate\Database\Eloquent\Model;

class DocumentDelivery extends Model
{
    protected $fillable = [
        'document_id', 'owner_id', 'lot_id', 'channel', 'status',
        'sent_by', 'sent_at', 'opened_at', 'provider_message_id', 'error',
    ];

    protected function casts(): array
    {
        return [
            'channel' => NotificationChannel::class,
            'status' => DeliveryStatus::class,
            'sent_at' => 'datetime',
            'opened_at' => 'datetime',
        ];
    }
}
