<?php

use App\Enums\AccountStatus;
use App\Enums\CotisationDetailStatut;
use App\Enums\DueStatus;
use App\Enums\LotType;
use App\Enums\ModePaiement;
use App\Enums\PaymentMethod;
use App\Enums\ReclamationStatut;
use App\Enums\UserRole;
use App\Enums\UserType;

it('exposes french labels natively regardless of app locale', function () {
    app()->setLocale('en');

    expect(LotType::Shop->label())->toBe('Magasin / Commerce')
        ->and(UserRole::Coproprietaire->label())->toBe('Copropriétaire')
        ->and(ReclamationStatut::EnCours->label())->toBe('En cours')
        ->and(ModePaiement::Cheque->label())->toBe('Chèque')
        ->and(CotisationDetailStatut::NonPaye->label())->toBe('Non payé')
        ->and(UserType::Owner->label())->toBe('Copropriétaire')
        ->and(AccountStatus::PendingActivation->label())->toBe('En attente d’activation')
        ->and(DueStatus::Partial->label())->toBe('Partiel');
});

it('resolves arabic labels when locale is ar', function () {
    app()->setLocale('ar');
    try {
        expect(LotType::Shop->label())->toBe('محل تجاري')
            ->and(DueStatus::Paid->label())->toBe('مؤدى');
    } finally {
        app()->setLocale('en');
    }
});

it('offers value+label options for frontend selects', function () {
    $options = LotType::options();

    expect($options)->toHaveCount(8)
        ->and($options[0])->toHaveKeys(['value', 'label']);
});

it('flags cheque and effet as requiring a document number', function () {
    expect(PaymentMethod::Cheque->requiresDocumentNumber())->toBeTrue()
        ->and(PaymentMethod::Effet->requiresDocumentNumber())->toBeTrue()
        ->and(PaymentMethod::Cash->requiresDocumentNumber())->toBeFalse();
});

it('parses french lot type aliases from csv input', function () {
    expect(LotType::fromInput('magasin'))->toBe(LotType::Shop)
        ->and(LotType::fromInput('Appartement'))->toBe(LotType::Apartment)
        ->and(LotType::fromInput('studio'))->toBe(LotType::Studio)
        ->and(LotType::Studio->label())->toBe('Studio')
        ->and(LotType::fromInput('bureau'))->toBe(LotType::Office)
        ->and(LotType::fromInput('villa'))->toBe(LotType::House)
        ->and(LotType::fromInput('nonsense'))->toBeNull();
});
