<?php

use App\Models\Owner;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

function ownerRightsFixture(): array
{
    [$residence, $lot, $owner] = ownedLotWithLogin('CD98765');
    $syndic = syndicWith();
    $residence->update(['syndic_id' => $syndic->id]);

    return [$syndic, $residence, $lot, $owner];
}

function staffAssistant(array $perms = []): User
{
    Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\RoleSeeder', '--force' => true]);
    $assistant = User::factory()->create([
        'role' => 'assistant', 'type' => 'staff',
    ]);
    Role::findOrCreate('assistant', 'web');
    $assistant->assignRole('assistant');
    if ($perms !== []) {
        $assistant->givePermissionTo($perms);
    }

    return $assistant;
}

it('finds owners by lot reference (local)', function () {
    [$syndic] = ownerRightsFixture();

    $byLot = $this->actingAs($syndic)->getJson('/api/syndic/owners?search=A12')->assertStatus(200);
    expect($byLot->json('meta.total'))->toBe(1);

    $byBuilding = $this->actingAs($syndic)->getJson('/api/syndic/owners?search=B')->assertStatus(200);
    expect($byBuilding->json('meta.total'))->toBeGreaterThanOrEqual(1);
});

it('updates the owner file with owners.update permission', function () {
    [$syndic, $residence, $lot, $owner] = ownerRightsFixture();

    // Syndic (rôle legacy) : OK.
    $this->actingAs($syndic)->putJson("/api/syndic/owners/{$owner->id}", [
        'first_name' => 'Karim',
        'phones' => [['number' => '+212661111111', 'is_primary' => true, 'is_whatsapp' => true]],
    ])->assertStatus(200)
        ->assertJsonPath('data.first_name', 'Karim');
    expect($owner->fresh()->phones()->count())->toBe(1);

    // Assistant sans la permission : 403.
    $assistant = staffAssistant(['owners.view']);
    $this->actingAs($assistant)->putJson("/api/syndic/owners/{$owner->id}", [
        'first_name' => 'Hacker',
    ])->assertStatus(403);
    expect($owner->fresh()->first_name)->toBe('Karim');

    // Assistant avec la permission + résidence assignée : OK.
    $allowed = staffAssistant(['owners.view', 'owners.update']);
    DB::table('residence_user')->insert([
        'residence_id' => $residence->id, 'user_id' => $allowed->id,
    ]);
    $this->actingAs($allowed)->putJson("/api/syndic/owners/{$owner->id}", [
        'internal_notes' => 'Dossier vérifié.',
    ])->assertStatus(200);
});

it('refuses to delete an owner who still holds a lot or is a promoter', function () {
    [$syndic, $residence, $lot, $owner] = ownerRightsFixture();

    // Détient un lot courant → 403 (transférer d’abord).
    $this->actingAs($syndic)->deleteJson("/api/syndic/owners/{$owner->id}")->assertStatus(403);
    expect(Owner::withTrashed()->find($owner->id)->trashed())->toBeFalse();

    // Promoteur d’une résidence → 403 même sans lot.
    $promoter = Owner::factory()->company()->create();
    $residence->update(['promoter_owner_id' => $promoter->id]);
    $this->actingAs($syndic)->deleteJson("/api/syndic/owners/{$promoter->id}")->assertStatus(403);

    // Sans lot ni rôle promoteur → soft delete OK.
    $free = Owner::factory()->create();
    $this->actingAs($syndic)->deleteJson("/api/syndic/owners/{$free->id}")->assertStatus(200);
    expect(Owner::withTrashed()->find($free->id)->trashed())->toBeTrue();
    expect(Owner::find($free->id))->toBeNull();

    // Assistant sans owners.delete → 403.
    $assistant = staffAssistant(['owners.view']);
    $free2 = Owner::factory()->create();
    $this->actingAs($assistant)->deleteJson("/api/syndic/owners/{$free2->id}")->assertStatus(403);
});
