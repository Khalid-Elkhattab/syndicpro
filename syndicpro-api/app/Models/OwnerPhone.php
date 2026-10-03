<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OwnerPhone extends Model
{
    use HasFactory;

    protected $fillable = ['owner_id', 'number', 'is_whatsapp', 'is_primary'];

    protected function casts(): array
    {
        return ['is_whatsapp' => 'boolean', 'is_primary' => 'boolean'];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }
}
