<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\ActivationController;
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
use App\Http\Controllers\Syndic\LotImportController;
use App\Http\Controllers\Syndic\DashboardController as SyndicDashboardController;
use App\Http\Controllers\Coproprietaires\ReclamationController as CoproReclamationController;
use App\Http\Controllers\Coproprietaires\DashboardController;
use App\Http\Controllers\Coproprietaires\AppartementController as CoproAppartementController;
use App\Http\Controllers\Coproprietaires\CotisationController as CoproCotisationController;
use App\Http\Controllers\Coproprietaires\PaiementController as CoproPaiementController;
use App\Http\Controllers\Syndic\PaiementController as SyndicPaiementController;
use App\Http\Controllers\Public\ContactController;
use App\Http\Controllers\Public\DemoRequestController;
use App\Http\Controllers\Public\SiteConfigController;
use Illuminate\Support\Facades\Route;

Route::prefix('public')->group(function () {
    Route::get('site-config', SiteConfigController::class)->name('public.site-config');
    Route::post('contact', [ContactController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('public.contact.store');
    Route::post('demo', [DemoRequestController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('public.demo.store');
});

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1')
        ->name('auth.login');

    Route::post('logout', [AuthController::class, 'logout'])
        ->middleware('auth:sanctum')
        ->name('auth.logout');

    Route::post('activate/{token}', [ActivationController::class, 'activate'])
        ->middleware('throttle:5,1')
        ->name('auth.activate');

    Route::get('me', [AuthController::class, 'me'])
        ->middleware('auth:sanctum')
        ->name('auth.me');
});

Route::prefix('portal')->group(function () {
    Route::post('phone/send', [\App\Http\Controllers\Public\AccessRequestController::class, 'sendCode'])
        ->middleware('throttle:5,1')
        ->name('portal.phone.send');
    Route::post('phone/verify', [\App\Http\Controllers\Public\AccessRequestController::class, 'verifyCode'])
        ->middleware('throttle:10,1')
        ->name('portal.phone.verify');
    Route::post('request-access', [\App\Http\Controllers\Public\AccessRequestController::class, 'submit'])
        ->middleware('throttle:5,1')
        ->name('portal.request-access');
});

Route::prefix('syndic')
    ->middleware(['auth:sanctum', 'role:syndic,assistant,super_admin'])
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

        Route::post('residences/{residence}/lots/import/preview', [LotImportController::class, 'preview'])
            ->name('syndic.lots.import.preview')
            ->middleware('throttle:20,1');
        Route::post('residences/{residence}/lots/import/commit', [LotImportController::class, 'commit'])
            ->name('syndic.lots.import.commit')
            ->middleware('throttle:20,1');

        Route::get('access-requests', [\App\Http\Controllers\Syndic\AccessRequestController::class, 'index'])
            ->name('syndic.access-requests.index');
        Route::get('access-requests/{accountRequest}', [\App\Http\Controllers\Syndic\AccessRequestController::class, 'show'])
            ->name('syndic.access-requests.show');
        Route::post('access-requests/{accountRequest}/review', [\App\Http\Controllers\Syndic\AccessRequestController::class, 'review'])
            ->name('syndic.access-requests.review');

        Route::get('owners', [\App\Http\Controllers\Syndic\OwnerController::class, 'index'])
            ->name('syndic.owners.index');
        Route::post('owners', [\App\Http\Controllers\Syndic\OwnerController::class, 'store'])
            ->name('syndic.owners.store');
        Route::get('owners/{owner}', [\App\Http\Controllers\Syndic\OwnerController::class, 'show'])
            ->name('syndic.owners.show');
        Route::put('owners/{owner}', [\App\Http\Controllers\Syndic\OwnerController::class, 'update'])
            ->name('syndic.owners.update');
        Route::delete('owners/{owner}', [\App\Http\Controllers\Syndic\OwnerController::class, 'destroy'])
            ->name('syndic.owners.destroy');

        Route::get('lots', [\App\Http\Controllers\Syndic\LotController::class, 'index'])
            ->name('syndic.lots.index');
        Route::get('lots/{lot}/transfer-data', [\App\Http\Controllers\Syndic\LotTransferController::class, 'wizardData'])
            ->name('syndic.lots.transfer-data');
        Route::post('lots/{lot}/transfer', [\App\Http\Controllers\Syndic\LotTransferController::class, 'run'])
            ->name('syndic.lots.transfer');
        Route::get('lots/{lot}/history', [\App\Http\Controllers\Syndic\LotTransferController::class, 'history'])
            ->name('syndic.lots.history');

        Route::post('quitus', [\App\Http\Controllers\Syndic\QuitusController::class, 'issue'])
            ->name('syndic.quitus.issue');
        Route::post('quitus/{quitus}/cancel', [\App\Http\Controllers\Syndic\QuitusController::class, 'cancel'])
            ->name('syndic.quitus.cancel');

        // Paramètres : réglages généraux
        Route::get('settings', [\App\Http\Controllers\Syndic\SettingsController::class, 'index'])
            ->name('syndic.settings.index');
        Route::put('settings', [\App\Http\Controllers\Syndic\SettingsController::class, 'update'])
            ->name('syndic.settings.update');

        // Paramètres : types de documents (ajout par le syndic)
        Route::get('document-types', [\App\Http\Controllers\Syndic\DocumentTypeController::class, 'index'])
            ->name('syndic.document-types.index');
        Route::post('document-types', [\App\Http\Controllers\Syndic\DocumentTypeController::class, 'store'])
            ->name('syndic.document-types.store');
        Route::put('document-types/{documentType}', [\App\Http\Controllers\Syndic\DocumentTypeController::class, 'update'])
            ->name('syndic.document-types.update');
        Route::delete('document-types/{documentType}', [\App\Http\Controllers\Syndic\DocumentTypeController::class, 'destroy'])
            ->name('syndic.document-types.destroy');

        // Paramètres : documents par résidence (téléversement)
        Route::get('documents', [\App\Http\Controllers\Syndic\DocumentController::class, 'index'])
            ->name('syndic.documents.index');
        Route::post('documents', [\App\Http\Controllers\Syndic\DocumentController::class, 'store'])
            ->name('syndic.documents.store')
            ->middleware('throttle:20,1');
        Route::get('documents/{document}/download', [\App\Http\Controllers\Syndic\DocumentController::class, 'download'])
            ->name('syndic.documents.download');
        Route::delete('documents/{document}', [\App\Http\Controllers\Syndic\DocumentController::class, 'destroy'])
            ->name('syndic.documents.destroy');

        // Paramètres : comptes assistants + matrice de privilèges
        Route::get('staff/permissions', [\App\Http\Controllers\Syndic\StaffController::class, 'permissions'])
            ->name('syndic.staff.permissions');
        Route::get('staff', [\App\Http\Controllers\Syndic\StaffController::class, 'index'])
            ->name('syndic.staff.index');
        Route::post('staff', [\App\Http\Controllers\Syndic\StaffController::class, 'store'])
            ->name('syndic.staff.store');
        Route::put('staff/{staff}', [\App\Http\Controllers\Syndic\StaffController::class, 'update'])
            ->name('syndic.staff.update');
        Route::put('staff/{staff}/toggle-actif', [\App\Http\Controllers\Syndic\StaffController::class, 'toggleActif'])
            ->name('syndic.staff.toggle-actif');
        Route::delete('staff/{staff}', [\App\Http\Controllers\Syndic\StaffController::class, 'destroy'])
            ->name('syndic.staff.destroy');

        // Juridique / recouvrement
        Route::get('legal/overview', [\App\Http\Controllers\Syndic\LegalController::class, 'overview'])
            ->name('syndic.legal.overview');
        Route::get('legal/transfers-without-quitus', [\App\Http\Controllers\Syndic\LegalController::class, 'transfersWithoutQuitus'])
            ->name('syndic.legal.transfers-without-quitus');
        Route::get('legal/lawyer-cases', [\App\Http\Controllers\Syndic\LegalController::class, 'lawyerCases'])
            ->name('syndic.legal.lawyer-cases');
        Route::post('legal/lawyer-cases', [\App\Http\Controllers\Syndic\LegalController::class, 'storeLawyerCase'])
            ->name('syndic.legal.lawyer-cases.store');
        Route::put('legal/lawyer-cases/{lawyerCase}/status', [\App\Http\Controllers\Syndic\LegalController::class, 'updateLawyerCaseStatus'])
            ->name('syndic.legal.lawyer-cases.status');

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
            ->middleware('signed')
            ->name('syndic.paiements.download-recu');
        Route::get('residences/{residence}/paiements/total-percu', [PaiementController::class, 'totalPercu'])
            ->name('syndic.paiements.total-percu');

        Route::get('residences/{residence}/reclamations', [ReclamationController::class, 'index'])
            ->name('syndic.reclamations.index');
        Route::get('reclamations/{reclamation}', [ReclamationController::class, 'show'])
            ->name('syndic.reclamations.show');
        Route::put('reclamations/{reclamation}/statut', [ReclamationController::class, 'updateStatut'])
            ->name('syndic.reclamations.update-statut');

        Route::get('residences/{residence}/dashboard', [SyndicDashboardController::class, 'index'])
            ->name('syndic.dashboard');

        // Rapports
        Route::prefix('residences/{residence}/rapports')->middleware('throttle:30,1')->group(function () {
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