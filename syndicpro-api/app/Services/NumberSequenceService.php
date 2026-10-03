<?php

namespace App\Services;

use App\Models\NumberSequence;
use Illuminate\Support\Facades\DB;

/**
 * Numérotation sans trou (reçus, quitus...) : incrément en transaction + lockForUpdate.
 */
class NumberSequenceService
{
    public static function next(?int $residenceId, string $type, int $year, string $prefix): string
    {
        return DB::transaction(function () use ($residenceId, $type, $year, $prefix) {
            $seq = NumberSequence::where('residence_id', $residenceId)
                ->where('type', $type)
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if (! $seq) {
                $seq = NumberSequence::create([
                    'residence_id' => $residenceId,
                    'type' => $type,
                    'year' => $year,
                    'last_number' => 0,
                ]);
            }

            $seq->increment('last_number');

            return sprintf('%s-%d-%06d', $prefix, $year, $seq->last_number);
        });
    }
}
