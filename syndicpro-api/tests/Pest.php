<?php

use App\Models\Building;
use App\Models\Lot;
use App\Models\LotOwnership;
use App\Models\Owner;
use App\Models\Residence;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class)->in('Feature');
uses(TestCase::class)->in('Unit');

function syndicWith(array $attrs = []): User
{
    return User::factory()->syndic()->create($attrs);
}

function coproprietaireWith(array $attrs = []): User
{
    return User::factory()->coproprietaire()->create($attrs);
}

function residenceFor(User $syndic): Residence
{
    return Residence::factory()->create([
        'syndic_id' => $syndic->id,
    ]);
}

// --- Target schema helpers (newplan.md / docs/do) ---
if (! function_exists('targetResidence')) {
    function targetResidence(array $attrs = []): Residence
    {
        return Residence::factory()->create(array_merge([
            'code' => 'T'.strtoupper(Str::random(4)),
            'total_tantiemes' => null,
        ], $attrs));
    }
}

if (! function_exists('targetLot')) {
    function targetLot(Residence $residence, array $attrs = []): Lot
    {
        $building = Building::factory()->create(['residence_id' => $residence->id]);

        return Lot::factory()->create(array_merge([
            'residence_id' => $residence->id,
            'building_id' => $building->id,
        ], $attrs));
    }
}

if (! function_exists('ownLot')) {
    function ownLot(Lot $lot, Owner $owner, array $attrs = []): LotOwnership
    {
        return LotOwnership::create(array_merge([
            'lot_id' => $lot->id,
            'owner_id' => $owner->id,
            'share_percent' => 100,
            'is_billing_contact' => true,
            'started_on' => '2025-01-01',
            'change_reason' => 'initial',
        ], $attrs));
    }
}
