<?php

use App\Models\Appartement;
use App\Models\CotisationDetail;
use App\Models\Paiement;

it('cannot view other coproprietaire cotisations', function () {
    $copro1 = coproprietaireWith();
    $copro2 = coproprietaireWith();

    $appartement = Appartement::factory()->create([
        'coproprietaire_id' => $copro2->id,
    ]);

    $cotisation = \App\Models\Cotisation::factory()->create([
        'residence_id' => $appartement->residence_id,
    ]);

    $detail = CotisationDetail::factory()->create([
        'cotisation_id' => $cotisation->id,
        'appartement_id' => $appartement->id,
        'coproprietaire_id' => $copro2->id,
    ]);

    $response = $this->actingAs($copro1)->getJson("/api/coproprietaires/cotisations/{$detail->id}");

    $response->assertStatus(403);
});

it('cannot view other coproprietaire payments', function () {
    $copro1 = coproprietaireWith();
    $copro2 = coproprietaireWith();

    $appartement = Appartement::factory()->create([
        'coproprietaire_id' => $copro2->id,
    ]);

    $cotisation = \App\Models\Cotisation::factory()->create([
        'residence_id' => $appartement->residence_id,
    ]);

    $detail = CotisationDetail::factory()->create([
        'cotisation_id' => $cotisation->id,
        'appartement_id' => $appartement->id,
        'coproprietaire_id' => $copro2->id,
    ]);

    Paiement::factory()->create([
        'cotisation_detail_id' => $detail->id,
        'coproprietaire_id' => $copro2->id,
    ]);

    $response = $this->actingAs($copro1)->getJson('/api/coproprietaires/paiements');

    $response->assertStatus(200);
    $data = $response->json('data');
    expect($data)->toBeArray();
    $ids = collect($data)->pluck('id')->toArray();
    expect(in_array($detail->id, $ids))->toBeFalse();
});

it('cannot access syndic routes', function () {
    $copro = coproprietaireWith();

    $response = $this->actingAs($copro)->getJson('/api/syndic/residences');

    $response->assertStatus(403);
});

it('dashboard only shows own data', function () {
    $copro1 = coproprietaireWith();
    $copro2 = coproprietaireWith();

    $appartement1 = Appartement::factory()->create([
        'coproprietaire_id' => $copro1->id,
    ]);

    Appartement::factory()->create([
        'coproprietaire_id' => $copro2->id,
    ]);

    $response = $this->actingAs($copro1)->getJson('/api/coproprietaires/dashboard');

    $response->assertStatus(200);
    $data = $response->json('data');
    $appartementsIds = collect($data['appartements'])->pluck('id')->toArray();
    expect(in_array($appartement1->id, $appartementsIds))->toBeTrue();
    expect(count($data['appartements']))->toBe(1);
});

it('can view own cotisations from the index', function () {
    $copro = coproprietaireWith();

    $appartement = Appartement::factory()->create([
        'coproprietaire_id' => $copro->id,
    ]);

    $cotisation = \App\Models\Cotisation::factory()->create([
        'residence_id' => $appartement->residence_id,
    ]);

    $detail = CotisationDetail::factory()->create([
        'cotisation_id' => $cotisation->id,
        'appartement_id' => $appartement->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $response = $this->actingAs($copro)->getJson('/api/coproprietaires/cotisations');

    $response->assertStatus(200);
    $data = $response->json('data');
    $ids = collect($data)->pluck('id')->toArray();
    expect(in_array($detail->id, $ids))->toBeTrue();
});

it('can view own payments', function () {
    $copro = coproprietaireWith();

    $appartement = Appartement::factory()->create([
        'coproprietaire_id' => $copro->id,
    ]);

    $cotisation = \App\Models\Cotisation::factory()->create([
        'residence_id' => $appartement->residence_id,
    ]);

    $detail = CotisationDetail::factory()->create([
        'cotisation_id' => $cotisation->id,
        'appartement_id' => $appartement->id,
        'coproprietaire_id' => $copro->id,
    ]);

    Paiement::factory()->create([
        'cotisation_detail_id' => $detail->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $response = $this->actingAs($copro)->getJson('/api/coproprietaires/paiements');

    $response->assertStatus(200);
    expect($response->json('data'))->not->toBeEmpty();
});
