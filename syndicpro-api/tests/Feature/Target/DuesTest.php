<?php

use App\Models\Contribution;
use App\Models\Due;
use App\Models\FiscalYear;
use App\Models\Owner;
use App\Services\DueGenerator;
use App\Services\TantiemeControlService;
use Carbon\Carbon;

it('splits annual amounts with exact rounding (largest remainder)', function () {
    foreach ([3600.0, 10000.0, 100.0, 999.99, 1.0] as $annual) {
        $parts = DueGenerator::splitAnnual($annual, Carbon::parse('2026-01-01'));
        expect($parts)->toHaveCount(12);
        expect(round(array_sum(array_column($parts, 'amount')), 2))->toBe(round($annual, 2));
    }
});

it('publishes tantieme contribution with snapshots and monthly dues', function () {
    $residence = targetResidence();
    $lot = targetLot($residence, ['tantieme' => 100]);
    $owner = Owner::factory()->create();
    ownLot($lot, $owner);
    $fy = FiscalYear::create([
        'residence_id' => $residence->id, 'name' => '2026',
        'starts_on' => '2026-01-01', 'ends_on' => '2026-12-31', 'status' => 'open',
    ]);

    $contribution = Contribution::create([
        'residence_id' => $residence->id, 'fiscal_year_id' => $fy->id,
        'type' => 'syndic', 'name' => 'Cotisation 2026',
        'starts_on' => '2026-01-01', 'ends_on' => '2026-12-31',
        'calculation_mode' => 'tantieme', 'annual_budget' => 1200,
        'status' => 'draft',
    ]);

    app(DueGenerator::class)->publish($contribution);

    expect(Due::where('lot_id', $lot->id)->count())->toBe(12);
    expect(round((float) Due::where('lot_id', $lot->id)->sum('amount'), 2))->toBe(1200.0);
    expect(Due::where('lot_id', $lot->id)->first()->owner_id)->toBe($owner->id);

    // Un changement de tantième ultérieur ne réécrit pas les appels publiés.
    $lot->update(['tantieme' => 999]);
    expect((float) $contribution->contributionLots()->first()->tantieme_snapshot)->toBe(100.0);
});

it('blocks publish on tantieme mismatch', function () {
    $residence = targetResidence(['total_tantiemes' => 500]);
    $lot = targetLot($residence, ['tantieme' => 100]);
    $fy = FiscalYear::create([
        'residence_id' => $residence->id, 'name' => '2026',
        'starts_on' => '2026-01-01', 'ends_on' => '2026-12-31', 'status' => 'open',
    ]);
    $contribution = Contribution::create([
        'residence_id' => $residence->id, 'fiscal_year_id' => $fy->id,
        'type' => 'syndic', 'name' => 'X', 'starts_on' => '2026-01-01', 'ends_on' => '2026-12-31',
        'calculation_mode' => 'tantieme', 'annual_budget' => 1200, 'status' => 'draft',
    ]);

    expect(fn () => app(DueGenerator::class)->publish($contribution))->toThrow(LogicException::class);
    expect(TantiemeControlService::check($residence->fresh())['ok'])->toBeFalse();
});

it('blocks fixed-mode publish when a lot matches no rate', function () {
    $residence = targetResidence();
    targetLot($residence, ['type' => 'shop', 'surface' => 500]);
    $contribution = Contribution::create([
        'residence_id' => $residence->id, 'type' => 'syndic', 'name' => 'Fixe',
        'starts_on' => '2026-01-01', 'ends_on' => '2026-12-31',
        'calculation_mode' => 'fixed', 'status' => 'draft',
    ]);
    $contribution->fixedRates()->create([
        'lot_type' => 'apartment', 'min_surface' => 0, 'max_surface' => 100, 'monthly_amount' => 100,
    ]);

    expect(fn () => app(DueGenerator::class)->publish($contribution))->toThrow(LogicException::class);
});
