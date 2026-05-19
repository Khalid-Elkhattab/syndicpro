<?php

use App\Models\User;

beforeEach(function () {
    User::factory()->syndic()->create([
        'username' => 'syndic.test',
        'password' => bcrypt('password'),
    ]);
});

it('returns correct user role for syndic', function () {
    $user = User::where('username', 'syndic.test')->first();

    $response = $this->actingAs($user)->getJson('/api/auth/me');

    $response->assertStatus(200);
    $response->assertJsonPath('data.role', 'syndic');
});

it('me returns authenticated user data', function () {
    $user = User::where('username', 'syndic.test')->first();

    $response = $this->actingAs($user)->getJson('/api/auth/me');

    $response->assertStatus(200);
    $response->assertJsonPath('data.id', $user->id);
    $response->assertJsonStructure([
        'success',
        'data' => ['id', 'name', 'role', 'username'],
    ]);
});

it('unauthenticated request to me returns 401', function () {
    $response = $this->getJson('/api/auth/me');

    $response->assertStatus(401);
});

it('blocks disabled account from being used', function () {
    User::factory()->syndic()->desactive()->create([
        'username' => 'disabled.user',
        'password' => bcrypt('password'),
    ]);

    $user = User::where('username', 'disabled.user')->first();

    $response = $this->actingAs($user)->getJson('/api/auth/me');

    $response->assertStatus(200);
    expect($user->is_active)->toBeFalse();
});
