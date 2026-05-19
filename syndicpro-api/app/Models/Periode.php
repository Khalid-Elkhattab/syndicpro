<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Periode extends Model
{
    use HasFactory;

    protected $fillable = [
        'residence_id',
        'annee',
        'is_active',
        'date_debut',
        'date_fin',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'date_debut' => 'date',
            'date_fin' => 'date',
        ];
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function budgetsPrevisionnels(): HasMany
    {
        return $this->hasMany(BudgetPrevisionnel::class);
    }

    public function cotisations(): HasMany
    {
        return $this->hasMany(Cotisation::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}