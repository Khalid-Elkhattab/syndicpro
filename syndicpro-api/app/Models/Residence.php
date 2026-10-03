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
        'code',
        'nom',
        'syndicate_name',
        'ville',
        'adresse',
        'nb_immeubles',
        'calculation_mode',
        'arrears_on_sale',
        'quitus_validity_days',
        'total_tantiemes',
        'fiscal_start_month',
        'currency',
        'legal_info',
        'is_active',
        'promoter_owner_id',
    ];

    protected function casts(): array
    {
        return [
            'legal_info' => 'array',
            'total_tantiemes' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    public function syndic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'syndic_id');
    }

    public function promoter(): BelongsTo
    {
        return $this->belongsTo(Owner::class, 'promoter_owner_id');
    }

    public function buildings(): HasMany
    {
        return $this->hasMany(Building::class);
    }

    public function lots(): HasMany
    {
        return $this->hasMany(Lot::class);
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
