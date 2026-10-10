<?php

use App\Enums\DueStatus;
use App\Models\Due;
use App\Models\Owner;
use App\Models\Payment;
use App\Models\User;
use App\Services\PaymentIntakeService;

function intakeOwner(bool $withDues = true): array
{
    $residence = targetResidence();
    $lot = targetLot($residence);
    $owner = Owner::factory()->create();
    ownLot($lot, $owner);
    if ($withDues) {
        situationDues($owner, $lot, [1400.0, 1200.0]);
    }

    return [$residence, $lot, $owner];
}

it('records 2000 over 1400 + 1200 with ENC and PAY numbers', function () {
    [$residence, $lot, $owner] = intakeOwner();
    $syndic = User::factory()->syndic()->create();

    $result = app(PaymentIntakeService::class)->record([
        'residence_id' => $residence->id,
        'owner_id' => $owner->id,
        'amount' => 2000.0,
        'paid_on' => today()->toDateString(),
        'method' => 'cash',
    ], $syndic);

    /** @var Payment $payment */
    $payment = $result['payment'];
    expect($payment->status->value)->toBe('validated');
    expect($payment->receipt_number)->toStartWith('ENC-');
    expect($payment->allocation_receipt_number)->toStartWith('PAY-');
    expect($result['credit'])->toBe(0.0);
    expect($result['remaining_after'])->toBe(600.0);
    expect($result['lines'])->toHaveCount(2);
    expect($result['lines'][0]['applied'])->toBe(1400.0);
    expect($result['lines'][0]['open_after'])->toBe(0.0);
    expect($result['lines'][1]['applied'])->toBe(600.0);
    expect($result['lines'][1]['open_after'])->toBe(600.0);

    $statuses = Due::where('lot_id', $lot->id)->orderBy('period_start')->pluck('status')->all();
    expect($statuses[0])->toBe(DueStatus::Paid);
    expect($statuses[1])->toBe(DueStatus::Partial);
});

it('keeps overpayment as credit', function () {
    [$residence, $lot, $owner] = intakeOwner();
    $syndic = User::factory()->syndic()->create();

    $result = app(PaymentIntakeService::class)->record([
        'residence_id' => $residence->id,
        'owner_id' => $owner->id,
        'amount' => 3000.0,
        'paid_on' => today()->toDateString(),
        'method' => 'transfer',
        'document_number' => 'VIR-001',
    ], $syndic);

    expect($result['credit'])->toBe(400.0);
    expect($result['remaining_after'])->toBe(0.0);
    expect(Due::where('lot_id', $lot->id)->where('status', 'paid')->count())->toBe(2);
});

it('preview writes nothing', function () {
    [$residence, $lot, $owner] = intakeOwner();

    $preview = app(PaymentIntakeService::class)->preview($owner->id, $residence->id, 2000.0);

    expect($preview['applied'])->toBe(2000.0);
    expect($preview['remaining_after'])->toBe(600.0);
    expect($preview['lines'])->toHaveCount(2);
    expect(Payment::count())->toBe(0);
    expect((float) Due::where('lot_id', $lot->id)->sum('amount_paid'))->toBe(0.0);
});

it('cancel restores dues', function () {
    [$residence, $lot, $owner] = intakeOwner();
    $syndic = User::factory()->syndic()->create();
    $result = app(PaymentIntakeService::class)->record([
        'residence_id' => $residence->id,
        'owner_id' => $owner->id,
        'amount' => 2000.0,
        'paid_on' => today()->toDateString(),
        'method' => 'cash',
    ], $syndic);

    app(PaymentIntakeService::class)->cancel($result['payment'], 'Erreur de saisie', $syndic);

    expect($result['payment']->fresh()->status->value)->toBe('cancelled');
    expect((float) Due::where('lot_id', $lot->id)->sum('amount_paid'))->toBe(0.0);
    expect(Due::where('lot_id', $lot->id)->where('status', 'unpaid')->count())->toBe(2);
});

it('refuses a payment for an owner without lot in the residence', function () {
    $residence = targetResidence();
    $other = targetResidence();
    $owner = Owner::factory()->create();
    ownLot(targetLot($other), $owner);
    $syndic = User::factory()->syndic()->create();

    expect(fn () => app(PaymentIntakeService::class)->record([
        'residence_id' => $residence->id,
        'owner_id' => $owner->id,
        'amount' => 100.0,
        'paid_on' => today()->toDateString(),
        'method' => 'cash',
    ], $syndic))->toThrow(LogicException::class);
});

it('exposes the full HTTP flow including PDFs', function () {
    [$residence, $lot, $owner] = intakeOwner();
    $syndic = User::factory()->syndic()->create();

    $preview = $this->actingAs($syndic)->postJson('/api/syndic/payments/preview', [
        'residence_id' => $residence->id, 'owner_id' => $owner->id, 'amount' => 2000,
    ])->assertStatus(200);
    expect((float) $preview->json('data.remaining_after'))->toBe(600.0);

    $stored = $this->actingAs($syndic)->postJson('/api/syndic/payments', [
        'residence_id' => $residence->id,
        'owner_id' => $owner->id,
        'amount' => 2000,
        'paid_on' => today()->toDateString(),
        'method' => 'cash',
    ])->assertStatus(201);
    $id = $stored->json('data.payment.id');
    expect($stored->json('data.receipts.encaissement_number'))->toStartWith('ENC-');
    expect($stored->json('data.receipts.imputation_number'))->toStartWith('PAY-');

    $this->actingAs($syndic)->get($stored->json('data.receipts.encaissement_url'))
        ->assertStatus(200)->assertHeader('Content-Type', 'application/pdf');
    $this->actingAs($syndic)->get($stored->json('data.receipts.imputation_url'))
        ->assertStatus(200)->assertHeader('Content-Type', 'application/pdf');

    // Chèque sans numéro de pièce : 422.
    $this->actingAs($syndic)->postJson('/api/syndic/payments', [
        'residence_id' => $residence->id,
        'owner_id' => $owner->id,
        'amount' => 100,
        'paid_on' => today()->toDateString(),
        'method' => 'cheque',
    ])->assertStatus(422);

    $this->actingAs($syndic)->postJson("/api/syndic/payments/{$id}/cancel", [
        'cancellation_reason' => 'Doublon',
    ])->assertStatus(200);
    expect(Due::where('lot_id', $lot->id)->where('status', 'unpaid')->count())->toBe(2);
});
