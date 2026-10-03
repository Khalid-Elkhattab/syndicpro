<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteReference extends Model
{
    protected $fillable = ['name', 'description', 'city', 'position', 'is_published'];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'is_published' => 'boolean',
        ];
    }
}
