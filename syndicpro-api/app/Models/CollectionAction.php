<?php

namespace App\Models;

use App\Enums\CollectionActionType;
use App\Enums\DeliveryStatus;
use App\Enums\NotificationChannel;
use Illuminate\Database\Eloquent\Model;

class CollectionAction extends Model
{
    protected $fillable = [
        'residence_id', 'owner_id', 'lot_id', 'type', 'channel', 'status',
        'amount_due', 'oldest_due_date', 'document_id', 'sent_by', 'sent_at',
        'provider_message_id', 'error',
    ];

    protected function casts(): array
    {
        return [
            'type' => CollectionActionType::class,
            'channel' => NotificationChannel::class,
            'status' => DeliveryStatus::class,
            'amount_due' => 'decimal:2',
            'oldest_due_date' => 'date',
            'sent_at' => 'datetime',
        ];
    }
}
