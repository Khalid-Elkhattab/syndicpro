<?php

namespace App\Models;

use App\Enums\AssemblyStatus;
use App\Enums\AssemblyType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Assembly extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'residence_id', 'fiscal_year_id', 'type', 'status', 'title',
        'scheduled_at', 'location', 'agenda', 'convened_at', 'quorum_tantiemes',
        'present_tantiemes', 'minutes_notes', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => AssemblyType::class,
            'status' => AssemblyStatus::class,
            'scheduled_at' => 'datetime',
            'convened_at' => 'datetime',
            'quorum_tantiemes' => 'decimal:4',
            'present_tantiemes' => 'decimal:4',
        ];
    }

    public function resolutions(): HasMany
    {
        return $this->hasMany(AssemblyResolution::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(AssemblyAttendance::class);
    }
}
