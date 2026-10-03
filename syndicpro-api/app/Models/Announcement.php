<?php

namespace App\Models;

use App\Enums\AnnouncementKind;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'residence_id', 'building_id', 'kind', 'document_id', 'title', 'body',
        'published_at', 'expires_at', 'notify_channels', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'kind' => AnnouncementKind::class,
            'title' => 'array',
            'body' => 'array',
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
            'notify_channels' => 'array',
        ];
    }
}
