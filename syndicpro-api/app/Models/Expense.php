<?php

namespace App\Models;

use App\Enums\BudgetKind;
use App\Enums\BudgetType;
use App\Enums\ExpenseKind;
use App\Enums\ExpenseStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Expense extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, LogsActivity, SoftDeletes;

    protected $fillable = [
        'residence_id', 'budget_id', 'account_id', 'sub_account_id', 'supplier_id',
        'bank_account_id', 'bank_id', 'spent_on', 'kind', 'budget_type', 'budget_kind',
        'description', 'amount', 'payment_method', 'document_number', 'invoice_number',
        'status', 'notes', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'spent_on' => 'date',
            'kind' => ExpenseKind::class,
            'budget_type' => BudgetType::class,
            'budget_kind' => BudgetKind::class,
            'amount' => 'decimal:2',
            'status' => ExpenseStatus::class,
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logAll()->logOnlyDirty()->dontSubmitEmptyLogs();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('invoice');
    }

    public function splits(): HasMany
    {
        return $this->hasMany(ExpenseBuildingSplit::class);
    }
}
