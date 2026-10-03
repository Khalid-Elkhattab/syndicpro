<?php

namespace App\Models;

use App\Enums\TreasuryStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TreasuryStatement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'residence_id', 'bank_account_id', 'period_start', 'period_end',
        'opening_balance', 'total_contributions', 'total_expenses',
        'computed_closing_balance', 'bank_closing_balance', 'difference',
        'status', 'notes', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'opening_balance' => 'decimal:2',
            'total_contributions' => 'decimal:2',
            'total_expenses' => 'decimal:2',
            'computed_closing_balance' => 'decimal:2',
            'bank_closing_balance' => 'decimal:2',
            'difference' => 'decimal:2',
            'status' => TreasuryStatus::class,
        ];
    }
}
