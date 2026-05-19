<?php

use App\Models\Residence;
use App\Models\User;

it('syndic can only see own residences', function () {
    $syndic = syndicWith();
    $otherSyndic = syndicWith();

    Residence::factory()->create(['syndic_id' => $syndic->id]);
    Residence::factory()->create(['syndic_id' => $otherSyndic->id]);

    $response = $this->actingAs($syndic)->getJson('/api/syndic/residences');

    $response->assertStatus(200);
    $data = $response->json('data');
    $ids = collect($data)->pluck('syndic_id')->unique()->toArray();
    expect($ids)->toBe([$syndic->id]);
});

it('syndic cannot view another syndic residence', function () {
    $syndic = syndicWith();
    $otherSyndic = syndicWith();
    $residence = Residence::factory()->create(['syndic_id' => $otherSyndic->id]);

    $response = $this->actingAs($syndic)
        ->getJson("/api/syndic/residences/{$residence->id}");

    $response->assertStatus(404);
});

it('syndic can create a residence', function () {
    $syndic = syndicWith();

    $response = $this->actingAs($syndic)->postJson('/api/syndic/residences', [
        'nom' => 'Nouvelle Résidence',
        'ville' => 'Rabat',
        'adresse' => '123 Rue de la Liberté',
    ]);

    $response->assertStatus(201);
    $response->assertJsonPath('data.nom', 'Nouvelle Résidence');
});

it('syndic can update own residence', function () {
    $syndic = syndicWith();
    $residence = Residence::factory()->create(['syndic_id' => $syndic->id]);

    $response = $this->actingAs($syndic)->putJson("/api/syndic/residences/{$residence->id}", [
        'nom' => 'Résidence Mise à Jour',
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('data.nom', 'Résidence Mise à Jour');
});

it('syndic cannot update another syndic residence', function () {
    $syndic = syndicWith();
    $otherSyndic = syndicWith();
    $residence = Residence::factory()->create(['syndic_id' => $otherSyndic->id]);

    $response = $this->actingAs($syndic)->putJson("/api/syndic/residences/{$residence->id}", [
        'nom' => 'Hijack',
    ]);

    $response->assertStatus(403);
});

it('syndic can delete own residence', function () {
    $syndic = syndicWith();
    $residence = Residence::factory()->create(['syndic_id' => $syndic->id]);

    $response = $this->actingAs($syndic)->deleteJson("/api/syndic/residences/{$residence->id}");

    $response->assertStatus(200);
    expect(Residence::find($residence->id))->toBeNull();
});
