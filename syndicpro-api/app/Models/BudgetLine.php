<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BudgetLine extends Model
{
    protected $fillable = [
        'budget_id', 'account_id', 'sub_account_id', 'label',
        'quantity', 'unit_price', 'monthly_amount', 'annual_amount',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'monthly_amount' => 'decimal:2',
            'annual_amount' => 'decimal:2',
        ];
    }
}
