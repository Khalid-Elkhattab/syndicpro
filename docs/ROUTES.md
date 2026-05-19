# ROUTES.md — SyndicPro
## Routes Frontend (React Router v6) + Backend (Laravel api.php)

---

## 1. Routes Frontend — React Router v6

### Structure Générale
```
/                        → Redirect vers /login
/login                   → LoginPage (partagée syndic + copropriétaire)
/syndic/*                → SyndicLayout (ProtectedRoute + RoleGuard role=syndic)
/copropriétaire/*        → CoproprietaireLayout (ProtectedRoute + RoleGuard role=coproprietaire)
```

### `router/index.tsx`
```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/syndic',
    element: (
      <ProtectedRoute>
        <RoleGuard requiredRole="syndic">
          <SyndicLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',       element: <SyndicDashboardPage /> },
      { path: 'residences',      element: <ResidencesPage /> },
      { path: 'immeubles',       element: <ImmeublesPage /> },
      { path: 'appartements',    element: <AppartementsPage /> },
      { path: 'coproprietaires', element: <CoproprietairesPage /> },
      { path: 'budget',          element: <BudgetPage /> },
      { path: 'charges',         element: <ChargesDepensesPage /> },
      { path: 'cotisations',     element: <CotisationsPage /> },
      { path: 'paiements',       element: <PaiementsPage /> },
      { path: 'reclamations',    element: <ReclamationsPage /> },
      { path: 'rapports',        element: <RapportsPage /> },
    ],
  },
  {
    path: '/coproprietaire',
    element: (
      <ProtectedRoute>
        <RoleGuard requiredRole="coproprietaire">
          <CoproprietaireLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',    element: <CoproDashboardPage /> },
      { path: 'cotisations',  element: <MesCotisationsPage /> },
      { path: 'paiements',    element: <MesPaiementsPage /> },
      { path: 'reclamations', element: <MesReclamationsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
```

### Guards
```tsx
// ProtectedRoute : redirige vers /login si non authentifié
const ProtectedRoute = ({ children }) => {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// RoleGuard : redirige vers /login si mauvais rôle
const RoleGuard = ({ requiredRole, children }) => {
  const user = useAuthStore(s => s.user);
  if (user?.role !== requiredRole) return <Navigate to="/login" replace />;
  return children;
};
```

### Post-Login Redirect
```typescript
// Après login réussi dans authStore
if (user.role === 'syndic')          navigate('/syndic/dashboard');
if (user.role === 'coproprietaire')  navigate('/coproprietaire/dashboard');
```

---

## 2. Routes Backend — Laravel `routes/api.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Syndic\{
    ResidenceController,
    ImmeubleController,
    AppartementController,
    CoproprietaireController,
    CompteChargeController,
    SousChargeController,
    DepenseController,
    HorsBudgetController,
    PeriodeController,
    BudgetPrevisionnelController,
    CotisationController,
    PaiementController,
    ReclamationController,
    RapportController,
};
use App\Http\Controllers\Coproprietaire\{
    DashboardController as CoproDashboardController,
    AppartementController as CoproAppartementController,
    CotisationController as CoproCotisationController,
    PaiementController as CoproPaiementController,
    ReclamationController as CoproReclamationController,
};

/*
|----------------------------------------------------------------------
| Auth
|----------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('login',  [AuthController::class, 'login'])->middleware('throttle:5,1')
         ->name('auth.login');
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum')
         ->name('auth.logout');
    Route::get('me',      [AuthController::class, 'me'])->middleware('auth:sanctum')
         ->name('auth.me');
});

/*
|----------------------------------------------------------------------
| Syndic Routes
|----------------------------------------------------------------------
*/
Route::prefix('syndic')
     ->middleware(['auth:sanctum', 'role:syndic'])
     ->group(function () {

    // Résidences
    Route::apiResource('residences', ResidenceController::class)
         ->names('syndic.residences');

    // Immeubles (nested sous résidence)
    Route::apiResource('residences.immeubles', ImmeubleController::class)
         ->shallow()
         ->names('syndic.immeubles');

    // Appartements
    Route::apiResource('residences.appartements', AppartementController::class)
         ->shallow()
         ->names('syndic.appartements');
    Route::put('appartements/{appartement}/assigner',
        [AppartementController::class, 'assigner'])
         ->name('syndic.appartements.assigner');

    // Copropriétaires
    Route::apiResource('coproprietaires', CoproprietaireController::class)
         ->names('syndic.coproprietaires');
    Route::post('coproprietaires/{coproprietaire}/reset-password',
        [CoproprietaireController::class, 'resetPassword'])
         ->name('syndic.coproprietaires.reset-password');
    Route::put('coproprietaires/{coproprietaire}/toggle-actif',
        [CoproprietaireController::class, 'toggleActif'])
         ->name('syndic.coproprietaires.toggle-actif');

    // Comptes Charges
    Route::apiResource('residences.comptes-charges', CompteChargeController::class)
         ->shallow()
         ->names('syndic.comptes-charges');

    // Sous-Charges
    Route::apiResource('comptes-charges.sous-charges', SousChargeController::class)
         ->shallow()
         ->names('syndic.sous-charges');

    // Dépenses
    Route::middleware('throttle:financial,20,1')->group(function () {
        Route::apiResource('residences.depenses', DepenseController::class)
             ->shallow()
             ->names('syndic.depenses');
        Route::get('depenses/{depense}/justificatif',
            [DepenseController::class, 'justificatif'])
             ->name('syndic.depenses.justificatif');

        // Hors Budget
        Route::apiResource('residences.hors-budgets', HorsBudgetController::class)
             ->shallow()
             ->names('syndic.hors-budgets');
    });

    // Périodes & Budget
    Route::apiResource('residences.periodes', PeriodeController::class)
         ->shallow()
         ->names('syndic.periodes');
    Route::get('periodes/{periode}/budgets',
        [BudgetPrevisionnelController::class, 'summary'])
         ->name('syndic.budgets.summary');
    Route::post('periodes/{periode}/budgets',
        [BudgetPrevisionnelController::class, 'store'])
         ->name('syndic.budgets.store');
    Route::put('budgets/{budget}',
        [BudgetPrevisionnelController::class, 'update'])
         ->name('syndic.budgets.update');

    // Cotisations
    Route::get('residences/{residence}/cotisations',
        [CotisationController::class, 'index'])
         ->name('syndic.cotisations.index');
    Route::post('residences/{residence}/cotisations/fixe',
        [CotisationController::class, 'storeFixe'])
         ->name('syndic.cotisations.store-fixe')
         ->middleware('throttle:financial,20,1');
    Route::post('residences/{residence}/cotisations/exceptionnelle',
        [CotisationController::class, 'storeExceptionnelle'])
         ->name('syndic.cotisations.store-exceptionnelle')
         ->middleware('throttle:financial,20,1');
    Route::get('cotisations/{cotisation}/details',
        [CotisationController::class, 'details'])
         ->name('syndic.cotisations.details');
    Route::get('residences/{residence}/cotisations/previsualiser',
        [CotisationController::class, 'previsualiser'])
         ->name('syndic.cotisations.previsualiser');
    Route::get('residences/{residence}/impayes',
        [CotisationController::class, 'impayes'])
         ->name('syndic.cotisations.impayes');

    // Paiements
    Route::get('residences/{residence}/paiements',
        [PaiementController::class, 'index'])
         ->name('syndic.paiements.index');
    Route::post('paiements',
        [PaiementController::class, 'store'])
         ->name('syndic.paiements.store')
         ->middleware('throttle:financial,20,1');
    Route::get('paiements/{paiement}/recu',
        [PaiementController::class, 'recu'])
         ->name('syndic.paiements.recu');
    Route::get('residences/{residence}/paiements/total-percu',
        [PaiementController::class, 'totalPercu'])
         ->name('syndic.paiements.total-percu');

    // Réclamations
    Route::get('residences/{residence}/reclamations',
        [ReclamationController::class, 'index'])
         ->name('syndic.reclamations.index');
    Route::get('reclamations/{reclamation}',
        [ReclamationController::class, 'show'])
         ->name('syndic.reclamations.show');
    Route::put('reclamations/{reclamation}/statut',
        [ReclamationController::class, 'updateStatut'])
         ->name('syndic.reclamations.update-statut');

    // Rapports
    Route::prefix('residences/{residence}/rapports')->group(function () {
        Route::get('budget',   [RapportController::class, 'budget'])
             ->name('syndic.rapports.budget');
        Route::get('impayes',  [RapportController::class, 'impayes'])
             ->name('syndic.rapports.impayes');
        Route::get('paiements',[RapportController::class, 'paiements'])
             ->name('syndic.rapports.paiements');
    });
});

/*
|----------------------------------------------------------------------
| Copropriétaire Routes
|----------------------------------------------------------------------
*/
Route::prefix('coproprietaire')
     ->middleware(['auth:sanctum', 'role:coproprietaire'])
     ->group(function () {

    Route::get('dashboard',
        [CoproDashboardController::class, 'index'])
         ->name('copro.dashboard');

    Route::get('appartements',
        [CoproAppartementController::class, 'index'])
         ->name('copro.appartements.index');

    Route::get('cotisations',
        [CoproCotisationController::class, 'index'])
         ->name('copro.cotisations.index');
    Route::get('cotisations/{cotisationDetail}',
        [CoproCotisationController::class, 'show'])
         ->name('copro.cotisations.show');

    Route::get('paiements',
        [CoproPaiementController::class, 'index'])
         ->name('copro.paiements.index');
    Route::get('paiements/{paiement}/recu',
        [CoproPaiementController::class, 'recu'])
         ->name('copro.paiements.recu');

    Route::get('reclamations',
        [CoproReclamationController::class, 'index'])
         ->name('copro.reclamations.index');
    Route::post('reclamations',
        [CoproReclamationController::class, 'store'])
         ->name('copro.reclamations.store');
    Route::get('reclamations/{reclamation}',
        [CoproReclamationController::class, 'show'])
         ->name('copro.reclamations.show');
});
```

---

## 3. Middleware Enregistrés

```php
// app/Http/Kernel.php (ou bootstrap/app.php en Laravel 13)

'role'      => \App\Http\Middleware\CheckRole::class,
'financial' => // throttle nommé défini dans RouteServiceProvider

// Global middleware (toutes les requêtes API)
\App\Http\Middleware\ForceJsonResponse::class,
```

### `ForceJsonResponse`
```php
public function handle(Request $request, Closure $next): Response
{
    $request->headers->set('Accept', 'application/json');
    return $next($request);
}
```

### `CheckRole`
```php
public function handle(Request $request, Closure $next, string $role): Response
{
    if (!$request->user() || !$request->user()->hasRole($role)) {
        return response()->json([
            'success' => false,
            'message' => 'Accès non autorisé.',
        ], 403);
    }
    return $next($request);
}
```

---

## 4. Liste des Routes Nommées — Référence Rapide

| Nom | Méthode | URI |
|-----|---------|-----|
| auth.login | POST | /api/auth/login |
| auth.logout | POST | /api/auth/logout |
| auth.me | GET | /api/auth/me |
| syndic.residences.index | GET | /api/syndic/residences |
| syndic.residences.store | POST | /api/syndic/residences |
| syndic.residences.show | GET | /api/syndic/residences/{id} |
| syndic.residences.update | PUT | /api/syndic/residences/{id} |
| syndic.residences.destroy | DELETE | /api/syndic/residences/{id} |
| syndic.budgets.summary | GET | /api/syndic/periodes/{id}/budgets |
| syndic.cotisations.store-fixe | POST | /api/syndic/residences/{id}/cotisations/fixe |
| syndic.cotisations.store-exceptionnelle | POST | /api/syndic/residences/{id}/cotisations/exceptionnelle |
| syndic.cotisations.previsualiser | GET | /api/syndic/residences/{id}/cotisations/previsualiser |
| syndic.cotisations.impayes | GET | /api/syndic/residences/{id}/impayes |
| syndic.paiements.store | POST | /api/syndic/paiements |
| syndic.paiements.recu | GET | /api/syndic/paiements/{id}/recu |
| syndic.reclamations.update-statut | PUT | /api/syndic/reclamations/{id}/statut |
| syndic.rapports.budget | GET | /api/syndic/residences/{id}/rapports/budget |
| copro.dashboard | GET | /api/coproprietaire/dashboard |
| copro.cotisations.index | GET | /api/coproprietaire/cotisations |
| copro.paiements.recu | GET | /api/coproprietaire/paiements/{id}/recu |
| copro.reclamations.store | POST | /api/coproprietaire/reclamations |
