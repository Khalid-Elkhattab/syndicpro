# PHASE_PROMPTS_A.md — SyndicPro
## Prompts Phases 0 à 5 — Paste-Ready

---

## PHASE 0 — Environnement

```
Tu es un senior full-stack Laravel 13 / React 18 + TypeScript.
Lis ces fichiers de contexte avant de commencer :
  - PROJECT.md
  - ARCHITECTURE.md
  - CONVENTIONS.md

Tâche : Configurer l'environnement complet du projet SyndicPro.

### Backend (Laravel 13)

1. Crée la structure de base Laravel 13 avec :
   - `composer require laravel/sanctum spatie/laravel-permission spatie/laravel-medialibrary`
   - `config/sanctum.php` : stateful domains = localhost:5173 (frontend Vite)
   - `config/cors.php` : allowed_origins = ['http://localhost:5173'], supports_credentials = true
   - `config/queue.php` : driver = database
   - `.env` example : APP_NAME=SyndicPro, DB_DATABASE=syndicpro, QUEUE_CONNECTION=database
   - Middleware `ForceJsonResponse` enregistré globalement dans `bootstrap/app.php`
   - Middleware `CheckRole` enregistré dans le kernel

2. Produis ces fichiers exacts :
   - `app/Http/Middleware/ForceJsonResponse.php`
   - `app/Http/Middleware/CheckRole.php`
   - `bootstrap/app.php` (avec middlewares enregistrés)
   - `config/cors.php` (CORS configuré pour SPA)

### Frontend (React 18 + Vite + TypeScript)

3. Produis ces fichiers de configuration :
   - `package.json` (avec toutes les dépendances du stack)
   - `tsconfig.json` (strict: true, paths aliases @/)
   - `vite.config.ts` (proxy /api → http://localhost:8000, alias @)
   - `tailwind.config.ts` (avec TOUS les design tokens de UI_UX_SPEC.md § B — complet)
   - `postcss.config.js`
   - `src/main.tsx` (QueryClient + BrowserRouter + ToastProvider)
   - `src/App.tsx` (router avec toutes les routes de ROUTES.md)

4. Produis le store Zustand :
   - `src/store/authStore.ts` (user, role, setUser, clearUser)
   - `src/store/residenceStore.ts` (activeResidence, setActiveResidence)
   - `src/store/uiStore.ts` (sidebarCollapsed, toasts)

5. Produis les types TypeScript :
   - `src/types/entities.types.ts` (toutes les interfaces de ENTITIES.md § 10)
   - `src/types/api.types.ts` (ApiResponse<T>, PaginatedResponse<T>)
   - `src/types/enums.types.ts` (tous les types union)

6. Produis l'instance Axios :
   - `src/api/axiosInstance.ts`
     * baseURL: import.meta.env.VITE_API_URL
     * withCredentials: true
     * headers: Accept application/json, X-Requested-With XMLHttpRequest
     * Interceptor request: ajoute XSRF-Token depuis cookie
     * Interceptor response: sur 401 → clearUser + redirect /login

Règles :
- Tailwind config DOIT contenir tous les tokens (couleurs, typo, spacing, shadows, animations)
- TypeScript strict, aucun any
- Pas de logique métier ici — uniquement configuration

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 1 — Base de Données : Migrations + Models

```
Tu es un senior Laravel 13 architect.
Lis ces fichiers de contexte :
  - DATABASE.md (schéma complet)
  - ENTITIES.md (models et relations)
  - CONVENTIONS.md (nommage, soft deletes)

Tâche : Créer toutes les migrations et tous les models.

### Migrations

Produis les migrations dans cet ordre EXACT (respect des FK) :
1. `2026_01_01_000001_create_users_table.php`
2. `2026_01_01_000002_create_residences_table.php`
3. `2026_01_01_000003_create_immeubles_table.php`
4. `2026_01_01_000004_create_appartements_table.php`
5. `2026_01_01_000005_create_comptes_charges_table.php`
6. `2026_01_01_000006_create_sous_charges_table.php`
7. `2026_01_01_000007_create_depenses_table.php`
8. `2026_01_01_000008_create_hors_budgets_table.php`
9. `2026_01_01_000009_create_periodes_table.php`
10. `2026_01_01_000010_create_budgets_previsionnels_table.php`
11. `2026_01_01_000011_create_cotisations_table.php`
12. `2026_01_01_000012_create_cotisation_details_table.php`
13. `2026_01_01_000013_create_paiements_table.php`
14. `2026_01_01_000014_create_reclamations_table.php`

Chaque migration doit inclure :
- Exactement les colonnes définies dans DATABASE.md
- ENGINE InnoDB, charset utf8mb4, collation utf8mb4_unicode_ci
- Toutes les FK avec ON DELETE RESTRICT (sauf immeubles → CASCADE)
- Tous les index définis dans DATABASE.md
- Soft deletes sur users et appartements uniquement

### Enums PHP 8.1

Produis ces enums dans `app/Enums/` :
- `UserRole.php`         : cases Syndic, Coproprietaire
- `ModeRepartition.php`  : cases Egale, ParAppartement, ParTantieme
- `CotisationType.php`   : cases Fixe, Exceptionnelle
- `CotisationDetailStatut.php` : cases NonPaye, PartiellementPaye, Paye
- `ModePaiement.php`     : cases Especes, Virement, Cheque, Carte
- `ReclamationStatut.php`: cases Nouveau, EnCours, Traite, Rejete

### Models

Produis ces Models dans `app/Models/` :
Pour chaque model, inclure : fillable, casts, relationships, scopes, boot() si nécessaire.

1. `User.php` :
   - SoftDeletes, HasRoles (Spatie), HasApiTokens (Sanctum)
   - Relations : residences(), appartements(), cotisationDetails(), paiements(), reclamations()
   - Scopes : scopeActif(), scopeSyndic(), scopeCoproprietaire()
   - Cast role → UserRole enum

2. `Residence.php` :
   - Relations : syndic(), immeubles(), appartements(), compteCharges(), periodes(), cotisations(), reclamations()
   - Accessor : getNbImmeublesAttribute()

3. `Immeuble.php` :
   - Relations : residence(), appartements()

4. `Appartement.php` :
   - SoftDeletes
   - Relations : immeuble(), residence(), coproprietaire(), cotisationDetails(), reclamations()
   - Cast tantieme → decimal:4
   - Scopes : scopeActif(), scopeByResidence()

5. `CompteCharge.php` :
   - Relations : residence(), sousCharges(), budgetPrevisionnels()

6. `SousCharge.php` :
   - Relations : compteCharge(), residence(), depenses()

7. `Depense.php` :
   - InteractsWithMedia (Spatie)
   - Relations : sousCharge(), residence()
   - registerMediaCollections() : collection "justificatifs", disk "local"

8. `HorsBudget.php` :
   - InteractsWithMedia (Spatie)
   - Relations : residence()

9. `Periode.php` :
   - Relations : residence(), budgetsPrevisionnels(), cotisations()
   - Scope : scopeActive()

10. `BudgetPrevisionnel.php` :
    - Relations : periode(), compteCharge()
    - Accessor : getMontantRestantAttribute() → montant_prevu - montant_consomme
    - Accessor : getPourcentageConsommeAttribute() → (consomme/prevu) * 100
    - Accessor : getEstDepasseAttribute() → consomme > prevu

11. `Cotisation.php` :
    - Relations : residence(), periode(), cotisationDetails()

12. `CotisationDetail.php` :
    - Relations : cotisation(), appartement(), coproprietaire(), paiements()
    - Accessor : getMontantRestantAttribute() → montant - montant_paye
    - Cast statut → CotisationDetailStatut enum

13. `Paiement.php` :
    - InteractsWithMedia (Spatie)
    - Relations : cotisationDetail(), coproprietaire()
    - registerMediaCollections() : collection "recus"

14. `Reclamation.php` :
    - Relations : coproprietaire(), residence(), appartement()
    - Cast statut → ReclamationStatut enum, priorite → string

Règles :
- JAMAIS de logique dans les models
- Casts Enum sur tous les champs ENUM SQL
- PHPDoc sur chaque relation

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 2 — Seeders

```
Tu es un senior Laravel developer.
Lis ces fichiers de contexte :
  - DATABASE.md
  - ENTITIES.md
  - PROJECT.md (règles métier)

Tâche : Créer tous les seeders avec des données réalistes pour SyndicPro.

Produis ces seeders dans `database/seeders/` :

### Ordre d'exécution dans DatabaseSeeder.php
```php
$this->call([
    UserSeeder::class,
    ResidenceSeeder::class,
    ImmeubleSeeder::class,
    AppartementSeeder::class,
    CoproprietaireSeeder::class,
    CompteChargeSeeder::class,
    SousChargeSeeder::class,
    PeriodeSeeder::class,
    BudgetPrevisionnelSeeder::class,
    DepenseSeeder::class,
    CotisationSeeder::class,
    CotisationDetailSeeder::class,
    PaiementSeeder::class,
    ReclamationSeeder::class,
]);
```

### Données à créer :

**UserSeeder** :
- 1 syndic : name="Ahmed Benali", email="ahmed@syndicpro.ma", username="syndic", password=bcrypt("password"), role=syndic

**ResidenceSeeder** :
- Résidence "Résidence Maarif", Casablanca, "Rue Maarif, Quartier Maarif", syndic_id=1

**ImmeubleSeeder** :
- "Bâtiment A" et "Bâtiment B" dans la résidence

**AppartementSeeder** :
- Bâtiment A : Appt 01 (étage 0, tantième=120), Appt 02 (étage 0, tantième=110), Appt 03 (étage 1, tantième=130), Appt 04 (étage 1, tantième=115)
- Bâtiment B : Appt 05 (étage 0, tantième=125), Appt 06 (étage 0, tantième=100), Appt 07 (étage 1, tantième=140), Appt 08 (étage 1, tantième=160)
- Total tantièmes = 1000

**CoproprietaireSeeder** :
- 6 copropriétaires : Fatima Benkirane (fatima.b/password), Omar Tazi (omar.t/password), Khalid Alami (khalid.a/password), Nadia Senhaji (nadia.s/password), Youssef Fassi (youssef.f/password), Sara Chraibi (sara.c/password)
- Assigner 1 appartement par copropriétaire (6 appts sur 8, 2 sans copropriétaire)

**CompteChargeSeeder** :
- Entretien & Réparation, Jardinage, Ménage, Sécurité, Ascenseur (tous actifs)

**SousChargeSeeder** :
- Entretien & Réparation : Entretien électricité, Réparation plomberie, Peinture parties communes
- Jardinage : Entretien espaces verts, Fournitures jardinage
- Ménage : Nettoyage parties communes, Produits ménagers
- Sécurité : Gardiennage, Matériel sécurité
- Ascenseur : Contrat maintenance ascenseur, Réparation ascenseur

**PeriodeSeeder** :
- 2025 (is_active=0, dates: 01/01/2025 → 31/12/2025)
- 2026 (is_active=1, dates: 01/01/2026 → 31/12/2026)

**BudgetPrevisionnelSeeder** (période 2026) :
- Entretien & Réparation : 20 000 DH
- Jardinage : 10 000 DH
- Ménage : 8 000 DH
- Sécurité : 18 000 DH
- Ascenseur : 12 000 DH

**DepenseSeeder** (15 dépenses réalistes 2026) :
- Plusieurs par sous-charge avec montants variés
- Dates entre 01/01/2026 et 30/04/2026

**CotisationSeeder** :
- Cotisation fixe : label="Charges mensuelles", montant_mensuel=200 DH, période 2026
- Cotisation exceptionnelle : label="Réfection toiture", montant_total=12 000 DH, mode=par_tantieme, période 2026

**CotisationDetailSeeder** :
- Pour la cotisation fixe : générer 6 details (un par appartement avec copropriétaire), montant=200 DH
- Pour l'exceptionnelle : calculer selon tantièmes
  - Formula: (tantieme/1000) * 12000

**PaiementSeeder** :
- Quelques paiements complets (statut→paye), partiels (statut→partiellement_paye), aucun (statut→non_paye)
- Assurer 3 situations variées pour démo

**ReclamationSeeder** :
- 5 réclamations variées :
  - "Panne ascenseur" - urgente - nouveau (Fatima, Appt 01)
  - "Éclairage couloir défectueux" - normale - en_cours (Omar, Appt 03)
  - "Fuite d'eau hall" - urgente - traite (Khalid, Appt 05)
  - "Problème de sécurité" - normale - rejete (Nadia, Appt 07)
  - "Bruit excessif" - normale - nouveau (Sara, Appt 08)

Règles :
- Toutes les données sont réalistes (noms marocains, montants cohérents)
- Les BudgetPrevisionnels doivent avoir montant_consomme = SUM(depenses) correspondantes
- Les CotisationDetails doivent avoir montant_paye et statut cohérents avec les paiements

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 3 — Core Backend

```
Tu es un senior Laravel 13 architect.
Lis ces fichiers de contexte :
  - ARCHITECTURE.md (couches, Layer Laws)
  - CONVENTIONS.md (règles sécurité, nommage)
  - ENTITIES.md (models)

Tâche : Construire l'infrastructure transverse du backend.

### 1. BaseRepository (`app/Repositories/BaseRepository.php`)
```php
abstract class BaseRepository
{
    public function __construct(protected Model $model) {}
    public function find(int $id): Model|null
    public function findOrFail(int $id): Model
    public function create(array $data): Model
    public function update(int $id, array $data): Model
    public function delete(int $id): bool
    public function paginate(int $perPage = 20): LengthAwarePaginator
}
```

### 2. ApiResponse Helper (`app/Http/Helpers/ApiResponse.php`)
```php
class ApiResponse
{
    public static function success(mixed $data, string $message = 'Succès.', int $status = 200): JsonResponse
    public static function created(mixed $data, string $message = 'Créé avec succès.'): JsonResponse
    public static function error(string $message, int $status = 400): JsonResponse
    public static function notFound(string $message = 'Ressource introuvable.'): JsonResponse
    public static function forbidden(string $message = 'Accès non autorisé.'): JsonResponse
    public static function validationError(array $errors): JsonResponse
    public static function paginated(LengthAwarePaginator $paginator, string $resourceClass): JsonResponse
}
```

### 3. Exception Handler (`app/Exceptions/Handler.php`)
Surcharger `render()` pour intercepter :
- `ValidationException` → 422 + errors object en français
- `ModelNotFoundException` → 404 + "Ressource introuvable."
- `AuthorizationException` → 403 + "Accès non autorisé."
- `AuthenticationException` → 401 + "Non authentifié."
- `ThrottleRequestsException` → 429 + "Trop de tentatives. Réessayez dans :seconds secondes."
- `Exception` générique → 500 + "Une erreur inattendue s'est produite." (ne pas exposer détails en prod)

### 4. Middlewares

**ForceJsonResponse** :
```php
$request->headers->set('Accept', 'application/json');
return $next($request);
```

**CheckRole** :
- Vérifie `$request->user()->hasRole($role)` via Spatie
- Sinon : ApiResponse::forbidden()

**EnsureResidenceOwnership** (optionnel, pour les routes imbriquées) :
- Vérifie que `residence.syndic_id === auth()->id()`

### 5. AppServiceProvider
- Enregistrer tous les Observers :
  - `Depense::observe(DepenseObserver::class)`
  - `Paiement::observe(PaiementObserver::class)`
- Enregistrer les policies :
  - `Gate::policy(Residence::class, ResidencePolicy::class)`
  - etc.

### 6. EventServiceProvider
- Mapper Events → Listeners :
  - `CotisationCreated` → `[OnCotisationCreated::class]`
  - `PaiementRecorded` → `[OnPaiementRecorded::class]`
  - `ReclamationUpdated` → `[OnReclamationUpdated::class]`

### 7. Spatie Roles Setup
Dans `database/seeders/RoleSeeder.php` :
```php
Role::create(['name' => 'syndic']);
Role::create(['name' => 'coproprietaire']);
// Assigner role au syndic seed : $user->assignRole('syndic')
```

Règles Layer Laws :
- Le BaseRepository ne doit PAS contenir de logique métier
- L'ApiResponse est un helper statique — pas un Service
- Le Handler doit masquer les détails d'erreur en production (APP_DEBUG=false)

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 4 — Système d'Authentification

```
Tu es un senior Laravel 13 / React 18 developer.
Lis ces fichiers de contexte :
  - ARCHITECTURE.md (§ 6 stratégie auth)
  - ROUTES.md (routes auth)
  - API.md (groupe 1 Auth)
  - CONVENTIONS.md (sécurité)
  - UI_UX_SPEC.md (design login page)

Tâche : Implémenter le système d'authentification complet.

### Backend

1. `app/Http/Controllers/Auth/AuthController.php`
   - `login(LoginRequest $request)` :
     * Tente `Auth::attempt(['username' => $request->username, 'password' => $request->password])`
     * Vérifie `user->is_active === true` → sinon 403 "Votre compte est désactivé."
     * Crée session Sanctum
     * Retourne `UserResource` avec role
   - `logout(Request $request)` :
     * `Auth::logout()`, invalide session
     * Retourne 200 + message
   - `me(Request $request)` :
     * Retourne `UserResource` de l'utilisateur connecté

2. `app/Http/Requests/Auth/LoginRequest.php`
   ```php
   rules: ['username' => 'required|string', 'password' => 'required|string']
   messages: ['username.required' => 'Le nom d\'utilisateur est obligatoire.',
              'password.required' => 'Le mot de passe est obligatoire.']
   ```

3. `app/Http/Resources/UserResource.php`
   - Expose : id, name, email, phone, role (value string), username, is_active

4. Sanctum config :
   - `config/sanctum.php` : stateful = ['localhost:5173', '127.0.0.1:5173']
   - Vérifier SESSION_DOMAIN et SANCTUM_STATEFUL_DOMAINS dans .env

### Frontend

5. `src/pages/auth/LoginPage.tsx`
   Design premium (référence UI_UX_SPEC.md) :
   - Fond split : gauche brand-950 avec logo + tagline, droite formulaire
   - Logo "SyndicPro" en grand
   - Tagline : "Gérez votre copropriété en toute simplicité."
   - Formulaire :
     * Label "Nom d'utilisateur" + input avec icône personne
     * Label "Mot de passe" + input avec toggle show/hide
     * Bouton "Se connecter" primary large
     * État loading : spinner dans le bouton
   - Framer Motion : fade-in du formulaire au mount (y: 20 → 0, opacity: 0 → 1)
   - Messages d'erreur en français sous le formulaire
   - Validation Zod : username required, password required min 1 char

6. `src/api/auth.api.ts`
   ```typescript
   export const login = async (credentials: { username: string; password: string }) => {
     await axiosInstance.get('/sanctum/csrf-cookie');
     const { data } = await axiosInstance.post<ApiResponse<{ user: User }>>('/api/auth/login', credentials);
     return data;
   };
   export const logout = () => axiosInstance.post('/api/auth/logout');
   export const getMe = () => axiosInstance.get<ApiResponse<User>>('/api/auth/me');
   ```

7. `src/hooks/useAuth.ts`
   - `useLogin()` : mutation React Query → setUser dans store → navigate selon role
   - `useLogout()` : mutation → clearUser → navigate('/login')
   - `useCurrentUser()` : query GET /me pour hydrater store au reload

8. `src/router/ProtectedRoute.tsx` + `src/router/RoleGuard.tsx`
   - ProtectedRoute : vérifie authStore.user, sinon redirect /login
   - RoleGuard : vérifie role, sinon redirect /login

Tester :
- Login syndic → redirect /syndic/dashboard
- Login copropriétaire → redirect /coproprietaire/dashboard
- Login échoué → message "Identifiants incorrects."
- Compte désactivé → message "Votre compte est désactivé."
- Route protégée sans auth → redirect /login
- Route syndic avec rôle copropriétaire → redirect /login

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 5 — CRUD Résidences, Immeubles, Appartements, Copropriétaires

```
Tu es un senior Laravel 13 / React 18 developer.
Lis ces fichiers de contexte :
  - ARCHITECTURE.md (Layer Laws)
  - ENTITIES.md (models, services, policies, FormRequests, Resources)
  - API.md (groupes 2, 3, 4, 5)
  - ROUTES.md (routes syndic)
  - CONVENTIONS.md (sécurité, messages français)
  - UI_UX_SPEC.md (§ E pages 9, tables, modales)

Tâche : Implémenter CRUD complet pour les 4 entités principales.

### Backend — Pour chaque entité (Residence, Immeuble, Appartement, Coproprietaire)

**Pattern obligatoire** :
- Repository (`app/Repositories/{Entite}Repository.php`) :
  * Méthodes Eloquent avec eager loading
  * Ex: ResidenceRepository::findBySyndic() → with(['immeubles', 'appartements.coproprietaire'])
- Service (`app/Services/{Entite}Service.php`) :
  * Orchestration : appelle Repository
  * Pas d'Eloquent direct
- Controller (`app/Http/Controllers/Syndic/{Entite}Controller.php`) :
  * Max 7 méthodes, max 20 lignes/méthode
  * Appelle uniquement Service
  * Retourne Resource
- FormRequests (`Store{Entite}Request`, `Update{Entite}Request`) :
  * Validation complète avec messages français
  * authorize() vérifie Policy si applicable
- Resource (`{Entite}Resource.php`) :
  * Expose uniquement les champs nécessaires
  * Relations conditionnelles ($this->whenLoaded())
- Policy :
  * ResidencePolicy : toutes méthodes vérifient syndic_id
  * Autres : héritent de la vérification résidence

**Résidence** :
- CRUD standard + ResidencePolicy
- findBySyndic() avec stats (nb_immeubles, nb_appartements)

**Immeuble** :
- Nested sous résidence
- Validation : nom unique dans la résidence

**Appartement** :
- CRUD + endpoint `assigner` copropriétaire
- Soft delete
- Validation tantième > 0

**Copropriétaire** :
- Création : génère username unique si collision (appended numéro)
- reset-password : hash + update
- toggle-actif : bascule is_active

### Frontend

**Composants réutilisables** (dans `src/components/ui/`) :
1. `DataTable.tsx` :
   - Props : columns[], data[], isLoading, pagination, onSort
   - Features : tri colonnes (flèche rotate), stagger row animation, skeleton loader, état vide
   - Mobile : overflow-x-auto + sticky first column

2. `Modal.tsx` :
   - Props : isOpen, onClose, title, children, footer
   - Animation : backdrop fade + slide-up spring (Framer Motion)
   - Trap focus, ESC pour fermer

3. `FormField.tsx` :
   - Props : label, error, required, children
   - Style : label au-dessus, focus ring brand, erreur en rouge dessous

4. `ConfirmDialog.tsx` :
   - Props : isOpen, onConfirm, onCancel, title, message, confirmLabel
   - Bouton confirmer : rouge bg-danger

5. `StatusBadge.tsx` :
   - Props : statut (string)
   - Mapping statut → couleur + label (voir UI_UX_SPEC.md § C)

6. `EmptyState.tsx` :
   - Props : title, description, action?
   - SVG illustration + texte + bouton CTA optionnel

**Pages** :
1. `ResidencesPage.tsx` — cards (pas table), bouton "+ Nouvelle résidence"
2. `ImmeublesPage.tsx` — table filtrée par résidence, CRUD
3. `AppartementsPage.tsx` — table avec bouton "Assigner" inline si pas de copropriétaire
4. `CoproprietairesPage.tsx` — table + drawer

**CoproprietaireDrawer.tsx** :
- Panel latéral droit (width 400px) qui slide depuis la droite
- Sections : Informations | Appartements | Cotisations summary | Derniers paiements | Réclamations
- Fermeture par ×, ESC, ou clic extérieur

**Hooks** :
- `useResidences.ts` : useQuery + useMutation (create, update, delete)
- `useImmeubles.ts`
- `useAppartements.ts`
- `useCoproprietaires.ts`

**Validation Zod (messages français)** :
```typescript
// Exemple ResidenceSchema
const residenceSchema = z.object({
  nom:     z.string().min(1, 'Le nom est obligatoire.').max(150),
  ville:   z.string().min(1, 'La ville est obligatoire.'),
  adresse: z.string().min(1, 'L\'adresse est obligatoire.'),
});
```

Règles de sécurité à vérifier :
- Un syndic ne voit que ses propres résidences (Policy + Repository filter par syndic_id)
- Un copropriétaire ne peut pas accéder aux routes /syndic/*
- Tous les FormRequests valident l'appartenance à la résidence du syndic

Ne passez pas à la phase suivante sans mon approbation.
```
