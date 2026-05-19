# ARCHITECTURE.md — SyndicPro

---

## 1. Vue d'Ensemble

```
SyndicPro
├── Backend  : Laravel 13 (API RESTful, Sanctum SPA, MySQL 8)
└── Frontend : React 18 + Vite + TypeScript (SPA)
```

Communication : JSON via HTTPS.
Auth : Laravel Sanctum — cookies httpOnly (SPA mode).
Pas de JWT stocké en localStorage.

---

## 2. Arborescence Backend (Laravel 13)

```
syndicpro-api/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       └── GenerateMonthlyCotisations.php
│   ├── Enums/
│   │   ├── UserRole.php               (syndic, copropriétaire)
│   │   ├── ModeRepartition.php        (egale, par_appartement, par_tantieme)
│   │   ├── CotisationType.php         (fixe, exceptionnelle)
│   │   ├── CotisationDetailStatut.php (non_paye, partiellement_paye, paye)
│   │   ├── ModePaiement.php           (especes, virement, cheque, carte)
│   │   └── ReclamationStatut.php      (nouveau, en_cours, traite, rejete)
│   ├── Events/
│   │   ├── CotisationCreated.php
│   │   ├── PaiementRecorded.php
│   │   └── ReclamationUpdated.php
│   ├── Exceptions/
│   │   └── Handler.php                (global JSON exception handler)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   │   └── AuthController.php
│   │   │   ├── Syndic/
│   │   │   │   ├── ResidenceController.php
│   │   │   │   ├── ImmeubleController.php
│   │   │   │   ├── AppartementController.php
│   │   │   │   ├── CoproprietaireController.php
│   │   │   │   ├── CompteChargeController.php
│   │   │   │   ├── SousChargeController.php
│   │   │   │   ├── DepenseController.php
│   │   │   │   ├── HorsBudgetController.php
│   │   │   │   ├── PeriodeController.php
│   │   │   │   ├── BudgetPrevisionnelController.php
│   │   │   │   ├── CotisationController.php
│   │   │   │   ├── PaiementController.php
│   │   │   │   ├── ReclamationController.php
│   │   │   │   └── RapportController.php
│   │   │   └── Coproprietaire/
│   │   │       ├── DashboardController.php
│   │   │       ├── AppartementController.php
│   │   │       ├── CotisationController.php
│   │   │       ├── PaiementController.php
│   │   │       └── ReclamationController.php
│   │   ├── Middleware/
│   │   │   ├── ForceJsonResponse.php
│   │   │   ├── CheckRole.php
│   │   │   └── EnsureResidenceOwnership.php
│   │   ├── Requests/
│   │   │   ├── Auth/
│   │   │   │   └── LoginRequest.php
│   │   │   ├── Residence/
│   │   │   │   ├── StoreResidenceRequest.php
│   │   │   │   └── UpdateResidenceRequest.php
│   │   │   ├── Immeuble/
│   │   │   ├── Appartement/
│   │   │   ├── Coproprietaire/
│   │   │   ├── CompteCharge/
│   │   │   ├── SousCharge/
│   │   │   ├── Depense/
│   │   │   ├── HorsBudget/
│   │   │   ├── Periode/
│   │   │   ├── BudgetPrevisionnel/
│   │   │   ├── Cotisation/
│   │   │   ├── Paiement/
│   │   │   └── Reclamation/
│   │   └── Resources/
│   │       ├── UserResource.php
│   │       ├── ResidenceResource.php
│   │       ├── ImmeubleResource.php
│   │       ├── AppartementResource.php
│   │       ├── CoproprietaireResource.php
│   │       ├── CompteChargeResource.php
│   │       ├── SousChargeResource.php
│   │       ├── DepenseResource.php
│   │       ├── HorsBudgetResource.php
│   │       ├── PeriodeResource.php
│   │       ├── BudgetPrevisionnelResource.php
│   │       ├── BudgetSummaryResource.php
│   │       ├── CotisationResource.php
│   │       ├── CotisationDetailResource.php
│   │       ├── PaiementResource.php
│   │       └── ReclamationResource.php
│   ├── Jobs/
│   │   ├── GenerateMonthlyCotisations.php
│   │   ├── GenerateReceipt.php
│   │   └── SendPaymentConfirmation.php
│   ├── Listeners/
│   │   ├── OnCotisationCreated.php
│   │   ├── OnPaiementRecorded.php
│   │   └── OnReclamationUpdated.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Residence.php
│   │   ├── Immeuble.php
│   │   ├── Appartement.php
│   │   ├── CompteCharge.php
│   │   ├── SousCharge.php
│   │   ├── Depense.php
│   │   ├── HorsBudget.php
│   │   ├── Periode.php
│   │   ├── BudgetPrevisionnel.php
│   │   ├── Cotisation.php
│   │   ├── CotisationDetail.php
│   │   ├── Paiement.php
│   │   └── Reclamation.php
│   ├── Notifications/
│   │   ├── NouvelleReclamationNotification.php
│   │   ├── ReclamationUpdatedNotification.php
│   │   └── PaiementConfirmationNotification.php
│   ├── Observers/
│   │   ├── DepenseObserver.php
│   │   └── PaiementObserver.php
│   ├── Policies/
│   │   ├── ResidencePolicy.php
│   │   ├── CotisationPolicy.php
│   │   ├── ReclamationPolicy.php
│   │   └── BudgetPolicy.php
│   ├── Providers/
│   │   ├── AppServiceProvider.php
│   │   ├── AuthServiceProvider.php
│   │   └── EventServiceProvider.php
│   ├── Repositories/
│   │   ├── Contracts/
│   │   │   ├── ResidenceRepositoryInterface.php
│   │   │   ├── BudgetRepositoryInterface.php
│   │   │   ├── CotisationRepositoryInterface.php
│   │   │   └── PaiementRepositoryInterface.php
│   │   ├── ResidenceRepository.php
│   │   ├── ImmeubleRepository.php
│   │   ├── AppartementRepository.php
│   │   ├── CoproprietaireRepository.php
│   │   ├── CompteChargeRepository.php
│   │   ├── SousChargeRepository.php
│   │   ├── DepenseRepository.php
│   │   ├── HorsBudgetRepository.php
│   │   ├── PeriodeRepository.php
│   │   ├── BudgetPrevisionnelRepository.php
│   │   ├── CotisationRepository.php
│   │   ├── PaiementRepository.php
│   │   └── ReclamationRepository.php
│   └── Services/
│       ├── BudgetService.php
│       ├── CotisationService.php
│       ├── PaiementService.php
│       └── ReclamationService.php
├── bootstrap/
├── config/
├── database/
│   ├── factories/
│   │   ├── UserFactory.php
│   │   ├── ResidenceFactory.php
│   │   ├── ImmeubleFactory.php
│   │   ├── AppartementFactory.php
│   │   ├── CompteChargeFactory.php
│   │   ├── SousChargeFactory.php
│   │   ├── DepenseFactory.php
│   │   ├── PeriodeFactory.php
│   │   ├── BudgetPrevisionnelFactory.php
│   │   ├── CotisationFactory.php
│   │   ├── CotisationDetailFactory.php
│   │   ├── PaiementFactory.php
│   │   └── ReclamationFactory.php
│   ├── migrations/          (in dependency order — see DATABASE.md)
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── UserSeeder.php
│       ├── ResidenceSeeder.php
│       ├── ImmeubleSeeder.php
│       ├── AppartementSeeder.php
│       ├── CoproprietaireSeeder.php
│       ├── CompteChargeSeeder.php
│       ├── SousChargeSeeder.php
│       ├── PeriodeSeeder.php
│       ├── BudgetPrevisionnelSeeder.php
│       ├── DepenseSeeder.php
│       ├── CotisationSeeder.php
│       ├── CotisationDetailSeeder.php
│       ├── PaiementSeeder.php
│       └── ReclamationSeeder.php
├── resources/
│   └── docs/               (all .md files live here)
├── routes/
│   ├── api.php
│   └── web.php
├── storage/
│   └── app/
│       ├── justificatifs/  (dépenses pièces jointes)
│       └── recus/          (receipts PDF)
└── tests/
    ├── Feature/
    │   ├── Auth/
    │   ├── Syndic/
    │   └── Coproprietaire/
    └── Unit/
        └── Services/
```

---

## 3. Arborescence Frontend (React 18 + Vite + TypeScript)

```
syndicpro-front/
├── public/
├── src/
│   ├── api/
│   │   ├── axiosInstance.ts         (base URL, interceptors, CSRF)
│   │   ├── auth.api.ts
│   │   ├── residence.api.ts
│   │   ├── immeuble.api.ts
│   │   ├── appartement.api.ts
│   │   ├── coproprietaire.api.ts
│   │   ├── compteCharge.api.ts
│   │   ├── sousCharge.api.ts
│   │   ├── depense.api.ts
│   │   ├── horsBudget.api.ts
│   │   ├── budget.api.ts
│   │   ├── cotisation.api.ts
│   │   ├── paiement.api.ts
│   │   ├── reclamation.api.ts
│   │   └── rapport.api.ts
│   ├── components/
│   │   ├── ui/                      (design system — atoms)
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Tooltip.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarNav.tsx
│   │   │   ├── ResidenceSelector.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── PageHeader.tsx
│   │   ├── charts/
│   │   │   ├── BudgetBarChart.tsx
│   │   │   ├── DepensePieChart.tsx
│   │   │   └── PaiementLineChart.tsx
│   │   ├── budget/
│   │   │   ├── BudgetTable.php
│   │   │   ├── BudgetRow.tsx
│   │   │   ├── BudgetSummaryCards.tsx
│   │   │   └── DepenseSidePanel.tsx
│   │   ├── cotisation/
│   │   │   ├── CotisationFixeModal.tsx
│   │   │   ├── CotisationExceptionnelleWizard.tsx
│   │   │   ├── RepartitionPreview.tsx
│   │   │   └── CotisationDetailTable.tsx
│   │   ├── paiement/
│   │   │   ├── EnregistrerPaiementModal.tsx
│   │   │   └── PaiementTable.tsx
│   │   ├── reclamation/
│   │   │   ├── ReclamationDetailModal.tsx
│   │   │   └── NouvelleReclamationForm.tsx
│   │   └── coproprietaire/
│   │       └── CoproprietaireDrawer.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useResidences.ts
│   │   ├── useImmeubles.ts
│   │   ├── useAppartements.ts
│   │   ├── useCoproprietaires.ts
│   │   ├── useCharges.ts
│   │   ├── useBudget.ts
│   │   ├── useCotisations.ts
│   │   ├── usePaiements.ts
│   │   ├── useReclamations.ts
│   │   ├── useRapports.ts
│   │   └── useAmountFormatter.ts
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── syndic/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ResidencesPage.tsx
│   │   │   ├── ImmeublesPage.tsx
│   │   │   ├── AppartementsPage.tsx
│   │   │   ├── CoproprietairesPage.tsx
│   │   │   ├── BudgetPage.tsx
│   │   │   ├── ChargesDepensesPage.tsx
│   │   │   ├── CotisationsPage.tsx
│   │   │   ├── PaiementsPage.tsx
│   │   │   ├── ReclamationsPage.tsx
│   │   │   └── RapportsPage.tsx
│   │   └── coproprietaire/
│   │       ├── DashboardPage.tsx
│   │       ├── MesCotisationsPage.tsx
│   │       ├── MesPaiementsPage.tsx
│   │       └── MesReclamationsPage.tsx
│   ├── router/
│   │   ├── index.tsx
│   │   ├── SyndicLayout.tsx
│   │   ├── CoproprietaireLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleGuard.tsx
│   ├── store/
│   │   ├── authStore.ts             (Zustand — user, role, token)
│   │   ├── residenceStore.ts        (Zustand — active residence)
│   │   └── uiStore.ts               (Zustand — sidebar state, toasts)
│   ├── types/
│   │   ├── api.types.ts             (ApiResponse<T>, PaginatedResponse<T>)
│   │   ├── entities.types.ts        (all domain interfaces)
│   │   └── enums.types.ts           (ModeRepartition, Statut, etc.)
│   ├── utils/
│   │   ├── formatCurrency.ts        (1 200,00 DH)
│   │   ├── formatDate.ts            (DD/MM/YYYY)
│   │   ├── cn.ts                    (tailwind class merger)
│   │   └── validators.ts            (Zod schemas)
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Cycle de Vie d'une Requête Backend

### Exemple : Enregistrement d'une Dépense (POST /api/syndic/depenses)

```
1. HTTP Request
   └── Route api.php
       └── middleware: [auth:sanctum, role:syndic, throttle:financial]

2. ForceJsonMiddleware
   └── Ajoute Accept: application/json à toute requête

3. StoreDepenseRequest (FormRequest)
   ├── authorize() : vérifie que le syndic possède la résidence visée
   └── rules()     : valide sous_charge_id, montant, date, description, justificatif

4. DepenseController::store(StoreDepenseRequest $request)
   └── Appelle DepenseService::createDepense($validated)
   └── Retourne DepenseResource + HTTP 201

5. DepenseService::createDepense(array $data)
   ├── Appelle DepenseRepository::create($data)
   ├── Si justificatif : Spatie MediaLibrary addMedia()
   └── Retourne $depense (Model)

6. DepenseObserver::created(Depense $depense)
   ├── Trouve le BudgetPrevisionnel correspondant
   │   (via sous_charge → compte_charge → budget_previsionnel de la période active)
   ├── Appelle BudgetService::recalculerConsomme($budget_previsionnel_id)
   │   ├── SUM(depenses.montant) par compte_charge
   │   ├── Met à jour budgets_previsionnels.montant_consomme
   │   └── Invalide le cache Redis : "budget_summary_{periode_id}"
   └── Si dépassement : dispatch BudgetDepassementEvent (optionnel v2)

7. API Response
   {
     "success": true,
     "data": { DepenseResource },
     "message": "Dépense enregistrée avec succès."
   }
```

---

## 5. Flux de Données Frontend

```
Page/Component
  └── useBudget() [custom hook]
      └── useQuery(['budget', periodeId], () => budget.api.getSummary(periodeId))
          └── axiosInstance.get('/api/syndic/budgets/summary')
              └── Laravel API
                  ├── BudgetPrevisionnelController::summary()
                  ├── BudgetService::getBudgetSummary(periodeId)
                  │   └── Cache::remember("budget_summary_{periodeId}", ...)
                  │       └── BudgetPrevisionnelRepository::getSummaryByPeriode()
                  └── BudgetSummaryResource::collection()
```

---

## 6. Stratégie d'Authentification

```
Technologie : Laravel Sanctum SPA (cookies httpOnly)

Flow Login:
1. Frontend → GET /sanctum/csrf-cookie
2. Laravel set XSRF-TOKEN cookie
3. Frontend → POST /api/auth/login (email/username + password)
4. Laravel → AuthController::login() → Auth::attempt()
5. Sanctum crée session + set laravel_session cookie
6. Réponse : UserResource (id, name, role)
7. Frontend Zustand authStore.setUser(user)

Role-Based Redirect (post-login):
- role === 'syndic'          → /syndic/dashboard
- role === 'coproprietaire'  → /copropriétaire/dashboard

Protection des Routes Frontend:
- ProtectedRoute : vérifie authStore.user !== null
- RoleGuard     : vérifie authStore.user.role === requiredRole

Protection des Routes Backend:
- middleware auth:sanctum    → vérifie session
- middleware CheckRole       → vérifie Spatie role
- Policies                  → vérifie ownership

Logout:
1. POST /api/auth/logout
2. Sanctum révoque session
3. authStore.clear()
4. redirect → /login
```

---

## 7. Machine à États — Budget

```
┌─────────────────┐
│  Période créée  │
│  (is_active=1)  │
└────────┬────────┘
         │ setBudget()
         ▼
┌─────────────────────┐
│ BudgetPrevisionnel  │
│ montant_prevu = X   │
│ montant_consomme = 0│
│ montant_restant = X │
└────────┬────────────┘
         │ DepenseObserver::created/updated/deleted
         ▼
┌─────────────────────────────────┐
│ recalculerConsomme()            │
│ = SUM(depenses) par compte      │
│ montant_restant auto-calculé    │
│ Cache invalidé                  │
└─────────┬───────────────────────┘
          │ si montant_consomme > montant_prevu
          ▼
┌─────────────────┐
│  ALERTE         │
│  Dépassement    │
│  Budget         │
└─────────────────┘
```

---

## 8. Machine à États — Cotisation

```
┌──────────────────────┐
│  Cotisation créée    │
│  (fixe/exception.)   │
└──────────┬───────────┘
           │ CotisationService::generateDetails()
           ▼
┌──────────────────────────────────┐
│  CotisationDetails générés       │
│  statut = 'non_paye'             │
│  (un par appartement actif)      │
└──────────┬───────────────────────┘
           │ PaiementService::enregistrerPaiement()
           ▼
┌──────────────────────────────────┐
│  Paiement enregistré             │
│  PaiementObserver::created()     │
│  → recalcule montant_paye        │
│  → met à jour statut :           │
│    partiel → 'partiellement_paye'│
│    complet → 'paye'              │
└──────────────────────────────────┘
```

---

## 9. Machine à États — Réclamation

```
Copropriétaire::create()
      │
      ▼
   [nouveau]  ←── notification email → syndic
      │
      │ Syndic::updateStatut('en_cours')
      ▼
  [en_cours]  ←── notification email → copropriétaire
      │
      ├─── Syndic::updateStatut('traite')
      │           ▼
      │        [traité]  ←── notification email → copropriétaire
      │
      └─── Syndic::updateStatut('rejete', reponse)
                  ▼
               [rejeté]  ←── notification email → copropriétaire
```

---

## 10. Système de Files d'Attente et Jobs

```
Queue: database (ou Redis en prod)

Jobs:
┌──────────────────────────────────────────────────────┐
│ GenerateMonthlyCotisations                           │
│  Trigger   : Scheduler — 1er du mois à 00:00        │
│  Logique   : Pour chaque cotisation_fixe active,    │
│              créer cotisation_details (idempotent)   │
│  Retry     : 3 tentatives                            │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│ GenerateReceipt                                      │
│  Trigger   : PaiementService::enregistrerPaiement() │
│  Logique   : génère PDF reçu via @react-pdf ou DOMPDF│
│              stocke via Spatie Media Library         │
│  Retry     : 3 tentatives                            │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│ SendPaymentConfirmation                              │
│  Trigger   : PaiementRecorded event                 │
│  Logique   : envoie email confirmation + reçu PDF   │
│  Retry     : 3 tentatives                            │
└──────────────────────────────────────────────────────┘
```

---

## 11. Carte des Événements

```
Event                  → Listener(s)
─────────────────────────────────────────────────────────
CotisationCreated      → OnCotisationCreated
                            → dispatch GenerateMonthlyCotisations (si fixe)
                            → log audit

PaiementRecorded       → OnPaiementRecorded
                            → dispatch GenerateReceipt
                            → dispatch SendPaymentConfirmation
                            → PaiementObserver met à jour statut cotisation_detail

ReclamationUpdated     → OnReclamationUpdated
                            → envoie notification email au copropriétaire
                            → log audit

DepenseCreated/Updated/Deleted
                       → DepenseObserver
                            → BudgetService::recalculerConsomme()
                            → invalide cache budget
```

---

## 12. Stratégie de Cache

```
Clé : "budget_summary_{periode_id}"
TTL  : illimité (invalidé manuellement)
Contenu :
  {
    prevu      : DECIMAL,
    consomme   : DECIMAL,
    restant    : DECIMAL,
    hors_budget: DECIMAL,
    par_compte : [ { compte_charge_id, prevu, consomme, restant } ]
  }

Invalidation déclenchée par :
  - DepenseObserver::created()
  - DepenseObserver::updated()
  - DepenseObserver::deleted()
  - HorsBudgetObserver::created/updated/deleted() (si ajouté)

Implémentation :
  BudgetService::recalculerConsomme() appelle
  Cache::forget("budget_summary_{periode_id}")
  puis Cache::remember(key, fn, INF)
```

---

## 13. Stockage des Fichiers (Spatie Media Library)

```
Collection "justificatifs"
  Modèle  : Depense, HorsBudget
  Disk    : local (hors public/)
  Types   : pdf, jpg, jpeg, png
  Max     : 5 MB
  Path    : storage/app/justificatifs/{depense_id}/

Collection "recus"
  Modèle  : Paiement
  Disk    : local (hors public/)
  Types   : pdf
  Path    : storage/app/recus/{paiement_id}/
  Accès   : via URL signée temporaire (Laravel signed routes)
```

---

## 14. Commandes Planifiées

```php
// app/Console/Kernel.php
$schedule->job(new GenerateMonthlyCotisations)
         ->monthlyOn(1, '00:00')
         ->withoutOverlapping()
         ->onFailure(fn() => Log::error('GenerateMonthlyCotisations échoué'));
```

---

## 15. Règles par Couche (Law of Layers)

| Couche | Responsabilité | Interdit |
|--------|---------------|---------|
| Controller | Reçoit request → appelle Service → retourne Resource | Eloquent, logique métier |
| Service | Logique métier, calculs, événements, jobs | Eloquent direct, response HTTP |
| Repository | Requêtes Eloquent uniquement, eager loading | Logique métier |
| Model | fillable, casts, relations, scopes | Queries, logique |
| FormRequest | Validation + authorization | Business logic |
| Resource | Forme les réponses API | Queries, logique |
| Observer | Réagit aux événements Eloquent | Side effects directs |
| Policy | Autorisations métier | Business logic |
