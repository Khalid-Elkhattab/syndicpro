<?php

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\DocumentTypeSeeder', '--force' => true]);
    Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\RoleSeeder', '--force' => true]);
    app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
});

function syndicManager(): \App\Models\User
{
    $syndic = syndicWith();
    \Spatie\Permission\Models\Role::findOrCreate('syndic', 'web');
    $syndic->assignRole('syndic');
    $syndic->givePermissionTo(\App\Support\SpecPermissions::all());

    return $syndic->fresh();
}

it('exposes settings with defaults and updates known keys only', function () {
    $syndic = syndicWith();

    $index = $this->actingAs($syndic)->getJson('/api/syndic/settings')->assertStatus(200);
    expect(collect($index->json('data'))->pluck('value', 'key')['quitus_validity_days'])->toBe(30);

    $this->actingAs($syndic)->putJson('/api/syndic/settings', [
        'settings' => ['quitus_validity_days' => 45, 'lawyer_after_months' => 10],
    ])->assertStatus(200)
        ->assertJsonPath('data.quitus_validity_days', 45);

    $this->actingAs($syndic)->putJson('/api/syndic/settings', [
        'settings' => ['unknown_key' => 1],
    ])->assertStatus(422);
});

it('lists system document types and lets syndic add custom ones', function () {
    $syndic = syndicWith();

    $index = $this->actingAs($syndic)->getJson('/api/syndic/document-types')->assertStatus(200);
    expect($index->json('data.meta.total') ?? count($index->json('data')))->toBeGreaterThan(10);

    $created = $this->actingAs($syndic)->postJson('/api/syndic/document-types', [
        'label_fr' => 'Attestation de voisinage',
    ])->assertStatus(201);
    expect($created->json('data.code'))->toBe('attestation_de_voisinage')
        ->and($created->json('data.is_system'))->toBeFalse();

    // Type système : modification et suppression refusées.
    $system = DocumentType::where('is_system', true)->first();
    $this->actingAs($syndic)->putJson("/api/syndic/document-types/{$system->id}", ['label_fr' => 'X'])
        ->assertStatus(422);
    $this->actingAs($syndic)->deleteJson("/api/syndic/document-types/{$system->id}")
        ->assertStatus(422);
});

it('uploads, lists, downloads and deletes residence documents', function () {
    Storage::fake('local');
    $syndic = syndicWith();
    $residence = residenceFor($syndic);
    $type = DocumentType::where('code', 'regulation')->first()->code;

    $file = UploadedFile::fake()->create('reglement.pdf', 120, 'application/pdf');
    $stored = $this->actingAs($syndic)->postJson('/api/syndic/documents', [
        'residence_id' => $residence->id,
        'type' => $type,
        'title' => 'Règlement intérieur',
        'file' => $file,
    ])->assertStatus(201);
    expect($stored->json('data.number'))->toStartWith('DOC-')
        ->and($stored->json('data.source'))->toBe('uploaded');

    // Type inconnu refusé.
    $this->actingAs($syndic)->postJson('/api/syndic/documents', [
        'residence_id' => $residence->id,
        'type' => 'nope',
        'file' => UploadedFile::fake()->create('x.pdf', 10, 'application/pdf'),
    ])->assertStatus(422);

    $list = $this->actingAs($syndic)->getJson("/api/syndic/documents?residence_id={$residence->id}")
        ->assertStatus(200);
    expect($list->json('meta.total'))->toBe(1);

    $id = $stored->json('data.id');
    $this->actingAs($syndic)->get("/api/syndic/documents/{$id}/download")->assertStatus(200);

    // Document verrouillé : suppression refusée.
    Document::where('id', $id)->update(['is_locked' => true]);
    $this->actingAs($syndic)->deleteJson("/api/syndic/documents/{$id}")->assertStatus(422);

    Document::where('id', $id)->update(['is_locked' => false]);
    $this->actingAs($syndic)->deleteJson("/api/syndic/documents/{$id}")->assertStatus(200);
});

it('lets syndic create assistants with scoped privileges', function () {
    $syndic = syndicManager();
    $residence = residenceFor($syndic);

    $created = $this->actingAs($syndic)->postJson('/api/syndic/staff', [
        'name' => 'Sara Assist',
        'email' => 'sara@example.com',
        'username' => 'sara.assist',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'assistant',
        'residences' => [$residence->id],
        'permissions' => ['lots.view', 'owners.view'],
    ])->assertStatus(201);

    $assistant = User::find($created->json('data.id'));
    expect($assistant->hasRole('assistant'))->toBeTrue()
        ->and($assistant->can('lots.view'))->toBeTrue()
        ->and($assistant->can('payments.validate'))->toBeFalse();

    // Permission non détenue / hors périmètre refusées.
    $other = targetResidence();
    $this->actingAs($syndic)->postJson('/api/syndic/staff', [
        'name' => 'Hors', 'email' => 'hors@example.com', 'username' => 'hors.scope',
        'password' => 'password123', 'password_confirmation' => 'password123',
        'role' => 'assistant', 'residences' => [$other->id], 'permissions' => [],
    ])->assertStatus(422);

    // Un assistant ne gère pas le staff.
    $this->actingAs($assistant)->getJson('/api/syndic/staff')->assertStatus(403);
    $this->actingAs($assistant)->postJson('/api/syndic/staff', [
        'name' => 'Nope', 'email' => 'nope@example.com', 'username' => 'nope.x',
        'password' => 'password123', 'password_confirmation' => 'password123',
        'role' => 'assistant',
    ])->assertStatus(403);

    // Mise à jour des privilèges + désactivation.
    $this->actingAs($syndic)->putJson("/api/syndic/staff/{$assistant->id}", [
        'permissions' => ['lots.view', 'owners.view', 'owners.create'],
    ])->assertStatus(200);
    expect($assistant->fresh()->can('owners.create'))->toBeTrue();

    $this->actingAs($syndic)->putJson("/api/syndic/staff/{$assistant->id}/toggle-actif")
        ->assertStatus(200)
        ->assertJsonPath('data.is_active', false);
});
