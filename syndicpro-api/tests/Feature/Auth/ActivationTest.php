<?php

use App\Http\Controllers\Auth\AuthController;
use App\Models\User;
use Illuminate\Routing\Middleware\ThrottleRequests;

function createCoproPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Nouveau Copro',
        'email' => 'nuevo.'.uniqid().'@example.com',
        'username' => 'copro.'.uniqid(),
    ], $overrides);
}

it('creates coproprietaire without password as pending with single-use token', function () {
    $syndic = syndicWith();

    $response = $this->actingAs($syndic)->postJson('/api/syndic/coproprietaires', createCoproPayload());

    $response->assertStatus(201);
    $token = $response->json('meta.activation_token');
    expect($token)->not->toBeNull();

    $user = User::where('username', $response->json('data.username'))->first();
    expect($user->isPendingActivation())->toBeTrue()
        ->and($user->activation_token_hash)->not->toBeNull()
        ->and($response->json('data.status'))->toBe('pending_activation')
        ->and($response->json('data.type'))->toBe('owner');
});

it('pending account cannot log in and gets the generic message', function () {
    $syndic = syndicWith();

    $created = $this->actingAs($syndic)->postJson('/api/syndic/coproprietaires', createCoproPayload());
    $username = $created->json('data.username');

    $response = $this->postJson('/api/auth/login', ['username' => $username, 'password' => 'whatever123']);

    $response->assertStatus(401);
    expect($response->json('message'))->toBe(AuthController::GENERIC_FAILURE);
});

it('activates pending account with a valid token then login works', function () {
    $syndic = syndicWith();

    $created = $this->actingAs($syndic)->postJson('/api/syndic/coproprietaires', createCoproPayload());
    $token = $created->json('meta.activation_token');
    $username = $created->json('data.username');

    $activate = $this->postJson("/api/auth/activate/{$token}", [
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);
    $activate->assertStatus(200);

    // Lien à usage unique : deuxième tentative refusée.
    $this->postJson("/api/auth/activate/{$token}", [
        'password' => 'otherpass123',
        'password_confirmation' => 'otherpass123',
    ])->assertStatus(404);

    $login = $this->postJson('/api/auth/login', ['username' => $username, 'password' => 'newpassword123']);
    $login->assertStatus(200);
    expect($login->json('data.user.status'))->toBe('active');
});

it('rejects expired activation links', function () {
    $syndic = syndicWith();

    $created = $this->actingAs($syndic)->postJson('/api/syndic/coproprietaires', createCoproPayload());
    $token = $created->json('meta.activation_token');
    $user = User::where('username', $created->json('data.username'))->first();
    $user->forceFill(['activation_expires_at' => now()->subDay()])->save();

    $this->postJson("/api/auth/activate/{$token}", [
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ])->assertStatus(422);
});

it('legacy creation with password stays active immediately', function () {
    $syndic = syndicWith();

    $created = $this->actingAs($syndic)->postJson('/api/syndic/coproprietaires', createCoproPayload([
        'password' => 'legacy1234',
        'password_confirmation' => 'legacy1234',
    ]));

    $created->assertStatus(201);
    expect($created->json('data.status'))->toBe('active');
    expect($created->json('meta.activation_token', null))->toBeNull();

    $this->postJson('/api/auth/login', [
        'username' => $created->json('data.username'),
        'password' => 'legacy1234',
    ])->assertStatus(200);
});

it('locks account after five failed logins with the same generic message', function () {
    $this->withoutMiddleware(ThrottleRequests::class);
    $user = coproprietaireWith(['username' => 'locked.'.uniqid(), 'password' => bcrypt('password')]);

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/auth/login', ['username' => $user->username, 'password' => 'wrongpass'])->assertStatus(401);
    }

    $user->refresh();
    expect($user->locked_until)->not->toBeNull();

    $response = $this->postJson('/api/auth/login', ['username' => $user->username, 'password' => 'password']);
    $response->assertStatus(401);
    expect($response->json('message'))->toBe(AuthController::GENERIC_FAILURE);
});
