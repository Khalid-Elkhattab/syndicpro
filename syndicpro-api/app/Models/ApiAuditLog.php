<?php

namespace App\Models;

use App\Enums\ApiChannel;
use Illuminate\Database\Eloquent\Model;

class ApiAuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'api_key_id', 'channel', 'tool', 'request', 'response_status',
        'response_summary', 'ip', 'duration_ms', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'channel' => ApiChannel::class,
            'request' => 'array',
            'response_summary' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
