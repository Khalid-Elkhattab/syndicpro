<?php

namespace App\Services;

use App\Models\Lot;
use App\Models\Residence;

class TantiemeControlService
{
    /** @return array{expected: ?float, actual: float, ok: bool} */
    public static function check(Residence $residence): array
    {
        $expected = $residence->total_tantiemes !== null ? (float) $residence->total_tantiemes : null;
        $actual = (float) Lot::byResidence($residence->id)->sum('tantieme');

        return [
            'expected' => $expected,
            'actual' => $actual,
            'ok' => $expected === null || abs($expected - $actual) < 0.0001,
        ];
    }
}
