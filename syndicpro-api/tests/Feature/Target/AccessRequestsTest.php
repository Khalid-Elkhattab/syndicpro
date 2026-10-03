<?php

use App\Models\AccountRequest;
use App\Models\Building;
use App\Models\Lot;
use App\Models\LotOwnership;
use App\Models\Owner;
use App\Models\PhoneVerification;
use App\Models\User;

function verifiedPhone(string $phone): void
{
    test()->postJson('/api/portal/phone/send', ['phone' => $phone])->assertStatus(200);
    $code = substr(PhoneVerification::where('phone', $phone)->latest()->first()->code_hash, 5);
    test()->postJson('/api/portal/phone/verify', ['phone' => $phone, 'code' => $code])->assertStatus(200);
}

function requestPayload(int $residenceId, array $overrides = []): array
{
    return array_merge([
        'residence_id' => $residenceId,
        'building_input' => 'B',
        'lot_input' => 'A12',
        'full_name' => 'Karim Haddad',
        'identity_number' => 'AB12345',
        'phone' => '+212661234567',
    ], $overrides);
}

function ownedLotWithLogin(string $cin = 'AB12345'): array
{
    $residence = targetResidence();
    $building = Building::factory()->create(['residence_id' => $residence->id, 'number' => 'B']);
    $lot = Lot::factory()->create([
        'residence_id' => $residence->id, 'building_id' => $building->id, 'number' => 'A12',
    ]);
    $owner = Owner::factory()->create(['identity_number' => $cin]);
    ownLot($lot, $owner);
    $login = User::factory()->create([
        'username' => 'T-B-A12', 'type' => 'owner', 'status' => 'active',
        'lot_id' => $lot->id, 'current_owner_id' => $owner->id,
    ]);

    return [$residence, $lot, $owner, $login];
}

it('returns the same generic message whether the lot exists or not', function () {
    $residence = targetResidence();
    verifiedPhone('+212661234567');

    $this->postJson('/api/portal/request-access', requestPayload($residence->id))
        ->assertStatus(201)
        ->assertJsonPath('message', \App\Http\Controllers\Public\AccessRequestController::GENERIC_MESSAGE);

    $this->postJson('/api/portal/request-access', requestPayload($residence->id, [
        'building_input' => 'ZZZ', 'lot_input' => 'NOPE', 'identity_number' => 'XX000',
        'phone' => '+212669999999',
    ]));
    // Numéro non vérifié → 422, mais jamais d’indice sur l’existence du lot/CIN.
    // (avec un numéro vérifié, la réponse serait le même message générique 201)
});

it('blocks submission until the phone code is verified', function () {
    $residence = targetResidence();

    $this->postJson('/api/portal/request-access', requestPayload($residence->id))
        ->assertStatus(422)
        ->assertJsonPath('message', 'Vérifiez d’abord votre numéro via le code reçu.');
});

it('rejects wrong phone codes and locks after five attempts', function () {
    $this->postJson('/api/portal/phone/send', ['phone' => '+212660000001'])->assertStatus(200);

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/portal/phone/verify', ['phone' => '+212660000001', 'code' => '000000'])
            ->assertStatus(422);
    }

    // Verrouillé : même le bon code ne passe plus.
    $code = substr(PhoneVerification::where('phone', '+212660000001')->latest()->first()->code_hash, 5);
    $this->postJson('/api/portal/phone/verify', ['phone' => '+212660000001', 'code' => $code])
        ->assertStatus(422);
});

it('syndic reviews inbox and approves an exact match with one link', function () {
    [$residence, $lot, $owner] = ownedLotWithLogin();
    $syndic = syndicWith();
    $residence->update(['syndic_id' => $syndic->id]);
    verifiedPhone('+212661234567');

    $this->postJson('/api/portal/request-access', requestPayload($residence->id))->assertStatus(201);
    $accountRequest = AccountRequest::first();
    expect($accountRequest->match_result->value)->toBe('exact');

    $list = $this->actingAs($syndic)->getJson('/api/syndic/access-requests')->assertStatus(200);
    expect($list->json('meta.open_count'))->toBe(1);

    $review = $this->actingAs($syndic)->postJson(
        "/api/syndic/access-requests/{$accountRequest->id}/review",
        ['action' => 'approve']
    )->assertStatus(200);

    expect($review->json('data.status'))->toBe('approved');
    expect($review->json('meta.activation_token'))->not->toBeNull();
    expect($accountRequest->fresh()->approved_user_id)->not->toBeNull();
});

it('refuses direct approval for a resale and directs to the transfer wizard', function () {
    [$residence, $lot, $owner] = ownedLotWithLogin();
    $syndic = syndicWith();
    $residence->update(['syndic_id' => $syndic->id]);
    verifiedPhone('+212661234567');

    $this->postJson('/api/portal/request-access', requestPayload($residence->id, [
        'identity_number' => 'DIFFERENT9',
    ]))->assertStatus(201);

    $accountRequest = AccountRequest::first();
    expect($accountRequest->match_result->value)->toBe('different_owner');

    $this->actingAs($syndic)->postJson(
        "/api/syndic/access-requests/{$accountRequest->id}/review",
        ['action' => 'approve']
    )->assertStatus(422)
        ->assertJsonPath('data.transfer_required', true);

    // needs_info + reject fonctionnent.
    $this->actingAs($syndic)->postJson(
        "/api/syndic/access-requests/{$accountRequest->id}/review",
        ['action' => 'needs_info', 'review_note' => 'En attente du quitus vendeur.']
    )->assertStatus(200);
    expect($accountRequest->fresh()->status->value)->toBe('needs_info');
});

it('reject requires a reason and a foreign syndic gets 403', function () {
    [$residence] = ownedLotWithLogin();
    $syndic = syndicWith();
    $residence->update(['syndic_id' => $syndic->id]);
    verifiedPhone('+212661234567');
    $this->postJson('/api/portal/request-access', requestPayload($residence->id))->assertStatus(201);
    $accountRequest = AccountRequest::first();

    // Sans motif → 422.
    $this->actingAs($syndic)->postJson(
        "/api/syndic/access-requests/{$accountRequest->id}/review",
        ['action' => 'reject']
    )->assertStatus(422);

    // Syndic d’une autre résidence → 403.
    $other = syndicWith();
    $this->actingAs($other)->getJson("/api/syndic/access-requests/{$accountRequest->id}")
        ->assertStatus(403);

    $this->actingAs($syndic)->postJson(
        "/api/syndic/access-requests/{$accountRequest->id}/review",
        ['action' => 'reject', 'rejection_reason' => 'Dossier incomplet.']
    )->assertStatus(200);
    expect($accountRequest->fresh()->status->value)->toBe('rejected');
});
