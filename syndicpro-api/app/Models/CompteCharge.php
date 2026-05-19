<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompteCharge extends Model
{
    use HasFactory;

    protected $fillable = [
        'residence_id',
        'nom',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function sousCharges(): HasMany
    {
        return $this->hasMany(SousCharge::class);
    }

    public function budgetPrevisionnels(): HasMany
    {
        return $this->hasMany(BudgetPrevisionnel::class);
    }
}