<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Immeuble extends Model
{
    use HasFactory;

    protected $fillable = [
        'residence_id',
        'nom',
    ];

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function appartements(): HasMany
    {
        return $this->hasMany(Appartement::class);
    }
}