<?php

namespace App\Models;

use App\Enums\QuitusPurpose;
use App\Enums\QuitusStatus;
use Illuminate\Database\Eloquent\Model;

class QuitusCertificate extends Model
{
    protected $fillable = [
        'residence_id', 'owner_id', 'lot_id', 'fiscal_year_id', 'purpose',
        'status', 'number', 'balance_at_issue', 'issued_on', 'valid_until',
        'issued_by', 'document_id', 'cancel_reason',
    ];

    protected function casts(): array
    {
        return [
            'purpose' => QuitusPurpose::class,
            'status' => QuitusStatus::class,
            'balance_at_issue' => 'decimal:2',
            'issued_on' => 'date',
            'valid_until' => 'date',
        ];
    }

    public function isUsable(): bool
    {
        return $this->status === QuitusStatus::Valid
            && (! $this->valid_until || ! $this->valid_until->isPast());
    }
}
