<?php

namespace App\Models;

use App\Enums\OwnershipChangeReason;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/** Trace complète d’un changement de propriétaire. Jamais modifié ni supprimé. */
class LotTransfer extends Model
{
    public $timestamps = true;

    protected $fillable = [
        'residence_id', 'lot_id', 'from_owner_id', 'to_owner_id', 'effective_on',
        'reason', 'quitus_id', 'balance_at_transfer', 'quitus_overridden',
        'override_reason', 'account_request_id', 'closed_ownership_id',
        'opened_ownership_id', 'performed_by', 'contract_document_id',
        'contract_reference', 'contract_signed_on', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'effective_on' => 'date',
            'reason' => OwnershipChangeReason::class,
            'balance_at_transfer' => 'decimal:2',
            'quitus_overridden' => 'boolean',
            'contract_signed_on' => 'date',
        ];
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function fromOwner(): BelongsTo
    {
        return $this->belongsTo(Owner::class, 'from_owner_id');
    }

    public function toOwner(): BelongsTo
    {
        return $this->belongsTo(Owner::class, 'to_owner_id');
    }

    public function lawyerCase(): HasOne
    {
        return $this->hasOne(LawyerCase::class, 'transfer_id');
    }

    public function update(array $attributes = [], array $options = []): bool
    {
        throw new \LogicException('lot_transfers est append-only : mise à jour interdite.');
    }

    public function delete(): ?bool
    {
        throw new \LogicException('lot_transfers est append-only : suppression interdite.');
    }
}
