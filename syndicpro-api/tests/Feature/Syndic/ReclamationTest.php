<?php

use App\Models\Appartement;
use App\Models\Immeuble;
use App\Models\Reclamation;
use App\Models\Residence;

it('coproprietaire can create reclamation for own appartement', function () {
    $copro = coproprietaireWith();
    $residence = Residence::factory()->create(['syndic_id' => syndicWith()->id]);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $response = $this->actingAs($copro)->postJson('/api/coproprietaires/reclamations', [
        'appartement_id' => $appartement->id,
        'titre' => 'Test réclamation',
        'description' => 'Description test',
        'priorite' => 'normale',
    ]);

    $response->assertStatus(201);
});

it('coproprietaire cannot create reclamation for another appartement', function () {
    $copro = coproprietaireWith();
    $otherCopro = coproprietaireWith();
    $residence = Residence::factory()->create(['syndic_id' => syndicWith()->id]);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $otherCopro->id,
    ]);

    $response = $this->actingAs($copro)->postJson('/api/coproprietaires/reclamations', [
        'appartement_id' => $appartement->id,
        'titre' => 'Test hijack',
        'description' => 'Trying to create for other',
        'priorite' => 'normale',
    ]);

    $response->assertStatus(403);
});

it('syndic can update statut to en_cours', function () {
    $syndic = syndicWith();
    $copro = coproprietaireWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $reclamation = Reclamation::factory()->create([
        'coproprietaire_id' => $copro->id,
        'residence_id' => $residence->id,
        'appartement_id' => $appartement->id,
        'statut' => 'nouveau',
    ]);

    $response = $this->actingAs($syndic)->putJson("/api/syndic/reclamations/{$reclamation->id}/statut", [
        'statut' => 'en_cours',
    ]);

    $response->assertStatus(200);
    $reclamation->refresh();
    expect($reclamation->statut)->toBe('en_cours');
});

it('syndic can update statut to traite with reponse', function () {
    $syndic = syndicWith();
    $copro = coproprietaireWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $reclamation = Reclamation::factory()->create([
        'coproprietaire_id' => $copro->id,
        'residence_id' => $residence->id,
        'appartement_id' => $appartement->id,
        'statut' => 'en_cours',
    ]);

    $response = $this->actingAs($syndic)->putJson("/api/syndic/reclamations/{$reclamation->id}/statut", [
        'statut' => 'traite',
        'reponse_syndic' => 'Problème résolu.',
    ]);

    $response->assertStatus(200);
    $reclamation->refresh();
    expect($reclamation->statut)->toBe('traite');
    expect($reclamation->reponse_syndic)->toBe('Problème résolu.');
});

it('coproprietaire cannot update statut', function () {
    $copro = coproprietaireWith();
    $syndic = syndicWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $reclamation = Reclamation::factory()->create([
        'coproprietaire_id' => $copro->id,
        'residence_id' => $residence->id,
        'appartement_id' => $appartement->id,
        'statut' => 'nouveau',
    ]);

    $response = $this->actingAs($copro)->putJson("/api/syndic/reclamations/{$reclamation->id}/statut", [
        'statut' => 'en_cours',
    ]);

    $response->assertStatus(403);
});

it('notification sent to syndic on new reclamation', function () {
    Notification::fake();

    $copro = coproprietaireWith();
    $syndic = syndicWith();
    $residence = Residence::factory()->create(['syndic_id' => $syndic->id]);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $this->actingAs($copro)->postJson('/api/coproprietaires/reclamations', [
        'appartement_id' => $appartement->id,
        'titre' => 'Notification test',
        'description' => 'Check notification',
        'priorite' => 'normale',
    ]);

    Notification::assertSentTo($syndic, \App\Notifications\NouvelleReclamationNotification::class);
});

it('notification sent to coproprietaire on statut update', function () {
    Notification::fake();

    $syndic = syndicWith();
    $copro = coproprietaireWith();
    $residence = residenceFor($syndic);
    $immeuble = Immeuble::factory()->create(['residence_id' => $residence->id]);

    $appartement = Appartement::factory()->create([
        'immeuble_id' => $immeuble->id,
        'residence_id' => $residence->id,
        'coproprietaire_id' => $copro->id,
    ]);

    $reclamation = Reclamation::factory()->create([
        'coproprietaire_id' => $copro->id,
        'residence_id' => $residence->id,
        'appartement_id' => $appartement->id,
        'statut' => 'nouveau',
    ]);

    $this->actingAs($syndic)->putJson("/api/syndic/reclamations/{$reclamation->id}/statut", [
        'statut' => 'en_cours',
    ]);

    Notification::assertSentTo($copro, \App\Notifications\ReclamationUpdatedNotification::class);
});
