<?php

namespace App\Models;

use App\Enums\ApprovalAction;
use App\Enums\ApprovalStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ApprovalRequest extends Model
{
    protected $fillable = [
        'residence_id', 'action', 'subject_type', 'subject_id', 'payload',
        'status', 'requested_by', 'requested_via_api_key_id', 'reason',
        'reviewed_by', 'reviewed_at', 'review_note', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'action' => ApprovalAction::class,
            'status' => ApprovalStatus::class,
            'payload' => 'array',
            'reviewed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
}
