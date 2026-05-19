<?php

namespace App\Models;

use App\Enums\ModePaiement;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Paiement extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'cotisation_detail_id',
        'coproprietaire_id',
        'date_paiement',
        'montant',
        'mode_paiement',
        'reference',
        'recu_path',
    ];

    protected function casts(): array
    {
        return [
            'mode_paiement' => ModePaiement::class,
            'date_paiement' => 'date',
            'montant' => 'decimal:2',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('recus')
            ->useDisk('local');
    }

    public function cotisationDetail(): BelongsTo
    {
        return $this->belongsTo(CotisationDetail::class);
    }

    public function coproprietaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coproprietaire_id');
    }
}