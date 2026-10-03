<?php

namespace App\Models;

use App\Enums\DocumentSource;
use App\Enums\DocumentStatus;
use App\Enums\DocumentType;
use App\Enums\DocumentVisibility;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'residence_id', 'building_id', 'owner_id', 'lot_id', 'fiscal_year_id',
        'period_start', 'period_end', 'documentable_type', 'documentable_id',
        'type', 'source', 'status', 'version', 'supersedes_id', 'is_locked',
        'number', 'title', 'locale', 'visibility', 'disk', 'path', 'mime',
        'size', 'checksum', 'verification_token', 'template_id', 'meta',
        'created_by', 'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => DocumentType::class,
            'source' => DocumentSource::class,
            'status' => DocumentStatus::class,
            'is_locked' => 'boolean',
            'visibility' => DocumentVisibility::class,
            'period_start' => 'date',
            'period_end' => 'date',
            'meta' => 'array',
            'generated_at' => 'datetime',
        ];
    }

    public function documentable(): MorphTo
    {
        return $this->morphTo();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(DocumentDelivery::class);
    }
}
