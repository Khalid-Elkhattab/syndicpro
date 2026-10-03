<?php

namespace App\Services;

use App\Enums\OwnershipChangeReason;
use App\Models\LotOwnership;
use Illuminate\Support\Facades\DB;

/**
 * Spec §6 : Σ share_percent des lignes courantes d’un lot = 100 (indivision).
 */
class OwnershipService
{
    /**
     * @param  array<int, array{owner_id: int, share_percent: float, is_billing_contact?: bool}>  $holders
     */
    public function assign(int $lotId, array $holders, string $startedOn, OwnershipChangeReason $reason): void
    {
        $total = round(array_sum(array_column($holders, 'share_percent')), 2);
        if (abs($total - 100) > 0.001) {
            throw new \LogicException("Parts d’indivision = {$total} % (attendu 100 %).");
        }

        DB::transaction(function () use ($lotId, $holders, $startedOn, $reason) {
            LotOwnership::where('lot_id', $lotId)->whereNull('ended_on')
                ->update(['ended_on' => date('Y-m-d', strtotime($startedOn.' -1 day'))]);

            foreach ($holders as $h) {
                LotOwnership::create([
                    'lot_id' => $lotId,
                    'owner_id' => $h['owner_id'],
                    'share_percent' => $h['share_percent'],
                    'is_billing_contact' => $h['is_billing_contact'] ?? false,
                    'started_on' => $startedOn,
                    'change_reason' => $reason->value,
                ]);
            }
        });
    }
}
