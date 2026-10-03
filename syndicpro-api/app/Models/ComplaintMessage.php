<?php

namespace App\Models;

use App\Enums\AuthorType;
use Illuminate\Database\Eloquent\Model;

class ComplaintMessage extends Model
{
    public $timestamps = true;

    protected $fillable = [
        'complaint_id', 'author_type', 'user_id', 'owner_id', 'body', 'is_internal',
    ];

    protected function casts(): array
    {
        return ['author_type' => AuthorType::class, 'is_internal' => 'boolean'];
    }
}
