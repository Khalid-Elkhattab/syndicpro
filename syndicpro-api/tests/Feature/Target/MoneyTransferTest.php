<?php

use App\Enums\AccountMatchResult;
use App\Enums\OwnershipChangeReason;
use App\Enums\PaymentStatus;
use App\Enums\QuitusStatus;
use App\Models\Building;
use App\Models\Contribution;
use App\Models\ContributionLot;
use App\Models\Due;
use App\Models\Lot;
use App\Models\LotAccountAssignment;
use App\Models\LotOwnership;
use App\Models\LotTransfer;
use App\Models\Owner;
use App\Models\Payment;
use App\Models\Residence;
use App\Models\User;
use App\Services\AccessRequestService;
use App\Services\AllocationService;
use App\Services\DueSettlementService;
use App\Services\LotTransferService;
use App\Services\OwnershipService;
use App\Services\QuitusService;
use Carbon\Carbon;
use Illuminate\Support\Str;

function paidDues(Owner $owner, Lot $lot, int $months = 3, float $monthly = 300.0): void
{
    $residence = $lot->residence;
    $clot = ContributionLot::create([
        'contribution_id' => Contribution::create([
            'residence_id' => $residence->id, 'type' => 'syndic', 'name' => 'T',
            'starts_on' => '2024-01-01', 'ends_on' => '2026-12-31',
            'calculation_mode' => 'tantieme', 'status' => 'draft',
        ])->id,
        'residence_id' => $residence->id, 'lot_id' => $lot->id,
        'annual_amount' => $monthly * 12, 'monthly_amount' => $monthly,
    ]);
    for ($i = 0; $i < $months; $i++) {
        $start = Carbon::parse('2024-01-01')->addMonths($i);
        Due::create([
            'residence_id' => $residence->id, 'contribution_lot_id' => $clot->id,
            'lot_id' => $lot->id, 'owner_id' => $owner->id,
            'period_start' => $start->copy()->startOfMonth(), 'period_end' => $start->copy()->endOfMonth(),
            'days' => $start->daysInMonth, 'amount' => $monthly,
            'due_date' => $start->copy()->endOfMonth(), 'status' => 'unpaid',
        ]);
    }
}

function targetPayment(Residence $residence, Owner $owner, float $amount): Payment
{
    return Payment::create([
        'residence_id' => $residence->id, 'owner_id' => $owner->id,
        'paid_on' => today(), 'method' => 'cash', 'amount' => $amount,
        'allocation_mode' => 'auto', 'status' => PaymentStatus::Validated->value,
        'source' => 'back_office', 'verification_token' => Str::uuid(),
    ]);
}

it('settles oldest dues first and keeps leftover as credit', function () {
    $residence = targetResidence();
    $lot = targetLot($residence);
    $owner = Owner::factory()->create();
    ownLot($lot, $owner);
    paidDues($owner, $lot, 3); // 3 × 300 dus

    $payment = targetPayment($residence, $owner, 700);
    $credit = app(AllocationService::class)->allocate($payment);

    expect($credit)->toBe(0.0);
    $statuses = Due::where('lot_id', $lot->id)->orderBy('period_start')->pluck('status', 'id');
    // 300 paid, 300 paid, 100 partial — le cache est recalculé par le seul service autorisé.
    $paid = Due::where('lot_id', $lot->id)->orderBy('period_start')->get();
    expect((float) $paid[0]->amount_paid)->toBe(300.0);
    expect($paid[0]->status->value)->toBe('paid');
    expect((float) $paid[2]->amount_paid)->toBe(100.0);
    expect($paid[2]->status->value)->toBe('partial');

    // Trop-perçu → crédit.
    $payment2 = targetPayment($residence, $owner, 1000);
    $credit2 = app(AllocationService::class)->allocate($payment2);
    expect($credit2)->toBe(800.0); // 200 pour solder le 3e dû, 800 de crédit
    expect(Due::where('lot_id', $lot->id)->where('status', 'paid')->count())->toBe(3);
});

it('restores dues when allocations stop counting', function () {
    $residence = targetResidence();
    $lot = targetLot($residence);
    $owner = Owner::factory()->create();
    ownLot($lot, $owner);
    paidDues($owner, $lot, 1);

    $payment = targetPayment($residence, $owner, 300);
    app(AllocationService::class)->allocate($payment);
    expect(Due::first()->status->value)->toBe('paid');

    // Annulation : les allocations ne comptent plus → recompute.
    $payment->update(['status' => PaymentStatus::Cancelled->value]);
    DueSettlementService::refreshMany([Due::first()->id]);
    expect(Due::first()->refresh()->status->value)->toBe('unpaid');
});

it('refuses quitus with a balance and issues it at zero', function () {
    $residence = targetResidence();
    $lot = targetLot($residence);
    $owner = Owner::factory()->create();
    ownLot($lot, $owner);
    paidDues($owner, $lot, 1); // 300 exigibles

    expect(fn () => app(QuitusService::class)->issue($residence->id, $owner->id, $lot->id, 'sale'))
        ->toThrow(LogicException::class);

    $payment = targetPayment($residence, $owner, 300);
    app(AllocationService::class)->allocate($payment);

    $quitus = app(QuitusService::class)->issue($residence->id, $owner->id, $lot->id, 'sale');
    expect($quitus->status->value)->toBe('valid');
    expect($quitus->number)->toStartWith('QUIT-');
});

it('blocks transfer without quitus and hands over with quitus', function () {
    $residence = targetResidence();
    $lot = targetLot($residence);
    $seller = Owner::factory()->create();
    ownLot($lot, $seller);
    // Login du lot (un par lot).
    $login = User::factory()->create([
        'username' => 'T-B-A1', 'type' => 'owner', 'status' => 'active',
        'lot_id' => $lot->id, 'current_owner_id' => $seller->id,
    ]);
    LotAccountAssignment::create([
        'user_id' => $login->id, 'lot_id' => $lot->id, 'owner_id' => $seller->id,
        'started_at' => now(),
    ]);
    $buyer = Owner::factory()->create();
    paidDues($seller, $lot, 2);

    // Dû du mois en cours (vendeur) + dû du mois suivant (acheteur après transfert).
    $effective = Carbon::parse('2024-02-01');

    expect(fn () => app(LotTransferService::class)->run(
        $lot, $buyer, $effective, OwnershipChangeReason::Sale, null, null, syndicWith()->id,
    ))->toThrow(LogicException::class);

    // Solde puis quitus puis transfert.
    $payment = targetPayment($residence, $seller, 600);
    app(AllocationService::class)->allocate($payment);
    $quitus = app(QuitusService::class)->issue($residence->id, $seller->id, $lot->id, 'sale');

    $transfer = app(LotTransferService::class)->run(
        $lot, $buyer, $effective, OwnershipChangeReason::Sale, $quitus, null, syndicWith()->id,
    );

    expect($transfer)->toBeInstanceOf(LotTransfer::class);
    expect($quitus->fresh()->status->value)->toBe(QuitusStatus::Used->value);
    // Mois en cours chez le vendeur, mois suivants chez l’acheteur.
    $ordered = Due::where('lot_id', $lot->id)->orderBy('period_start')->get();
    expect((int) $ordered[0]->owner_id)->toBe($seller->id);
    expect((int) $ordered[1]->owner_id)->toBe($buyer->id);
    // Login réinitialisé, jamais supprimé.
    $login->refresh();
    expect($login->isPendingActivation())->toBeTrue();
    expect($login->current_owner_id)->toBe($buyer->id);
    expect(User::where('lot_id', $lot->id)->count())->toBe(1);
});

it('requires the sale contract for a first sale from the promoteur', function () {
    $residence = targetResidence();
    $promoter = Owner::factory()->company()->create();
    $residence->update(['promoter_owner_id' => $promoter->id]);
    $lot = targetLot($residence);
    ownLot($lot, $promoter);
    $login = User::factory()->create([
        'username' => 'T-B-P1', 'type' => 'owner', 'status' => 'active',
        'lot_id' => $lot->id, 'current_owner_id' => $promoter->id,
    ]);
    $buyer = Owner::factory()->create();
    $quitus = app(QuitusService::class)->issue($residence->id, $promoter->id, $lot->id, 'sale');

    expect(fn () => app(LotTransferService::class)->run(
        $lot, $buyer, Carbon::parse('2024-02-01'), OwnershipChangeReason::PromoterSale,
        $quitus, null, syndicWith()->id,
    ))->toThrow(LogicException::class); // contrat manquant
});

it('rejects indivision shares that do not total 100', function () {
    $residence = targetResidence();
    $lot = targetLot($residence);
    $a = Owner::factory()->create();
    $b = Owner::factory()->create();

    expect(fn () => app(OwnershipService::class)->assign($lot->id, [
        ['owner_id' => $a->id, 'share_percent' => 60],
        ['owner_id' => $b->id, 'share_percent' => 30],
    ], '2024-01-01', OwnershipChangeReason::Sale))->toThrow(LogicException::class);

    app(OwnershipService::class)->assign($lot->id, [
        ['owner_id' => $a->id, 'share_percent' => 60, 'is_billing_contact' => true],
        ['owner_id' => $b->id, 'share_percent' => 40],
    ], '2024-01-01', OwnershipChangeReason::Sale);
    expect(LotOwnership::where('lot_id', $lot->id)->whereNull('ended_on')->count())->toBe(2);
});

it('matches access requests: exact, promoter, resale, unknown lot', function () {
    $residence = targetResidence();
    $promoter = Owner::factory()->company()->create();
    $residence->update(['promoter_owner_id' => $promoter->id]);
    $building = Building::factory()->create(['residence_id' => $residence->id, 'number' => 'B']);
    $lot = Lot::factory()->create(['residence_id' => $residence->id, 'building_id' => $building->id, 'number' => 'A12']);
    $owner = Owner::factory()->create(['identity_number' => 'AB12345']);
    ownLot($lot, $owner);

    $svc = app(AccessRequestService::class);
    expect($svc->match($residence->id, 'B', 'A12', 'ab12345')['match_result'])
        ->toBe(AccountMatchResult::Exact->value);
    expect($svc->match($residence->id, 'B', 'A12', 'ZZ999')['match_result'])
        ->toBe(AccountMatchResult::DifferentOwner->value);
    expect($svc->match($residence->id, 'Z', 'A12', 'AB12345')['match_result'])
        ->toBe(AccountMatchResult::LotNotFound->value);

    ownLot($lot, $promoter, ['started_on' => '2025-06-01']);
    LotOwnership::where('lot_id', $lot->id)->where('owner_id', $owner->id)
        ->update(['ended_on' => '2025-05-31']);
    expect($svc->match($residence->id, 'B', 'A12', 'NEW99')['match_result'])
        ->toBe(AccountMatchResult::OwnedByPromoter->value);
});
