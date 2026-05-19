<?php

use App\Enums\CotisationDetailStatut;

it('montant_restant equals montant minus montant_paye', function () {
    $detail = new \App\Models\CotisationDetail();
    $detail->montant = 500;
    $detail->montant_paye = 200;

    expect((float) $detail->montant_restant)->toBe(300.0);
});

it('cannot pay more than restant', function () {
    $detail = new \App\Models\CotisationDetail();
    $detail->montant = 500;
    $detail->montant_paye = 400;

    $resteAPayer = $detail->montant - $detail->montant_paye;
    expect($resteAPayer)->toBe(100.0);

    expect(fn () => throw new \InvalidArgumentException(
        'Le montant saisi dépasse le restant à payer.'
    ))->toThrow(\InvalidArgumentException::class);
});
