<?php

namespace App\Models;

use App\Enums\ComplaintPriority;
use App\Enums\ComplaintSource;
use App\Enums\ComplaintStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Complaint extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, LogsActivity, SoftDeletes;

    protected $fillable = [
        'reference', 'residence_id', 'building_id', 'lot_id', 'owner_id',
        'complaint_type_id', 'description', 'status', 'source', 'priority',
        'assigned_to', 'opened_at', 'resolved_at', 'resolution_minutes',
        'client_feedback', 'feedback_sent_at', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => ComplaintStatus::class,
            'source' => ComplaintSource::class,
            'priority' => ComplaintPriority::class,
            'opened_at' => 'datetime',
            'resolved_at' => 'datetime',
            'feedback_sent_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logAll()->logOnlyDirty()->dontSubmitEmptyLogs();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('photos');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ComplaintMessage::class);
    }
}
