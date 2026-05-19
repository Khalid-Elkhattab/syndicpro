<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SousCharge extends Model
{
    use HasFactory;

    protected $fillable = [
        'compte_charge_id',
        'residence_id',
        'nom',
        'description',
    ];

    public function compteCharge(): BelongsTo
    {
        return $this->belongsTo(CompteCharge::class);
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function depenses(): HasMany
    {
        return $this->hasMany(Depense::class);
    }
}