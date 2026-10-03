<?php

use App\Models\Lot;
use App\Models\Owner;
use App\Models\User;

function transferFixture(): array
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

    return [$syndic, $residence, $lot, $seller, $buyer, $login];
}

it('exposes wizard data with outgoing owner balance and quitus list', function () {
    [$syndic, $residence, $lot, $seller] = transferFixture();
    paidDues($seller, $lot, 1);

    $response = $this->actingAs($syndic)->getJson("/api/syndic/lots/{$lot->id}/transfer-data");

    $response->assertStatus(200);
    expect($response->json('data.outgoing_owner.id'))->toBe($seller->id)
        ->and((float) $response->json('data.overdue_balance'))->toBe(300.0)
        ->and($response->json('data.suggested_effective_on'))->toBe(date('Y-m-01', strtotime('+1 month')));
});

it('issues quitus through the endpoint only at zero balance', function () {
    [$syndic, $residence, $lot, $seller] = transferFixture();
    paidDues($seller, $lot, 1);

    $this->actingAs($syndic)->postJson('/api/syndic/quitus', [
        'owner_id' => $seller->id, 'lot_id' => $lot->id, 'purpose' => 'sale',
    ])->assertStatus(422);

    $payment = targetPayment($residence, $seller, 300);
    app(\App\Services\AllocationService::class)->allocate($payment);

    $this->actingAs($syndic)->postJson('/api/syndic/quitus', [
        'owner_id' => $seller->id, 'lot_id' => $lot->id, 'purpose' => 'sale',
    ])->assertStatus(201)
        ->assertJsonPath('data.status', 'valid');
});

it('runs the transfer through the endpoint and resets the login', function () {
    [$syndic, $residence, $lot, $seller, $buyer, $login] = transferFixture();
    paidDues($seller, $lot, 2);
    $payment = targetPayment($residence, $seller, 600);
    app(\App\Services\AllocationService::class)->allocate($payment);
    $quitusId = \App\Models\QuitusCertificate::where('lot_id', $lot->id)->first()?->id
        ?? app(\App\Services\QuitusService::class)->issue($residence->id, $seller->id, $lot->id, 'sale')->id;

    // Sans quitus → 422.
    $this->actingAs($syndic)->postJson("/api/syndic/lots/{$lot->id}/transfer", [
        'to_owner_id' => $buyer->id,
        'effective_on' => '2024-02-01',
        'reason' => 'sale',
    ])->assertStatus(422);

    $this->actingAs($syndic)->postJson("/api/syndic/lots/{$lot->id}/transfer", [
        'to_owner_id' => $buyer->id,
        'effective_on' => '2024-02-01',
        'reason' => 'sale',
        'quitus_id' => $quitusId,
    ])->assertStatus(201);

    expect($login->fresh()->isPendingActivation())->toBeTrue();
    expect(\App\Models\LotTransfer::where('lot_id', $lot->id)->count())->toBe(1);
});

it('searches owners by CIN and masks identity in lists', function () {
    [$residence, $lot, $seller] = ownedLotWithLogin('CD98765');
    $syndic = syndicWith();
    $residence->update(['syndic_id' => $syndic->id]);

    $list = $this->actingAs($syndic)->getJson('/api/syndic/owners?search=cd98765')->assertStatus(200);
    expect($list->json('meta.total'))->toBe(1);
    expect($list->json('data.0.identity_number'))->toBe('CD•••65');

    // Fiche : situation + journal d’audit.
    $file = $this->actingAs($syndic)->getJson("/api/syndic/owners/{$seller->id}")->assertStatus(200);
    expect($file->json('data.situation'))->toHaveKeys(['total_due', 'remaining', 'overdue']);
});

it('keeps lot history staff-only', function () {
    [$residence, $lot] = ownedLotWithLogin();
    $syndic = syndicWith();
    $residence->update(['syndic_id' => $syndic->id]);

    $this->actingAs($syndic)->getJson("/api/syndic/lots/{$lot->id}/history")
        ->assertStatus(200)
        ->assertJsonStructure(['data' => ['periods', 'transfers', 'dues', 'logins', 'events']]);

    $copro = coproprietaireWith();
    $this->actingAs($copro)->getJson("/api/syndic/lots/{$lot->id}/history")->assertStatus(403);

    // Création propriétaire : même CIN → lié, pas de doublon.
    $before = Owner::count();
    $this->actingAs($syndic)->postJson('/api/syndic/owners', [
        'first_name' => 'Autre', 'last_name' => 'Nom', 'identity_number' => 'ab12345',
    ])->assertStatus(201);
    expect(Owner::count())->toBe($before);
});
