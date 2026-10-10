<?php

namespace App\Models;

use App\Enums\CalculationMode;
use App\Enums\ContributionStatus;
use App\Enums\ContributionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Contribution extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'residence_id', 'fiscal_year_id', 'type', 'name', 'starts_on', 'ends_on',
        'calculation_mode', 'annual_budget', 'coefficient', 'monthly_total',
        'annual_total', 'applies_to_all_buildings', 'status', 'published_at',
        'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => ContributionType::class,
            'calculation_mode' => CalculationMode::class,
            'status' => ContributionStatus::class,
            'starts_on' => 'date',
            'ends_on' => 'date',
            'annual_budget' => 'decimal:2',
            'coefficient' => 'decimal:8',
            'monthly_total' => 'decimal:2',
            'annual_total' => 'decimal:2',
            'applies_to_all_buildings' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logAll()->logOnlyDirty()->dontSubmitEmptyLogs();
    }

    public function contributionLots(): HasMany
    {
        return $this->hasMany(ContributionLot::class);
    }

    public function fixedRates(): HasMany
    {
        return $this->hasMany(ContributionFixedRate::class);
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function buildings(): BelongsToMany
    {
        return $this->belongsToMany(Building::class, 'contribution_buildings');
    }

    public function isDraft(): bool
    {
        $status = $this->status instanceof ContributionStatus
            ? $this->status
            : ContributionStatus::tryFrom((string) $this->status);

        return $status === ContributionStatus::Draft;
    }
}
