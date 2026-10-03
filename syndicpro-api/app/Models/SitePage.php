<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SitePage extends Model
{
    protected $fillable = ['slug', 'title', 'content', 'seo', 'is_published', 'position'];

    protected function casts(): array
    {
        return [
            'title' => 'array',
            'content' => 'array',
            'seo' => 'array',
            'is_published' => 'boolean',
        ];
    }
}
