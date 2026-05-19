<?php

use App\Models\Appartement;
use App\Models\CotisationDetail;
use App\Models\Immeuble;
use App\Models\Paiement;
use App\Models\Periode;

beforeEach(function () {
    Queue::fake();
});

it('records full payment and updates statut to paye', function () {
    $syndic = syndicWith();
    $copro = coproprietaireWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);
    $periode = Periode::factory()->create(['residence_id' => $residence->id, 'is_active' => true]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $cotisation = \App\Models\Cotisation::factory()->create([
        'residence_id' => $residence->id,
        'periode_id' => $periode->id,
    ]);

    $detail = CotisationDetail::factory()->create([
        'cotisation_id' => $cotisation->id,
        'appartement_id' => $appartement->id,
        'coproprietaire_id' => $copro->id,
        'montant' => 500,
        'montant_paye' => 0,
        'statut' => 'non_paye',
    ]);

    $response = $this->actingAs($syndic)->postJson('/api/syndic/paiements', [
        'cotisation_detail_id' => $detail->id,
        'date_paiement' => now()->format('Y-m-d'),
        'montant' => 500,
        'mode_paiement' => 'especes',
    ]);

    $response->assertStatus(201);

    $detail->refresh();
    expect($detail->statut->value)->toBe('paye');
    expect((float) $detail->montant_paye)->toBe(500.0);
});

it('records partial payment and updates statut to partiellement_paye', function () {
    $syndic = syndicWith();
    $copro = coproprietaireWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);
    $periode = Periode::factory()->create(['residence_id' => $residence->id, 'is_active' => true]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $cotisation = \App\Models\Cotisation::factory()->create([
        'residence_id' => $residence->id,
        'periode_id' => $periode->id,
    ]);

    $detail = CotisationDetail::factory()->create([
        'cotisation_id' => $cotisation->id,
        'appartement_id' => $appartement->id,
        'coproprietaire_id' => $copro->id,
        'montant' => 500,
        'montant_paye' => 0,
        'statut' => 'non_paye',
    ]);

    $response = $this->actingAs($syndic)->postJson('/api/syndic/paiements', [
        'cotisation_detail_id' => $detail->id,
        'date_paiement' => now()->format('Y-m-d'),
        'montant' => 200,
        'mode_paiement' => 'virement',
    ]);

    $response->assertStatus(201);

    $detail->refresh();
    expect($detail->statut->value)->toBe('partiellement_paye');
    expect((float) $detail->montant_paye)->toBe(200.0);
});

it('rejects payment exceeding restant a payer', function () {
    $syndic = syndicWith();
    $copro = coproprietaireWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);
    $periode = Periode::factory()->create(['residence_id' => $residence->id, 'is_active' => true]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $cotisation = \App\Models\Cotisation::factory()->create([
        'residence_id' => $residence->id,
        'periode_id' => $periode->id,
    ]);

    $detail = CotisationDetail::factory()->create([
        'cotisation_id' => $cotisation->id,
        'appartement_id' => $appartement->id,
        'coproprietaire_id' => $copro->id,
        'montant' => 500,
        'montant_paye' => 200,
        'statut' => 'partiellement_paye',
    ]);

    $response = $this->actingAs($syndic)->postJson('/api/syndic/paiements', [
        'cotisation_detail_id' => $detail->id,
        'date_paiement' => now()->format('Y-m-d'),
        'montant' => 400,
        'mode_paiement' => 'especes',
    ]);

    $response->assertStatus(400);
});

it('rejects payment on already fully paid cotisation', function () {
    $syndic = syndicWith();
    $copro = coproprietaireWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);
    $periode = Periode::factory()->create(['residence_id' => $residence->id, 'is_active' => true]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $cotisation = \App\Models\Cotisation::factory()->create([
        'residence_id' => $residence->id,
        'periode_id' => $periode->id,
    ]);

    $detail = CotisationDetail::factory()->create([
        'cotisation_id' => $cotisation->id,
        'appartement_id' => $appartement->id,
        'coproprietaire_id' => $copro->id,
        'montant' => 500,
        'montant_paye' => 500,
        'statut' => 'paye',
    ]);

    $response = $this->actingAs($syndic)->postJson('/api/syndic/paiements', [
        'cotisation_detail_id' => $detail->id,
        'date_paiement' => now()->format('Y-m-d'),
        'montant' => 50,
        'mode_paiement' => 'especes',
    ]);

    $response->assertStatus(400);
});

it('dispatches GenerateReceipt job on payment', function () {
    $syndic = syndicWith();
    $copro = coproprietaireWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);
    $periode = Periode::factory()->create(['residence_id' => $residence->id, 'is_active' => true]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $cotisation = \App\Models\Cotisation::factory()->create([
        'residence_id' => $residence->id,
        'periode_id' => $periode->id,
    ]);

    $detail = CotisationDetail::factory()->create([
        'cotisation_id' => $cotisation->id,
        'appartement_id' => $appartement->id,
        'coproprietaire_id' => $copro->id,
        'montant' => 500,
        'montant_paye' => 0,
        'statut' => 'non_paye',
    ]);

    $this->actingAs($syndic)->postJson('/api/syndic/paiements', [
        'cotisation_detail_id' => $detail->id,
        'date_paiement' => now()->format('Y-m-d'),
        'montant' => 500,
        'mode_paiement' => 'especes',
    ]);

    Queue::assertPushed(\App\Jobs\GenerateReceipt::class);
});
