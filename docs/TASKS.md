# TASKS.md — SyndicPro
## Plan de Développement — 22 Phases

---

## Phase 0 — Environnement (Backend + Frontend)

### Backend
- [ ] `composer create-project laravel/laravel syndicpro-api`
- [ ] Config `.env` : `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `QUEUE_CONNECTION=database`
- [ ] `composer require laravel/sanctum spatie/laravel-permission spatie/laravel-medialibrary`
- [ ] Publier config Sanctum : `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"`
- [ ] Publier config Spatie Permission
- [ ] Configurer `config/cors.php` pour SPA (frontend URL dans `allowed_origins`)
- [ ] Ajouter `ForceJsonResponse` middleware global dans `bootstrap/app.php`
- [ ] Configurer `config/queue.php` driver `database`
- [ ] `php artisan queue:table && php artisan migrate`

### Frontend
- [ ] `npm create vite@latest syndicpro-front -- --template react-ts`
- [ ] `npm i react-router-dom @tanstack/react-query axios zustand framer-motion`
- [ ] `npm i react-hook-form @hookform/resolvers zod`
- [ ] `npm i recharts date-fns`
- [ ] `npm i -D tailwindcss postcss autoprefixer`
- [ ] `npx tailwindcss init -p`
- [ ] Configurer `tailwind.config.ts` avec design tokens complets (voir UI_UX_SPEC.md § B)
- [ ] Installer polices : Plus Jakarta Sans + JetBrains Mono via Google Fonts
- [ ] Créer `src/api/axiosInstance.ts` avec base URL, `withCredentials: true`, interceptors
- [ ] Créer `src/store/authStore.ts`, `residenceStore.ts`, `uiStore.ts`
- [ ] Créer `src/types/entities.types.ts` et `api.types.ts`

---

## Phase 1 — Base de Données : Migrations + Models

### Migrations (dans l'ordre de dépendance)
- [ ] `create_users_table` — voir DATABASE.md § 1
- [ ] `create_residences_table`
- [ ] `create_immeubles_table`
- [ ] `create_appartements_table` (avec soft deletes)
- [ ] `create_comptes_charges_table`
- [ ] `create_sous_charges_table`
- [ ] `create_depenses_table`
- [ ] `create_hors_budgets_table`
- [ ] `create_periodes_table`
- [ ] `create_budgets_previsionnels_table`
- [ ] `create_cotisations_table`
- [ ] `create_cotisation_details_table`
- [ ] `create_paiements_table`
- [ ] `create_reclamations_table`
- [ ] `php artisan migrate`

### Models (avec relations complètes)
- [ ] `User` — fillable, casts, relations, soft delete
- [ ] `Residence` — fillable, casts, relations
- [ ] `Immeuble`
- [ ] `Appartement` — soft delete
- [ ] `CompteCharge`
- [ ] `SousCharge`
- [ ] `Depense` — media collection "justificatifs"
- [ ] `HorsBudget` — media collection "justificatifs"
- [ ] `Periode`
- [ ] `BudgetPrevisionnel` — attribut `montant_restant` calculé
- [ ] `Cotisation`
- [ ] `CotisationDetail` — attribut `montant_restant` calculé
- [ ] `Paiement` — media collection "recus"
- [ ] `Reclamation`

### Enums PHP 8.1
- [ ] `UserRole`, `ModeRepartition`, `CotisationType`, `CotisationDetailStatut`, `ModePaiement`, `ReclamationStatut`

---

## Phase 2 — Seeders

- [ ] `UserSeeder` : 1 syndic (username: `syndic`, password: `password`)
- [ ] `ResidenceSeeder` : 1 résidence "Résidence Maarif" (Casablanca)
- [ ] `ImmeubleSeeder` : 2 immeubles (Bâtiment A, Bâtiment B)
- [ ] `AppartementSeeder` : 8 appartements avec tantièmes (total = 1000)
- [ ] `CoproprietaireSeeder` : 6 copropriétaires avec credentials
- [ ] `CompteChargeSeeder` : Entretien & Réparation, Jardinage, Ménage, Sécurité, Ascenseur
- [ ] `SousChargeSeeder` : 2–3 sous-charges par compte
- [ ] `PeriodeSeeder` : période 2026 (active), période 2025
- [ ] `BudgetPrevisionnelSeeder` : budget par compte pour 2026
- [ ] `DepenseSeeder` : 15 dépenses réelles (2–3 par sous-charge)
- [ ] `CotisationSeeder` : 1 cotisation fixe 200 DH/mois, 1 exceptionnelle mode C
- [ ] `CotisationDetailSeeder` : générés par les cotisations
- [ ] `PaiementSeeder` : paiements variés (complets, partiels, manquants)
- [ ] `ReclamationSeeder` : 5 réclamations avec statuts variés

---

## Phase 3 — Core Backend

- [ ] `BaseRepository` abstrait avec méthodes communes (find, create, update, delete)
- [ ] `ApiResponse` helper : `success()`, `error()`, `validationError()`
- [ ] `Handler.php` : handler global JSON pour toutes les exceptions
  - `ValidationException` → 422 avec errors en français
  - `ModelNotFoundException` → 404
  - `AuthorizationException` → 403
  - `Exception` génériques → 500
- [ ] `ForceJsonMiddleware` : force Accept: application/json
- [ ] `CheckRole` middleware Spatie
- [ ] `AppServiceProvider` : enregistrer Observers + Policy discovery
- [ ] Spatie roles : créer roles `syndic` et `coproprietaire` dans seeder

---

## Phase 4 — Système d'Authentification

### Backend
- [ ] `AuthController` : `login()`, `logout()`, `me()`
- [ ] `LoginRequest` : validation username + password + throttle
- [ ] `GET /sanctum/csrf-cookie` configuré
- [ ] Test : login retourne UserResource avec role
- [ ] Test : logout révoque session

### Frontend
- [ ] `LoginPage.tsx` : formulaire username + password, React Hook Form + Zod
- [ ] `axiosInstance` : GET `/sanctum/csrf-cookie` avant login
- [ ] `authStore` : setUser, clearUser, persist
- [ ] `ProtectedRoute` + `RoleGuard`
- [ ] Redirect post-login basé sur role
- [ ] Route `/login` — page responsive, brand design

---

## Phase 5 — CRUD Résidences, Immeubles, Appartements, Copropriétaires

### Backend (par entité)
- [ ] Repository → Service → Controller → FormRequests → Resource → Policy
- [ ] Résidences : CRUD complet, Policy ownership syndic
- [ ] Immeubles : CRUD nested sous résidence
- [ ] Appartements : CRUD + endpoint `assigner` copropriétaire, soft delete
- [ ] Copropriétaires : CRUD + reset-password + toggle-actif

### Frontend
- [ ] Pages : ResidencesPage, ImmeublesPage, AppartementsPage, CoproprietairesPage
- [ ] Composant cards résidences
- [ ] DataTable réutilisable avec tri + pagination
- [ ] Modales de création/édition avec React Hook Form + Zod
- [ ] CoproprietaireDrawer (panel latéral droit)

---

## Phase 6 — API Charges (Comptes, Sous-Charges, Dépenses, Hors Budget)

### Backend
- [ ] `CompteChargeController`, `SousChargeController`, `DepenseController`, `HorsBudgetController`
- [ ] `StoreDepenseRequest` : validation avec fichier justificatif (pdf/jpg/png, max 5MB)
- [ ] Upload Spatie Media Library sur `Depense` + `HorsBudget`
- [ ] Endpoint justificatif : signed URL temporaire 60 min

### Frontend
- [ ] `ChargesDepensesPage` avec 4 onglets
- [ ] Formulaire dépense avec upload fichier
- [ ] Affichage justificatif (modal preview ou nouvel onglet)

---

## Phase 7 — Budget Prévisionnel

### Backend
- [ ] `PeriodeController`, `BudgetPrevisionnelController`
- [ ] `BudgetService` : toutes les méthodes (createPeriode, setBudget, recalculerConsomme, getBudgetSummary, checkDepassement)
- [ ] `BudgetPrevisionnelRepository` : getSummaryByPeriode avec sous-charges detail
- [ ] `DepenseObserver` : calcule budget restant sur created/updated/deleted
- [ ] Cache `budget_summary_{periode_id}` avec invalidation
- [ ] `BudgetPolicy` : manage vérifie ownership résidence

### Frontend
- [ ] `BudgetPage` : onglets période, KPI summary, BudgetTable expandable
- [ ] `BudgetTable` avec progressbar animée et color coding
- [ ] Alertes dépassement budget
- [ ] Charts : BudgetBarChart groupé

---

## Phase 8 — Cotisations

### Backend
- [ ] `CotisationService` : toutes les méthodes (createFixe, createExceptionnelle, generateDetails, 3 modes répartition, impayés)
- [ ] `CotisationController` : index, storeFixe, storeExceptionnelle, details, previsualiser, impayes
- [ ] `StoreCotisationFixeRequest`, `StoreCotisationExceptionnelleRequest`
- [ ] `GenerateMonthlyCotisations` job + scheduled command (1er du mois)
- [ ] Idempotence : vérification avant création mensuelle
- [ ] `CotisationPolicy`

### Frontend
- [ ] `CotisationsPage` : 3 onglets
- [ ] `CotisationExceptionnelleWizard` : wizard 3 étapes avec prévisualisation
- [ ] `RepartitionPreview` : table avec formules affichées (mode C)
- [ ] Onglet Impayés avec filtres

---

## Phase 9 — Paiements

### Backend
- [ ] `PaiementService` : enregistrerPaiement, updateCotisationDetailStatut, genererRecu, historique, totalPercu
- [ ] `PaiementObserver` : met à jour statut + montant_paye sur created/deleted
- [ ] `StorePaiementRequest` : validation montant ≤ restant
- [ ] `GenerateReceipt` job : génère PDF avec DOMPDF/Blade
- [ ] `SendPaymentConfirmation` job : email confirmation
- [ ] Signed URL pour téléchargement reçu
- [ ] `PaiementObserver` — JAMAIS de statut manuel

### Frontend
- [ ] `PaiementsPage` : table + filtres
- [ ] `EnregistrerPaiementModal` : autocomplete copropriétaire, calcul restant live
- [ ] Téléchargement reçu PDF

---

## Phase 10 — Réclamations

### Backend
- [ ] `ReclamationService` : create (notifie syndic), updateStatut (notifie copropriétaire)
- [ ] `ReclamationController` syndic (index, show, updateStatut) + copropriétaire (index, store, show)
- [ ] `NouvelleReclamationNotification`, `ReclamationUpdatedNotification` (email)
- [ ] `ReclamationPolicy`
- [ ] `UpdateReclamationStatutRequest`

### Frontend
- [ ] `ReclamationsPage` (syndic) : table + filtres + modal détail
- [ ] `ReclamationDetailModal` : statut dropdown + textarea réponse
- [ ] Badge pulse sur "nouveau"

---

## Phase 11 — Portail Copropriétaire (APIs)

### Backend
- [ ] `CoproDashboardController::index()` : summary complet
- [ ] `CoproAppartementController::index()` : appartements du connecté
- [ ] `CoproCotisationController` : cotisations + détail avec paiements
- [ ] `CoproPaiementController` : historique + reçu
- [ ] `CoproReclamationController` : CRUD (create + view mine)
- [ ] Tous les controllers vérifient `coproprietaire_id === user.id`

---

## Phase 12 — Rapports

### Backend
- [ ] `RapportController` : budget, impayes, paiements
- [ ] Données agrégées backend (pas de lignes brutes)

### Frontend
- [ ] `RapportsPage` : affichage rapports avec options de filtre
- [ ] Export CSV optionnel (bouton "Télécharger")

---

## Phase 13 — Setup Frontend Complet

- [ ] `axiosInstance` final avec tous les interceptors (401 → logout, 403 → redirect)
- [ ] `QueryClient` config (staleTime, retry, error handling global)
- [ ] Tous les hooks API (`useBudget`, `useCotisations`, `usePaiements`, etc.)
- [ ] Composants UI atomiques complets (Badge, Button, Card, Modal, Toast, etc.)
- [ ] `AppShell` avec Sidebar + Topbar responsive
- [ ] Système Toast (Zustand store + composant)

---

## Phase 14 — Frontend Syndic Dashboard

- [ ] `SyndicDashboardPage` : 6 KPI cards + 2 charts + 3 tables récentes
- [ ] `BudgetBarChart` (Recharts grouped bars)
- [ ] `DepensePieChart` (Recharts donut)
- [ ] Count-up animation sur KPI cards
- [ ] Skeleton loaders

---

## Phase 15 — Frontend Budget & Charges

- [ ] `BudgetPage` : période tabs + summary + BudgetTable expandable
- [ ] `ChargesDepensesPage` : 4 onglets avec CRUD complet
- [ ] Progressbar animée
- [ ] Alertes dépassement

---

## Phase 16 — Frontend Cotisations & Paiements

- [ ] `CotisationsPage` : 3 onglets complets
- [ ] `CotisationExceptionnelleWizard` : wizard 3 étapes
- [ ] `RepartitionPreview` avec formules
- [ ] `PaiementsPage` + `EnregistrerPaiementModal`

---

## Phase 17 — Frontend Copropriétaires & Appartements

- [ ] `CoproprietairesPage` + `CoproprietaireDrawer`
- [ ] `AppartementsPage` avec bouton assigner inline
- [ ] `ResidencesPage` en cards
- [ ] `ImmeublesPage` filtrable

---

## Phase 18 — Frontend Réclamations

- [ ] `ReclamationsPage` syndic avec modal détail statut
- [ ] Portail copropriétaire : `MesReclamationsPage` + form nouvelle réclamation

---

## Phase 19 — Frontend Portail Copropriétaire

- [ ] `CoproprietaireLayout` + navigation
- [ ] `CoproDashboardPage` : KPIs + appartements + activité récente
- [ ] `MesCotisationsPage` : 2 onglets
- [ ] `MesPaiementsPage` + téléchargement reçus

---

## Phase 20 — Polish : Animations, États, Accessibilité

- [ ] **Toutes les animations** de la checklist UI_UX_SPEC.md § G
- [ ] Skeleton loaders sur toutes les sections
- [ ] États vides avec illustration + message + CTA
- [ ] États d'erreur (réseau, 500) avec bouton "Réessayer"
- [ ] `prefers-reduced-motion` : désactiver animations via `useReducedMotion()`
- [ ] Aria labels sur tous les éléments interactifs
- [ ] Focus management dans modales (trap focus)
- [ ] Keyboard navigation sidebar
- [ ] Formatage live des champs montant "1 200,00 DH"
- [ ] Calcul restant en temps réel dans modal paiement

---

## Phase 21 — Tests

### Tests Feature (Pest)
- [ ] Auth : login succès, login échec, logout, tentatives excessives (rate limit)
- [ ] Résidences : CRUD, isolation syndic (403 si autre syndic)
- [ ] Budget : recalcul sur dépense ajoutée/modifiée/supprimée
- [ ] Cotisations : 3 modes répartition (vérifier montants calculés)
- [ ] Paiements : complet, partiel, dépassement refusé
- [ ] Réclamations : création copropriétaire, update statut syndic, isolation
- [ ] Copropriétaire portal : ne peut pas voir données d'autres copropriétaires

### Tests Unitaires
- [ ] `BudgetService::recalculerConsomme()`
- [ ] `CotisationService::calculerRepartitionEgale()`
- [ ] `CotisationService::calculerRepartitionParTantieme()`
- [ ] `CotisationService::calculerRepartitionParAppartement()`
- [ ] `PaiementService::updateCotisationDetailStatut()`
- [ ] `GenerateMonthlyCotisations` job — idempotence

### Vérification Factories
- [ ] Toutes les factories produisent des données cohérentes et réalistes

---

## Phase 22 — Build & Déploiement

### Backend
- [ ] `.env.production` : APP_ENV=production, QUEUE_CONNECTION=redis, CACHE_DRIVER=redis
- [ ] `php artisan config:cache && php artisan route:cache && php artisan view:cache`
- [ ] Configurer Supervisor pour queue worker
- [ ] Configurer cron pour scheduler Laravel
- [ ] HTTPS forcé
- [ ] Logs : `storage/logs/` avec rotation quotidienne

### Frontend
- [ ] `npm run build` → vérifier bundle size
- [ ] Variables d'environnement production (`.env.production`)
- [ ] Configurer Nginx pour SPA (fallback vers `index.html`)
- [ ] CORS production : uniquement domaine frontend

### Checklist finale
- [ ] Aucun `console.log` en production
- [ ] Aucun `dd()` ou `dump()` en production
- [ ] Tous les `.env` sensibles hors du repo
- [ ] README.md avec instructions d'installation
