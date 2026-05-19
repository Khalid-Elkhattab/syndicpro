<?php

use App\Enums\CotisationDetailStatut;
use App\Models\Cotisation;
use Illuminate\Database\Eloquent\Collection;

beforeEach(function () {
    $this->service = app(\App\Services\CotisationService::class);
});

it('egale: each appartement gets same amount', function () {
    $cotisation = new Cotisation();
    $cotisation->montant_total = 10000;

    $appartements = new Collection([
        (object) ['id' => 1, 'coproprietaire_id' => 1, 'tantieme' => 120],
        (object) ['id' => 2, 'coproprietaire_id' => 2, 'tantieme' => 80],
    ]);

    $result = $this->service->calculerRepartitionEgale($cotisation, $appartements);

    expect($result)->toHaveCount(2);
    expect((float) $result[0]['montant'])->toBe(5000.0);
    expect((float) $result[1]['montant'])->toBe(5000.0);
});

it('tantieme: amount proportional to tantieme fraction', function () {
    $cotisation = new Cotisation();
    $cotisation->montant_total = 12000;

    $appartements = new Collection([
        (object) ['id' => 1, 'coproprietaire_id' => 1, 'tantieme' => 80],
        (object) ['id' => 2, 'coproprietaire_id' => 2, 'tantieme' => 920],
    ]);

    $result = $this->service->calculerRepartitionParTantieme($cotisation, $appartements);

    expect($result)->toHaveCount(2);
    expect((float) $result[0]['montant'])->toBe(960.0);
    expect((float) $result[1]['montant'])->toBe(11040.0);
});

it('tantieme: throws when total tantiemes is zero', function () {
    $cotisation = new Cotisation();
    $cotisation->montant_total = 12000;

    $appartements = new Collection([
        (object) ['id' => 1, 'coproprietaire_id' => 1, 'tantieme' => 0],
    ]);

    expect(fn () => $this->service->calculerRepartitionParTantieme($cotisation, $appartements))
        ->toThrow(\LogicException::class);
});

it('par_appartement: uses provided montants_map', function () {
    $cotisation = new Cotisation();
    $cotisation->montant_total = 5000;

    $appartements = new Collection([
        (object) ['id' => 1, 'coproprietaire_id' => 1, 'tantieme' => 120],
        (object) ['id' => 2, 'coproprietaire_id' => 2, 'tantieme' => 80],
    ]);
    $montantsMap = [1 => 3000, 2 => 2000];

    $result = $this->service->calculerRepartitionParAppartement($cotisation, $appartements, $montantsMap);

    expect($result)->toHaveCount(2);
    expect((float) $result[0]['montant'])->toBe(3000.0);
    expect((float) $result[1]['montant'])->toBe(2000.0);
});

it('generateDetails returns correct count of details', function () {
    $appartements = new Collection([
        (object) ['id' => 1, 'coproprietaire_id' => 1, 'tantieme' => 120],
        (object) ['id' => 2, 'coproprietaire_id' => 2, 'tantieme' => 80],
    ]);

    $details = $appartements->map(fn ($a) => [
        'cotisation_id' => 1,
        'appartement_id' => $a->id,
        'coproprietaire_id' => $a->coproprietaire_id,
        'montant' => 5000,
        'statut' => CotisationDetailStatut::NonPaye,
        'montant_paye' => 0,
    ]);

    expect($details)->toHaveCount(2);
});
