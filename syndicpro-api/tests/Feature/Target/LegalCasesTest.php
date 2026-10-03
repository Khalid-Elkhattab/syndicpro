<?php

use App\Models\LawyerCase;
use App\Models\LotTransfer;
use App\Models\Owner;
use App\Models\User;

function legalFixture(): array
{
    [$residence, $lot, $seller] = ownedLotWithLogin();
    \App\Models\LotOwnership::where('lot_id', $lot->id)->update(['started_on' => '2023-01-01']);
    $syndic = syndicWith();
    $residence->update(['syndic_id' => $syndic->id]);
    $login = User::where('lot_id', $lot->id)->first();
    \App\Models\LotAccountAssignment::create([
        'user_id' => $login->id, 'lot_id' => $lot->id, 'owner_id' => $seller->id,
        'started_at' => now(),
    ]);
    $buyer = Owner::factory()->create();

    return [$syndic, $residence, $lot, $seller, $buyer];
}

it('runs a transfer without quitus and flags it for legal action', function () {
    [$syndic, $residence, $lot, $seller, $buyer] = legalFixture();
    paidDues($seller, $lot, 2);

    // Ni quitus ni motif → 422.
    $this->actingAs($syndic)->postJson("/api/syndic/lots/{$lot->id}/transfer", [
        'to_owner_id' => $buyer->id,
        'effective_on' => '2024-02-01',
        'reason' => 'sale',
    ])->assertStatus(422);

    // Avec motif → 201 + dossier juridique auto.
    $response = $this->actingAs($syndic)->postJson("/api/syndic/lots/{$lot->id}/transfer", [
        'to_owner_id' => $buyer->id,
        'effective_on' => '2024-02-01',
        'reason' => 'sale',
        'no_quitus_motif' => 'Vendeur introuvable, acte en cours de régularisation.',
    ])->assertStatus(201);

    expect($response->json('message'))->toContain('juridique');

    $transfer = LotTransfer::where('lot_id', $lot->id)->first();
    expect($transfer->quitus_id)->toBeNull();

    $case = LawyerCase::where('transfer_id', $transfer->id)->first();
    expect($case)->not->toBeNull()
        ->and($case->case_kind)->toBe('no_quitus_transfer')
        ->and($case->motif)->toBe('Vendeur introuvable, acte en cours de régularisation.')
        ->and((float) $case->amount_claimed)->toBe(600.0)
        ->and($case->status->value)->toBe('to_transmit');
});

it('lists unpaid owners with motifs and escalates them to lawyer cases', function () {
    [$syndic, $residence, $lot, $seller] = legalFixture();
    paidDues($seller, $lot, 2);

    $overview = $this->actingAs($syndic)
        ->getJson("/api/syndic/legal/overview?residence_id={$residence->id}")
        ->assertStatus(200);

    expect($overview->json('data.total'))->toBe(1);
    $row = $overview->json('data.rows.0');
    expect($row['case_kind'])->toBe('unpaid_dues')
        ->and((float) $row['amount_due'])->toBe(600.0)
        ->and($row['motif'])->toContain('Impayés')
        ->and($row['months_late'])->toBeGreaterThanOrEqual(0);

    // Escalade manuelle vers un dossier avocat (motif obligatoire).
    $this->actingAs($syndic)->postJson('/api/syndic/legal/lawyer-cases', [
        'residence_id' => $residence->id,
        'owner_id' => $seller->id,
        'lot_id' => $lot->id,
        'case_kind' => 'unpaid_dues',
        'amount_claimed' => 600,
    ])->assertStatus(422);

    $created = $this->actingAs($syndic)->postJson('/api/syndic/legal/lawyer-cases', [
        'residence_id' => $residence->id,
        'owner_id' => $seller->id,
        'lot_id' => $lot->id,
        'case_kind' => 'unpaid_dues',
        'motif' => '6 mois d’impayés malgré 2 relances.',
        'amount_claimed' => 600,
    ])->assertStatus(201);
    expect($created->json('data.case_kind_label'))->toBe('Impayés')
        ->and($created->json('data.status'))->toBe('to_transmit');

    // L’aperçu reflète le dossier lié.
    $overview2 = $this->actingAs($syndic)
        ->getJson("/api/syndic/legal/overview?residence_id={$residence->id}")
        ->assertStatus(200);
    expect($overview2->json('data.rows.0.lawyer_case.status'))->toBe('to_transmit');
});

it('runs the lawyer case status workflow forward only', function () {
    [$syndic, $residence, $lot, $seller] = legalFixture();

    $created = $this->actingAs($syndic)->postJson('/api/syndic/legal/lawyer-cases', [
        'residence_id' => $residence->id,
        'owner_id' => $seller->id,
        'case_kind' => 'other',
        'motif' => 'Litige charges ascenseur.',
        'amount_claimed' => 1500,
    ])->assertStatus(201);
    $id = $created->json('data.id');

    $this->actingAs($syndic)->putJson("/api/syndic/legal/lawyer-cases/{$id}/status", [
        'status' => 'transmitted',
    ])->assertStatus(200)->assertJsonPath('data.status', 'transmitted');

    // Retour en arrière interdit.
    $this->actingAs($syndic)->putJson("/api/syndic/legal/lawyer-cases/{$id}/status", [
        'status' => 'to_transmit',
    ])->assertStatus(200); // réouverture autorisée (retour à l’étape initiale)

    $this->actingAs($syndic)->putJson("/api/syndic/legal/lawyer-cases/{$id}/status", [
        'status' => 'closed',
    ])->assertStatus(200);

    $list = $this->actingAs($syndic)
        ->getJson("/api/syndic/legal/lawyer-cases?residence_id={$residence->id}&status=closed")
        ->assertStatus(200);
    expect($list->json('meta.total'))->toBe(1);
});

it('lists transfers without quitus with their legal status', function () {
    [$syndic, $residence, $lot, $seller, $buyer] = legalFixture();
    paidDues($seller, $lot, 1);

    $this->actingAs($syndic)->postJson("/api/syndic/lots/{$lot->id}/transfer", [
        'to_owner_id' => $buyer->id,
        'effective_on' => '2024-02-01',
        'reason' => 'sale',
        'no_quitus_motif' => 'Aucun quitus fourni par le vendeur.',
    ])->assertStatus(201);

    $list = $this->actingAs($syndic)
        ->getJson("/api/syndic/legal/transfers-without-quitus?residence_id={$residence->id}")
        ->assertStatus(200);

    expect($list->json('meta.total'))->toBe(1);
    $row = $list->json('data.0');
    expect($row['case_kind'])->toBe('no_quitus_transfer')
        ->and($row['motif'])->toBe('Aucun quitus fourni par le vendeur.')
        ->and($row['lawyer_case']['status'])->toBe('to_transmit');
});
