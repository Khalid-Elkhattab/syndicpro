<?php

namespace App\Services;

use App\Enums\QuitusStatus;
use App\Models\Due;
use App\Models\QuitusCertificate;
use App\Models\Residence;
use Illuminate\Support\Facades\DB;

/**
 * Spec §6 règles 9, 21 : quitus émis seulement si le reste exigible du lot = 0 ;
 * validité 30 j par défaut (residences.quitus_validity_days) ; consommé par le transfert.
 */
class QuitusService
{
    /** Reste exigible du lot : dus échus non soldés (dus.owner/lot, allocations validées). */
    public static function overdueBalance(int $lotId): float
    {
        $dues = Due::where('lot_id', $lotId)
            ->where('status', '!=', 'cancelled')
            ->where('due_date', '<=', today())
            ->get();

        $balance = 0.0;
        foreach ($dues as $due) {
            $balance += (float) $due->amount - (float) $due->amount_paid;
        }

        return round(max($balance, 0), 2);
    }

    public function issue(int $residenceId, int $ownerId, ?int $lotId, string $purpose, ?int $issuedBy = null): QuitusCertificate
    {
        return DB::transaction(function () use ($residenceId, $ownerId, $lotId, $purpose, $issuedBy) {
            if ($lotId && self::overdueBalance($lotId) > 0) {
                throw new \LogicException('Quitus refusé : solde exigible non nul sur le lot.');
            }

            $validityDays = (int) (Residence::find($residenceId)->quitus_validity_days
                ?? SettingService::get('quitus_validity_days'));

            return QuitusCertificate::create([
                'residence_id' => $residenceId,
                'owner_id' => $ownerId,
                'lot_id' => $lotId,
                'purpose' => $purpose,
                'status' => QuitusStatus::Valid->value,
                'number' => NumberSequenceService::next($residenceId, 'quitus', (int) date('Y'), 'QUIT'),
                'balance_at_issue' => $lotId ? 0 : 0,
                'issued_on' => today(),
                'valid_until' => $purpose === 'sale' ? today()->addDays($validityDays) : null,
                'issued_by' => $issuedBy,
            ]);
        });
    }

    public function consume(QuitusCertificate $quitus): void
    {
        $quitus->update(['status' => QuitusStatus::Used->value]);
    }

    public static function expireOverdue(): int
    {
        return QuitusCertificate::where('status', QuitusStatus::Valid->value)
            ->whereNotNull('valid_until')
            ->where('valid_until', '<', today())
            ->update(['status' => QuitusStatus::Expired->value]);
    }
}
