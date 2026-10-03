<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComplaintType extends Model
{
    protected $fillable = ['residence_id', 'name', 'target_hours', 'is_active'];

    protected function casts(): array
    {
        return ['name' => 'array', 'is_active' => 'boolean'];
    }
}
