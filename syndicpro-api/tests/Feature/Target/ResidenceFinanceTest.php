<?php

use App\Models\Assembly;
use App\Models\Contribution;
use App\Models\Due;
use App\Models\FiscalYear;
use App\Models\Owner;
use App\Services\DueGenerator;

function financeFixture(): array
{
    $syndic = syndicWith();
    $residence = residenceFor($syndic);

    return [$syndic, $residence];
}

function financeYear($residence, array $attrs = []): FiscalYear
{
    return FiscalYear::create(array_merge([
        'residence_id' => $residence->id, 'name' => '2026',
        'starts_on' => '2026-01-01', 'ends_on' => '2026-12-31', 'status' => 'open',
    ], $attrs));
}

it('publishes per-surface brackets: <100 → 300, 100–200 → 400, >200 → 500', function () {
    $residence = targetResidence();
    $lotA = targetLot($residence, ['surface' => 50]);
    $lotB = targetLot($residence, ['surface' => 150]);
    $lotC = targetLot($residence, ['surface' => 250]);
    $owner = Owner::factory()->create();
    ownLot($lotA, $owner);
    ownLot($lotB, $owner);
    ownLot($lotC, $owner);
    $fy = financeYear($residence);

    $contribution = Contribution::create([
        'residence_id' => $residence->id, 'fiscal_year_id' => $fy->id,
        'type' => 'syndic', 'name' => 'Cotisation 2026',
        'starts_on' => '2026-01-01', 'ends_on' => '2026-12-31',
        'calculation_mode' => 'per_surface', 'status' => 'draft',
    ]);
    $contribution->fixedRates()->createMany([
        ['lot_type' => null, 'min_surface' => null, 'max_surface' => 99.99, 'monthly_amount' => 300],
        ['lot_type' => null, 'min_surface' => 100, 'max_surface' => 200, 'monthly_amount' => 400],
        ['lot_type' => null, 'min_surface' => 200.01, 'max_surface' => null, 'monthly_amount' => 500],
    ]);

    app(DueGenerator::class)->publish($contribution);

    expect(Due::where('lot_id', $lotA->id)->count())->toBe(12);
    expect(round((float) Due::where('lot_id', $lotA->id)->sum('amount'), 2))->toBe(3600.0);
    expect(round((float) Due::where('lot_id', $lotB->id)->sum('amount'), 2))->toBe(4800.0);
    expect(round((float) Due::where('lot_id', $lotC->id)->sum('amount'), 2))->toBe(6000.0);
});

it('blocks publish on bracket gaps and overlaps', function () {
    $residence = targetResidence();
    targetLot($residence, ['surface' => 150]);
    $contribution = Contribution::create([
        'residence_id' => $residence->id, 'type' => 'syndic', 'name' => 'X',
        'starts_on' => '2026-01-01', 'ends_on' => '2026-12-31',
        'calculation_mode' => 'per_surface', 'status' => 'draft',
    ]);

    // Trou : aucune tranche ne couvre 150 m².
    $contribution->fixedRates()->create([
        'lot_type' => null, 'min_surface' => null, 'max_surface' => 99.99, 'monthly_amount' => 300,
    ]);
    expect(fn () => app(DueGenerator::class)->publish($contribution))->toThrow(LogicException::class);

    // Chevauchement : deux tranches couvrent 150 m².
    $contribution->fixedRates()->create([
        'lot_type' => null, 'min_surface' => 100, 'max_surface' => 300, 'monthly_amount' => 400,
    ]);
    $contribution->fixedRates()->create([
        'lot_type' => null, 'min_surface' => 100, 'max_surface' => 300, 'monthly_amount' => 450,
    ]);
    expect(fn () => app(DueGenerator::class)->publish($contribution))->toThrow(LogicException::class);
});

it('exposes finance settings with modes, years and assemblies', function () {
    [$syndic, $residence] = financeFixture();
    financeYear($residence);
    Assembly::create([
        'residence_id' => $residence->id, 'title' => 'AG ordinaire 2026',
        'scheduled_at' => '2026-03-15 10:00:00', 'location' => 'Salle commune',
        'status' => 'held',
    ]);

    $response = $this->actingAs($syndic)->getJson("/api/syndic/residences/{$residence->id}/finance");

    $response->assertStatus(200);
    expect($response->json('data.modes'))->toHaveCount(3);
    expect($response->json('data.fiscal_years'))->toHaveCount(1);
    expect($response->json('data.assemblies'))->toHaveCount(1);
    expect($response->json('data.fiscal_years.0.calculation_mode'))->toBeNull();
});

it('records the yearly AG decision with PV link', function () {
    [$syndic, $residence] = financeFixture();
    $fy = financeYear($residence);
    $assembly = Assembly::create([
        'residence_id' => $residence->id, 'title' => 'AG ordinaire 2026',
        'scheduled_at' => '2026-03-15 10:00:00', 'location' => 'Salle commune',
        'status' => 'held',
    ]);

    $response = $this->actingAs($syndic)->putJson("/api/syndic/residences/{$residence->id}/finance", [
        'calculation_mode' => 'per_surface',
        'fiscal_year_id' => $fy->id,
        'year_calculation_mode' => 'per_surface',
        'assembly_id' => $assembly->id,
    ]);

    $response->assertStatus(200);
    expect($residence->fresh()->calculation_mode)->toBe('per_surface');

    $fy = $fy->fresh();
    expect($fy->calculation_mode->value)->toBe('per_surface');
    expect($fy->calculation_mode_decided_at)->not->toBeNull();
    expect((int) $fy->assembly_id)->toBe($assembly->id);
});

it('rejects foreign fiscal years, foreign assemblies and bad modes', function () {
    [$syndic, $residence] = financeFixture();
    $other = targetResidence();
    $foreignFy = financeYear($other);
    $foreignAssembly = Assembly::create([
        'residence_id' => $other->id, 'title' => 'AG X',
        'scheduled_at' => '2026-03-15 10:00:00', 'location' => 'Y',
        'status' => 'held',
    ]);
    $ownFy = financeYear($residence);

    // Année d'une autre résidence.
    $this->actingAs($syndic)->putJson("/api/syndic/residences/{$residence->id}/finance", [
        'fiscal_year_id' => $foreignFy->id,
        'year_calculation_mode' => 'tantieme',
    ])->assertStatus(404);

    // AG d'une autre résidence.
    $this->actingAs($syndic)->putJson("/api/syndic/residences/{$residence->id}/finance", [
        'fiscal_year_id' => $ownFy->id,
        'year_calculation_mode' => 'tantieme',
        'assembly_id' => $foreignAssembly->id,
    ])->assertStatus(422);

    // Mode inconnu + année sans mode.
    $this->actingAs($syndic)->putJson("/api/syndic/residences/{$residence->id}/finance", [
        'calculation_mode' => 'nope',
    ])->assertStatus(422);
    $this->actingAs($syndic)->putJson("/api/syndic/residences/{$residence->id}/finance", [
        'fiscal_year_id' => $ownFy->id,
    ])->assertStatus(422);

    // Résidence d'un autre syndic.
    $stranger = syndicWith();
    $this->actingAs($stranger)->putJson("/api/syndic/residences/{$residence->id}/finance", [
        'calculation_mode' => 'fixed',
    ])->assertStatus(403);
    $this->actingAs($stranger)->getJson("/api/syndic/residences/{$residence->id}/finance")
        ->assertStatus(404);
});
