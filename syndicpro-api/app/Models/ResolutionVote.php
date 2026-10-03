<?php

namespace App\Models;

use App\Enums\VoteChoice;
use Illuminate\Database\Eloquent\Model;

class ResolutionVote extends Model
{
    public $timestamps = true;

    protected $fillable = ['resolution_id', 'lot_id', 'choice', 'weight'];

    protected function casts(): array
    {
        return ['choice' => VoteChoice::class, 'weight' => 'decimal:4'];
    }
}
