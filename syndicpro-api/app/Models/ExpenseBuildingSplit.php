<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseBuildingSplit extends Model
{
    public $timestamps = false;

    protected $fillable = ['expense_id', 'building_id', 'amount'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2'];
    }
}
