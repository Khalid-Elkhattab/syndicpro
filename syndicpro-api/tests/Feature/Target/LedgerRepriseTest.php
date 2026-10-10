<?php

use App\Models\Due;
use App\Models\Owner;
use App\Services\OwnerSituationService;

function repriseCsv(array $lines): string
{
    $path = tempnam(sys_get_temp_dir(), 'reprise').'.csv';
    $h = fopen($path, 'w');
    fputcsv($h, ['lot_number', 'building_number', 'owner_id', 'amount', 'label']);
    foreach ($lines as $l) {
        fputcsv($h, $l);
    }
    fclose($h);

    return $path;
}

function repriseSetup(): array
{
    $residence = targetResidence();
    $lot = targetLot($residence, ['number' => 'A12']);
    $owner = Owner::factory()->create();
    ownLot($lot, $owner);

    return [$residence, $lot, $owner];
}

it('previews without writing', function () {
    [$residence, $lot, $owner] = repriseSetup();
    $csv = repriseCsv([['A12', $lot->building->number, $owner->id, '850.50', 'Soldes 2023']]);

    $this->artisan('ledger:reprise', [
        'residence' => $residence->id, 'csv' => $csv, '--as-of' => '2024-01-01',
    ])->assertSuccessful();

    expect(Due::count())->toBe(0);
});

it('commits one due per line attributed to the owner', function () {
    [$residence, $lot, $owner] = repriseSetup();
    $csv = repriseCsv([['A12', $lot->building->number, $owner->id, '850.50', 'Soldes 2023']]);

    $this->artisan('ledger:reprise', [
        'residence' => $residence->id, 'csv' => $csv,
        '--as-of' => '2024-01-01', '--commit' => true,
    ])->assertSuccessful();

    $due = Due::where('lot_id', $lot->id)->first();
    expect($due)->not->toBeNull();
    expect((float) $due->amount)->toBe(850.50);
    expect($due->owner_id)->toBe($owner->id);
    expect($due->period_start->toDateString())->toBe('2024-01-01');

    $s = OwnerSituationService::forOwner($owner->id);
    expect($s['total_due'])->toBe(850.50);
});

it('refuses invalid rows and duplicate reprise', function () {
    [$residence, $lot, $owner] = repriseSetup();
    $bad = repriseCsv([['ZZZ', $lot->building->number, $owner->id, '100', 'x']]);

    $this->artisan('ledger:reprise', [
        'residence' => $residence->id, 'csv' => $bad, '--commit' => true,
    ])->assertFailed();
    expect(Due::count())->toBe(0);

    $good = repriseCsv([['A12', $lot->building->number, $owner->id, '100', 'x']]);
    $this->artisan('ledger:reprise', [
        'residence' => $residence->id, 'csv' => $good,
        '--as-of' => '2024-01-01', '--commit' => true,
    ])->assertSuccessful();
    // Même date : doublon refusé.
    $this->artisan('ledger:reprise', [
        'residence' => $residence->id, 'csv' => $good,
        '--as-of' => '2024-01-01', '--commit' => true,
    ])->assertFailed();
    expect(Due::where('lot_id', $lot->id)->count())->toBe(1);
});
