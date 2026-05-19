<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Residence extends Model
{
    use HasFactory;

    protected $fillable = [
        'syndic_id',
        'nom',
        'ville',
        'adresse',
        'nb_immeubles',
    ];

    public function syndic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'syndic_id');
    }

    public function immeubles(): HasMany
    {
        return $this->hasMany(Immeuble::class);
    }

    public function appartements(): HasMany
    {
        return $this->hasMany(Appartement::class);
    }

    public function compteCharges(): HasMany
    {
        return $this->hasMany(CompteCharge::class);
    }

    public function periodes(): HasMany
    {
        return $this->hasMany(Periode::class);
    }

    public function cotisations(): HasMany
    {
        return $this->hasMany(Cotisation::class);
    }

    public function reclamations(): HasMany
    {
        return $this->hasMany(Reclamation::class);
    }

}