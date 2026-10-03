<?php

namespace App\Models;

use App\Enums\LawyerCaseStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LawyerCase extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'residence_id', 'owner_id', 'lot_id', 'transfer_id', 'case_kind', 'motif',
        'amount_claimed', 'status', 'formal_notice_action_id', 'exported_at',
        'notes', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'amount_claimed' => 'decimal:2',
            'status' => LawyerCaseStatus::class,
            'exported_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }
}
