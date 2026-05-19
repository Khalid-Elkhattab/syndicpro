<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Syndic\ResidenceController;
use App\Http\Controllers\Syndic\ImmeubleController;
use App\Http\Controllers\Syndic\AppartementController;
use App\Http\Controllers\Syndic\CoproprietaireController;
use App\Http\Controllers\Syndic\CompteChargeController;
use App\Http\Controllers\Syndic\SousChargeController;
use App\Http\Controllers\Syndic\DepenseController;
use App\Http\Controllers\Syndic\HorsBudgetController;
use App\Http\Controllers\Syndic\PeriodeController;
use App\Http\Controllers\Syndic\BudgetPrevisionnelController;
use App\Http\Controllers\Syndic\CotisationController;
use App\Http\Controllers\Syndic\PaiementController;
use App\Http\Controllers\Syndic\ReclamationController;
use App\Http\Controllers\Syndic\RapportController;
use App\Http\Controllers\Coproprietaires\ReclamationController as CoproReclamationController;
use App\Http\Controllers\Coproprietaires\DashboardController;
use App\Http\Controllers\Coproprietaires\AppartementController as CoproAppartementController;
use App\Http\Controllers\Coproprietaires\CotisationController as CoproCotisationController;
use App\Http\Controllers\Coproprietaires\PaiementController as CoproPaiementController;
use App\Http\Controllers\Syndic\PaiementController as SyndicPaiementController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1')
        ->name('auth.login');

    Route::post('logout', [AuthController::class, 'logout'])
        ->middleware('auth:sanctum')
        ->name('auth.logout');

    Route::get('me', [AuthController::class, 'me'])
        ->middleware('auth:sanctum')
        ->name('auth.me');
});

Route::prefix('syndic')
    ->middleware(['auth:sanctum', 'role:syndic'])
    ->group(function () {

        Route::apiResource('residences', ResidenceController::class)
            ->names('syndic.residences');

        Route::apiResource('residences.immeubles', ImmeubleController::class)
            ->shallow()
            ->names('syndic.immeubles');

        Route::apiResource('residences.appartements', AppartementController::class)
            ->shallow()
            ->names('syndic.appartements');

        Route::put('appartements/{appartement}/assigner', [AppartementController::class, 'assigner'])
            ->name('syndic.appartements.assigner');

        Route::apiResource('coproprietaires', CoproprietaireController::class)
            ->names('syndic.coproprietaires');

        Route::post('coproprietaires/{coproprietaire}/reset-password', [CoproprietaireController::class, 'resetPassword'])
            ->name('syndic.coproprietaires.reset-password');

        Route::put('coproprietaires/{coproprietaire}/toggle-actif', [CoproprietaireController::class, 'toggleActif'])
            ->name('syndic.coproprietaires.toggle-actif');

        Route::apiResource('residences.comptes-charges', CompteChargeController::class)
            ->shallow()
            ->names('syndic.comptes-charges');

        Route::apiResource('comptes-charges.sous-charges', SousChargeController::class)
            ->shallow()
            ->only(['index', 'store', 'show', 'update', 'destroy'])
            ->names('syndic.sous-charges');

        Route::get('residences/{residence}/sous-charges', [SousChargeController::class, 'indexByResidence'])
            ->name('syndic.sous-charges.by-residence');

        Route::middleware('throttle:20,1')->group(function () {
            Route::apiResource('residences.depenses', DepenseController::class)
                ->shallow()
                ->names('syndic.depenses');

            Route::get('depenses/{depense}/justificatif', [DepenseController::class, 'justificatif'])
                ->name('syndic.depenses.justificatif');

            Route::apiResource('residences.hors-budgets', HorsBudgetController::class)
                ->shallow()
                ->names('syndic.hors-budgets');

            Route::get('hors-budgets/{hors_budget}/justificatif', [HorsBudgetController::class, 'justificatif'])
                ->name('syndic.hors-budgets.justificatif');
        });

        Route::apiResource('residences.periodes', PeriodeController::class)
            ->shallow()
            ->names('syndic.periodes');

        Route::get('periodes/{periode}/budgets', [BudgetPrevisionnelController::class, 'summary'])
            ->name('syndic.budgets.summary');
        Route::post('periodes/{periode}/budgets', [BudgetPrevisionnelController::class, 'store'])
            ->name('syndic.budgets.store');
        Route::put('budgets/{budget}', [BudgetPrevisionnelController::class, 'update'])
            ->name('syndic.budgets.update');

        Route::get('residences/{residence}/cotisations', [CotisationController::class, 'index'])
            ->name('syndic.cotisations.index');
        Route::post('residences/{residence}/cotisations/fixe', [CotisationController::class, 'storeFixe'])
            ->name('syndic.cotisations.store-fixe')
            ->middleware('throttle:20,1');
        Route::post('residences/{residence}/cotisations/exceptionnelle', [CotisationController::class, 'storeExceptionnelle'])
            ->name('syndic.cotisations.store-exceptionnelle')
            ->middleware('throttle:20,1');
        Route::get('cotisations/{cotisation}/details', [CotisationController::class, 'details'])
            ->name('syndic.cotisations.details');
        Route::get('residences/{residence}/cotisations/previsualiser', [CotisationController::class, 'previsualiser'])
            ->name('syndic.cotisations.previsualiser');
        Route::get('residences/{residence}/cotisations/total', [CotisationController::class, 'total'])
            ->name('syndic.cotisations.total');
        Route::get('residences/{residence}/impayes', [CotisationController::class, 'impayes'])
            ->name('syndic.cotisations.impayes');

        Route::get('residences/{residence}/paiements', [PaiementController::class, 'index'])
            ->name('syndic.paiements.index');
        Route::post('paiements', [PaiementController::class, 'store'])
            ->name('syndic.paiements.store')
            ->middleware('throttle:20,1');
        Route::get('paiements/{paiement}/recu', [PaiementController::class, 'recu'])
            ->name('syndic.paiements.recu');
        Route::get('paiements/{paiement}/download-recu', [PaiementController::class, 'downloadRecu'])
            ->name('syndic.paiements.download-recu');
        Route::get('residences/{residence}/paiements/total-percu', [PaiementController::class, 'totalPercu'])
            ->name('syndic.paiements.total-percu');

        Route::get('residences/{residence}/reclamations', [ReclamationController::class, 'index'])
            ->name('syndic.reclamations.index');
        Route::get('reclamations/{reclamation}', [ReclamationController::class, 'show'])
            ->name('syndic.reclamations.show');
        Route::put('reclamations/{reclamation}/statut', [ReclamationController::class, 'updateStatut'])
            ->name('syndic.reclamations.update-statut');

        // Rapports
        Route::prefix('residences/{residence}/rapports')->group(function () {
            Route::get('budget', [RapportController::class, 'budget'])
                ->name('syndic.rapports.budget');
            Route::get('impayes', [RapportController::class, 'impayes'])
                ->name('syndic.rapports.impayes');
            Route::get('paiements', [RapportController::class, 'paiements'])
                ->name('syndic.rapports.paiements');
        });
    });

/*
    |----------------------------------------------------------------------
    | Copropriétaire Routes
    |----------------------------------------------------------------------
    */
    Route::prefix('coproprietaires')
        ->middleware(['auth:sanctum', 'role:coproprietaire'])
        ->group(function () {
            // Dashboard
            Route::get('dashboard', [DashboardController::class, 'index'])
                ->name('copro.dashboard');

            // Appartements
            Route::get('appartements', [CoproAppartementController::class, 'index'])
                ->name('copro.appartements.index');

            // Cotisations
            Route::get('cotisations', [CoproCotisationController::class, 'index'])
                ->name('copro.cotisations.index');
            Route::get('cotisations/{cotisationDetail}', [CoproCotisationController::class, 'show'])
                ->name('copro.cotisations.show');

            // Paiements
            Route::get('paiements', [CoproPaiementController::class, 'index'])
                ->name('copro.paiements.index');
            Route::get('paiements/{paiement}/recu', [CoproPaiementController::class, 'recu'])
                ->name('copro.paiements.recu');
            Route::get('paiements/{paiement}/download-recu', [CoproPaiementController::class, 'downloadRecu'])
                ->middleware('signed')
                ->name('copro.paiements.recu.download');

            // Réclamations
            Route::get('reclamations', [CoproReclamationController::class, 'index'])
                ->name('copro.reclamations.index');
            Route::post('reclamations', [CoproReclamationController::class, 'store'])
                ->name('copro.reclamations.store');
            Route::get('reclamations/{reclamation}', [CoproReclamationController::class, 'show'])
                ->name('copro.reclamations.show');
        });