<?php

namespace App\Models;

use App\Enums\MajorityRule;
use App\Enums\ResolutionResult;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssemblyResolution extends Model
{
    public $timestamps = true;

    protected $fillable = [
        'assembly_id', 'position', 'title', 'description', 'majority_rule',
        'result', 'votes_for', 'votes_against', 'votes_abstain',
    ];

    protected function casts(): array
    {
        return [
            'majority_rule' => MajorityRule::class,
            'result' => ResolutionResult::class,
            'votes_for' => 'decimal:4',
            'votes_against' => 'decimal:4',
            'votes_abstain' => 'decimal:4',
        ];
    }

    public function votes(): HasMany
    {
        return $this->hasMany(ResolutionVote::class, 'resolution_id');
    }
}
