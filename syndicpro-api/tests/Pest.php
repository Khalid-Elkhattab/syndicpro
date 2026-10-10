<?php

use App\Models\Building;
use App\Models\Contribution;
use App\Models\ContributionLot;
use App\Models\Due;
use App\Models\Lot;
use App\Models\LotOwnership;
use App\Models\Owner;
use App\Models\Residence;
use App\Models\User;
use Carbon\Carbon;
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

if (! function_exists('situationDues')) {
    function situationDues(Owner $owner, Lot $lot, array $amounts, string $from = '2024-01-01'): void
    {
        $residence = $lot->residence;
        $clot = ContributionLot::create([
            'contribution_id' => Contribution::create([
                'residence_id' => $residence->id, 'type' => 'syndic', 'name' => 'T',
                'starts_on' => '2024-01-01', 'ends_on' => '2026-12-31',
                'calculation_mode' => 'tantieme', 'status' => 'draft',
            ])->id,
            'residence_id' => $residence->id, 'lot_id' => $lot->id,
            'annual_amount' => array_sum($amounts), 'monthly_amount' => $amounts[0],
        ]);
        foreach ($amounts as $i => $amount) {
            $start = Carbon::parse($from)->addMonths($i);
            Due::create([
                'residence_id' => $residence->id, 'contribution_lot_id' => $clot->id,
                'lot_id' => $lot->id, 'owner_id' => $owner->id,
                'period_start' => $start->copy()->startOfMonth(), 'period_end' => $start->copy()->endOfMonth(),
                'days' => $start->daysInMonth, 'amount' => $amount,
                'due_date' => $start->copy()->endOfMonth(), 'status' => 'unpaid',
            ]);
        }
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
