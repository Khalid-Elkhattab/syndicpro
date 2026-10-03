<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LotAnnex extends Model
{
    use HasFactory;

    protected $fillable = ['lot_id', 'type', 'number'];

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }
}
