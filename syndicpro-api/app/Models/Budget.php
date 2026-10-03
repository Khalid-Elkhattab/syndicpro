<?php

namespace App\Models;

use App\Enums\BudgetKind;
use App\Enums\BudgetStatus;
use App\Enums\BudgetType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Budget extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'residence_id', 'fiscal_year_id', 'type', 'kind', 'name', 'status',
        'total_monthly', 'total_annual', 'approved_at', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => BudgetType::class,
            'kind' => BudgetKind::class,
            'status' => BudgetStatus::class,
            'total_monthly' => 'decimal:2',
            'total_annual' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(BudgetLine::class);
    }
}
