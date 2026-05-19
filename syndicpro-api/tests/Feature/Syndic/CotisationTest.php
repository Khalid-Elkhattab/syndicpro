<?php

use App\Models\Appartement;
use App\Models\Immeuble;

it('generates equal distribution correctly', function () {
    $syndic = syndicWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);

    Appartement::factory()->count(4)->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => coproprietaireWith()->id,
    ]);

    $response = $this->actingAs($syndic)->postJson("/api/syndic/residences/{$residence->id}/cotisations/exceptionnelle", [
        'label' => 'Test répartition égale',
        'montant_total' => 10000,
        'mode_repartition' => 'egale',
        'periode_id' => \App\Models\Periode::factory()->create(['residence_id' => $residence->id])->id,
    ]);

    $response->assertStatus(201);
    $cotisationId = $response->json('data.id');
    expect($cotisationId)->not->toBeNull();
});

it('generates tantieme distribution correctly', function () {
    $syndic = syndicWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);

    Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => coproprietaireWith()->id,
        'tantieme' => 80,
    ]);

    $response = $this->actingAs($syndic)->postJson("/api/syndic/residences/{$residence->id}/cotisations/exceptionnelle", [
        'label' => 'Test tantième',
        'montant_total' => 12000,
        'mode_repartition' => 'par_tantieme',
        'periode_id' => \App\Models\Periode::factory()->create(['residence_id' => $residence->id])->id,
    ]);

    $response->assertStatus(201);
});

it('generates per_appartement distribution correctly', function () {
    $syndic = syndicWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);

    $apt1 = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => coproprietaireWith()->id,
    ]);
    $apt2 = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => coproprietaireWith()->id,
    ]);

    $response = $this->actingAs($syndic)->postJson("/api/syndic/residences/{$residence->id}/cotisations/exceptionnelle", [
        'label' => 'Test par appartement',
        'montant_total' => 5000,
        'mode_repartition' => 'par_appartement',
        'periode_id' => \App\Models\Periode::factory()->create(['residence_id' => $residence->id])->id,
        'montants_map' => [$apt1->id => 3000, $apt2->id => 2000],
    ]);

    $response->assertStatus(201);
});
