<?php

use App\Models\Contribution;
use App\Models\Due;
use App\Models\Owner;

function contributionFixture(array $attrs = []): array
{
    $syndic = syndicWith();
    $residence = residenceFor($syndic);

    return [$syndic, $residence];
}

function draftPayload(array $overrides = []): array
{
    return array_merge([
        'type' => 'syndic',
        'name' => 'Cotisation 2026',
        'starts_on' => '2026-01-01',
        'ends_on' => '2026-12-31',
        'calculation_mode' => 'tantieme',
        'annual_budget' => 12000,
    ], $overrides);
}

it('validates the value per calculation mode on create', function () {
    [$syndic, $residence] = contributionFixture();

    // Tantièmes sans budget → 422.
    $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload(['annual_budget' => null])
    )->assertStatus(422);

    // Surface sans grille → 422 (tranches pures, pas de budget).
    $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload(['calculation_mode' => 'per_surface', 'annual_budget' => null])
    )->assertStatus(422);

    // Fixe sans grille → 422.
    $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload(['calculation_mode' => 'fixed', 'annual_budget' => null])
    )->assertStatus(422);

    // Fixe avec type manquant sur une ligne → 422.
    $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload([
            'calculation_mode' => 'fixed',
            'annual_budget' => null,
            'fixed_rates' => [
                ['lot_type' => null, 'monthly_amount' => 300],
            ],
        ])
    )->assertStatus(422);

    // Surface avec type renseigné → 422 (tranches pures uniquement).
    $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload([
            'calculation_mode' => 'per_surface',
            'annual_budget' => null,
            'fixed_rates' => [
                ['lot_type' => 'apartment', 'max_surface' => 100, 'monthly_amount' => 300],
            ],
        ])
    )->assertStatus(422);

    // Fixe avec grille typée → 201 brouillon.
    $response = $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload([
            'calculation_mode' => 'fixed',
            'annual_budget' => null,
            'fixed_rates' => [
                ['lot_type' => 'apartment', 'monthly_amount' => 300],
            ],
        ])
    )->assertStatus(201);

    expect($response->json('data.status'))->toBe('draft');
    expect(Contribution::count())->toBe(1);

    // Surface avec tranches pures → 201 brouillon.
    $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload([
            'name' => 'Surface 2026',
            'calculation_mode' => 'per_surface',
            'annual_budget' => null,
            'fixed_rates' => [
                ['lot_type' => null, 'max_surface' => 100, 'monthly_amount' => 300],
            ],
        ])
    )->assertStatus(201);
    expect(Contribution::count())->toBe(2);
});

it('previews per-lot annuals without persisting dues', function () {
    [$syndic, $residence] = contributionFixture();
    $lotA = targetLot($residence, ['surface' => 50, 'tantieme' => 100]);
    $lotB = targetLot($residence, ['surface' => 150, 'tantieme' => 300]);
    $owner = Owner::factory()->create();
    ownLot($lotA, $owner);
    ownLot($lotB, $owner);

    $created = $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload([
            'calculation_mode' => 'per_surface',
            'annual_budget' => null,
            'fixed_rates' => [
                ['lot_type' => null, 'max_surface' => 100, 'monthly_amount' => 300],
                ['lot_type' => null, 'min_surface' => 100.01, 'monthly_amount' => 400],
            ],
        ])
    )->assertStatus(201);
    $id = $created->json('data.id');

    $preview = $this->actingAs($syndic)->getJson("/api/syndic/contributions/{$id}/preview")
        ->assertStatus(200);

    // 50 m² → 300 × 12 = 3600 ; 150 m² → 400 × 12 = 4800.
    expect((float) $preview->json('data.annual_total'))->toBe(8400.0);
    expect($preview->json('data.rows'))->toHaveCount(2);
    expect(Due::count())->toBe(0);
});

it('publishes once, then locks the contribution', function () {
    [$syndic, $residence] = contributionFixture();
    $lot = targetLot($residence, ['tantieme' => 100]);
    $owner = Owner::factory()->create();
    ownLot($lot, $owner);

    $created = $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload()
    )->assertStatus(201);
    $id = $created->json('data.id');

    $this->actingAs($syndic)->postJson("/api/syndic/contributions/{$id}/publish")
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'published');
    expect(Due::where('lot_id', $lot->id)->count())->toBe(12);

    // Ni republication, ni modification, ni suppression après publication.
    $this->actingAs($syndic)->postJson("/api/syndic/contributions/{$id}/publish")->assertStatus(422);
    $this->actingAs($syndic)->putJson("/api/syndic/contributions/{$id}", ['name' => 'X'])->assertStatus(422);
    $this->actingAs($syndic)->deleteJson("/api/syndic/contributions/{$id}")->assertStatus(422);

    // Mais un brouillon reste modifiable et supprimable.
    $draft = $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload(['name' => 'Brouillon'])
    )->assertStatus(201)->json('data.id');
    $this->actingAs($syndic)->putJson("/api/syndic/contributions/{$draft}", ['name' => 'Renommée'])
        ->assertStatus(200);
    $this->actingAs($syndic)->deleteJson("/api/syndic/contributions/{$draft}")->assertStatus(200);
});

it('scopes contributions to the syndic residence', function () {
    [$syndic, $residence] = contributionFixture();
    $stranger = syndicWith();

    $this->actingAs($stranger)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload()
    )->assertStatus(403);

    $mine = $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/contributions",
        draftPayload()
    )->assertStatus(201)->json('data.id');

    $this->actingAs($stranger)->getJson("/api/syndic/contributions/{$mine}/preview")->assertStatus(404);
});
