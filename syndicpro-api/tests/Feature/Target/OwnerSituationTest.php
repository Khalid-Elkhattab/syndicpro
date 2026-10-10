<?php

use App\Enums\PaymentStatus;
use App\Models\Due;
use App\Models\Owner;
use App\Models\Payment;
use App\Models\Residence;
use App\Services\AllocationService;
use App\Services\OwnerSituationService;
use Illuminate\Support\Str;

function situationPayment(Residence $residence, Owner $owner, float $amount): Payment
{
    $payment = Payment::create([
        'residence_id' => $residence->id, 'owner_id' => $owner->id,
        'paid_on' => today(), 'method' => 'cash', 'amount' => $amount,
        'allocation_mode' => 'auto', 'status' => PaymentStatus::Validated->value,
        'source' => 'back_office', 'verification_token' => Str::uuid(),
    ]);
    app(AllocationService::class)->allocate($payment->fresh());

    return $payment->fresh();
}

it('splits 2000 over 1400 + 1200 leaving 600 remaining', function () {
    $residence = targetResidence();
    $lot = targetLot($residence);
    $owner = Owner::factory()->create();
    ownLot($lot, $owner);
    situationDues($owner, $lot, [1400.0, 1200.0]);

    situationPayment($residence, $owner, 2000.0);
    $s = OwnerSituationService::forOwner($owner->id);

    expect($s['total_due'])->toBe(2600.0);
    expect($s['total_paid'])->toBe(2000.0);
    expect($s['remaining'])->toBe(600.0);
    expect($s['oldest_unpaid'])->toBe('2024-02-01');
    expect($s['per_lot'][0]['lot_number'])->toBe($lot->number);
    expect($s['per_lot'][0]['residence_id'])->toBe($residence->id);
    expect($s['per_lot'][0]['remaining'])->toBe(600.0);
});

it('returns null oldest_unpaid when everything is paid', function () {
    $residence = targetResidence();
    $lot = targetLot($residence);
    $owner = Owner::factory()->create();
    ownLot($lot, $owner);
    situationDues($owner, $lot, [500.0, 500.0]);

    situationPayment($residence, $owner, 1000.0);
    $s = OwnerSituationService::forOwner($owner->id);

    expect($s['remaining'])->toBe(0.0);
    expect($s['oldest_unpaid'])->toBeNull();
});

it('excludes the other party dues after a transfer', function () {
    $residence = targetResidence();
    $lot = targetLot($residence);
    $seller = Owner::factory()->create();
    $buyer = Owner::factory()->create();
    ownLot($lot, $seller);
    ownLot($lot, $buyer, ['started_on' => '2024-02-01']);
    // Vendeur : 2 dus, puis transfert : le 2e du est reattribue a l'acheteur.
    situationDues($seller, $lot, [400.0, 400.0]);
    Due::where('lot_id', $lot->id)->whereDate('period_start', '>=', '2024-02-01')
        ->update(['owner_id' => $buyer->id]);

    $forSeller = OwnerSituationService::forOwner($seller->id);
    $forBuyer = OwnerSituationService::forOwner($buyer->id);

    expect($forSeller['total_due'])->toBe(400.0);
    expect($forBuyer['total_due'])->toBe(400.0);
    expect($forSeller['per_lot'])->toHaveCount(1);
    expect($forBuyer['per_lot'])->toHaveCount(1);
});

it('ignores cancelled dues', function () {
    $residence = targetResidence();
    $lot = targetLot($residence);
    $owner = Owner::factory()->create();
    ownLot($lot, $owner);
    situationDues($owner, $lot, [300.0, 300.0]);
    Due::where('lot_id', $lot->id)->whereDate('period_start', '2024-02-01')->update(['status' => 'cancelled']);

    $s = OwnerSituationService::forOwner($owner->id);

    expect($s['total_due'])->toBe(300.0);
});
