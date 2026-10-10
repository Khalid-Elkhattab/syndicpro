<?php

namespace App\Models;

use App\Enums\CalculationMode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FiscalYear extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'residence_id', 'name', 'starts_on', 'ends_on', 'status',
        'calculation_mode', 'calculation_mode_decided_at', 'assembly_id',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'calculation_mode' => CalculationMode::class,
            'calculation_mode_decided_at' => 'datetime',
        ];
    }

    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    /** AG dont le PV acte le mode de calcul de l'exercice. */
    public function decidingAssembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class, 'assembly_id');
    }
}
