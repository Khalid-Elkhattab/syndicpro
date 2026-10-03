<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Building extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['residence_id', 'number', 'label', 'floors'];

    protected function casts(): array
    {
        return ['floors' => 'integer'];
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function lots(): HasMany
    {
        return $this->hasMany(Lot::class, 'building_id');
    }

    /** Nom FR affiché : "Bâtiment A". */
    public function getDisplayNameAttribute(): string
    {
        return $this->label ?: ('Bâtiment '.$this->number);
    }
}
