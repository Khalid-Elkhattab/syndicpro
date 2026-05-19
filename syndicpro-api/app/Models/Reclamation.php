<?php

namespace App\Models;

use App\Enums\ReclamationStatut;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reclamation extends Model
{
    use HasFactory;

    protected $fillable = [
        'coproprietaire_id',
        'residence_id',
        'appartement_id',
        'titre',
        'description',
        'statut',
        'priorite',
        'reponse_syndic',
        'date_reponse',
    ];

    protected function casts(): array
    {
        return [
            'statut' => ReclamationStatut::class,
            'priorite' => 'string',
            'date_reponse' => 'datetime',
        ];
    }

    public function coproprietaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coproprietaire_id');
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function appartement(): BelongsTo
    {
        return $this->belongsTo(Appartement::class);
    }
}