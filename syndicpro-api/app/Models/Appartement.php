<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appartement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'numero',
        'etage',
        'immeuble_id',
        'residence_id',
        'coproprietaire_id',
        'tantieme',
    ];

    protected function casts(): array
    {
        return [
            'tantieme' => 'decimal:4',
            'deleted_at' => 'datetime',
        ];
    }

    public function immeuble(): BelongsTo
    {
        return $this->belongsTo(Immeuble::class);
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function coproprietaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coproprietaire_id');
    }

    public function cotisationDetails(): HasMany
    {
        return $this->hasMany(CotisationDetail::class);
    }

    public function reclamations(): HasMany
    {
        return $this->hasMany(Reclamation::class);
    }

    public function scopeActif($query)
    {
        return $query->whereNull('deleted_at');
    }

    public function scopeByResidence($query, int $residenceId)
    {
        return $query->where('residence_id', $residenceId);
    }
}