<?php

it('calculates montant_restant as prevu minus consomme', function () {
    $budget = new \App\Models\BudgetPrevisionnel();
    $budget->montant_prevu = 10000;
    $budget->montant_consomme = 3000;

    expect((float) $budget->montant_restant)->toBe(7000.0);
});

it('detects depassement when consomme exceeds prevu', function () {
    $budget = new \App\Models\BudgetPrevisionnel();
    $budget->montant_prevu = 10000;
    $budget->montant_consomme = 12000;

    expect($budget->est_depasse)->toBeTrue();
});

it('detects no depassement when consomme is under prevu', function () {
    $budget = new \App\Models\BudgetPrevisionnel();
    $budget->montant_prevu = 10000;
    $budget->montant_consomme = 5000;

    expect($budget->est_depasse)->toBeFalse();
});
