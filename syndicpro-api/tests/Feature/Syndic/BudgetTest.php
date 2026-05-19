<?php

use App\Models\BudgetPrevisionnel;

it('budget restant equals prevu minus consomme', function () {
    $budget = BudgetPrevisionnel::factory()->make([
        'montant_prevu' => 10000,
        'montant_consomme' => 3000,
    ]);

    expect((float) $budget->montant_restant)->toBe(7000.0);
});

it('detects budget depassement correctly', function () {
    $budget = BudgetPrevisionnel::factory()->make([
        'montant_prevu' => 10000,
        'montant_consomme' => 12000,
    ]);

    expect($budget->est_depasse)->toBeTrue();
});

it('detects no depassement when under prevu', function () {
    $budget = BudgetPrevisionnel::factory()->make([
        'montant_prevu' => 10000,
        'montant_consomme' => 5000,
    ]);

    expect($budget->est_depasse)->toBeFalse();
});
