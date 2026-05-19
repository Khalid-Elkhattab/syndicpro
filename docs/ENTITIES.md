# ENTITIES.md — SyndicPro
## Définitions Complètes des Entités

---

## 1. User

### Model `app/Models/User.php`
```php
protected $fillable = [
    'name', 'email', 'phone', 'role', 'username', 'password', 'is_active',
];
protected $hidden = ['password', 'remember_token'];
protected $casts = [
    'role'      => UserRole::class,
    'is_active' => 'boolean',
    'deleted_at'=> 'datetime',
];
// Relations
public function residences(): HasMany        // syndic → ses résidences
public function appartements(): HasMany      // copropriétaire → ses appartements
public function cotisationDetails(): HasMany // copropriétaire → ses cotisation_details
public function paiements(): HasMany
public function reclamations(): HasMany
// Scopes
public function scopeActif($q): Builder { return $q->where('is_active', true); }
public function scopeSyndic($q): Builder { return $q->where('role', UserRole::Syndic); }
public function scopeCoproprietaire($q): Builder { return $q->where('role', UserRole::Coproprietaire); }
```

### FormRequests
**StoreCoproprietaireRequest**
```php
rules: [
  'name'     => 'required|string|max:100',
  'email'    => 'required|email|unique:users,email',
  'phone'    => 'nullable|string|max:20',
  'username' => 'required|string|max:50|unique:users,username|alpha_num',
  'password' => 'required|string|min:8|confirmed',
]
messages: [
  'name.required'     => 'Le nom est obligatoire.',
  'email.unique'      => 'Cet email est déjà utilisé.',
  'username.unique'   => 'Ce nom d\'utilisateur est déjà pris.',
  'username.alpha_num'=> 'Le nom d\'utilisateur ne doit contenir que des lettres et chiffres.',
  'password.min'      => 'Le mot de passe doit contenir au moins 8 caractères.',
  'password.confirmed'=> 'La confirmation du mot de passe ne correspond pas.',
]
```

### Resource `UserResource`
```php
'id', 'name', 'email', 'phone', 'role', 'username', 'is_active', 'created_at'
```

### Policy `UserPolicy`
| Méthode | Syndic | Copropriétaire |
|---------|--------|----------------|
| viewAny | ✅ propres copropriétaires | ❌ |
| view    | ✅ si appartient à sa résidence | ✅ soi-même |
| create  | ✅ | ❌ |
| update  | ✅ | ❌ |
| delete  | ✅ (soft) | ❌ |

### TypeScript Interface
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'syndic' | 'coproprietaire';
  username: string;
  is_active: boolean;
  created_at: string;
}
```

---

## 2. Residence

### Model `app/Models/Residence.php`
```php
protected $fillable = ['syndic_id', 'nom', 'ville', 'adresse'];
protected $casts    = ['created_at' => 'datetime', 'updated_at' => 'datetime'];
// Relations
public function syndic(): BelongsTo
public function immeubles(): HasMany
public function appartements(): HasMany
public function comptes_charges(): HasMany
public function periodes(): HasMany
public function cotisations(): HasMany
public function reclamations(): HasMany
// Computed
public function getNbImmeublesAttribute(): int { return $this->immeubles()->count(); }
```

### Repository `ResidenceRepository`
```php
findBySyndic(int $syndicId): Collection          // eager: immeubles, periodes actives
findWithStats(int $id): Residence                // eager: immeubles.appartements.coproprietaire
findActivePeriode(int $residenceId): ?Periode
```

### Service `ResidenceService`
```php
create(array $data, int $syndicId): Residence
update(int $id, array $data): Residence
getWithStats(int $syndicId): Collection
```

### FormRequests
**StoreResidenceRequest / UpdateResidenceRequest**
```php
rules: [
  'nom'     => 'required|string|max:150',
  'ville'   => 'required|string|max:100',
  'adresse' => 'required|string|max:500',
]
messages: [
  'nom.required'     => 'Le nom de la résidence est obligatoire.',
  'ville.required'   => 'La ville est obligatoire.',
  'adresse.required' => 'L\'adresse est obligatoire.',
]
```

### Resource `ResidenceResource`
```php
'id', 'nom', 'ville', 'adresse', 'nb_immeubles',
'syndic' => UserResource (when loaded),
'periodes' => PeriodeResource::collection (when loaded),
'created_at'
```

### Policy `ResidencePolicy`
```php
// RÈGLE DE SÉCURITÉ CRITIQUE
public function view(User $user, Residence $residence): bool {
    return $user->id === $residence->syndic_id;
}
// Toutes les méthodes (viewAny, create, update, delete) : même vérification
```

### TypeScript Interface
```typescript
interface Residence {
  id: number;
  nom: string;
  ville: string;
  adresse: string;
  nb_immeubles: number;
  created_at: string;
}
```

---

## 3. Appartement

### Model `app/Models/Appartement.php`
```php
protected $fillable = ['numero', 'etage', 'immeuble_id', 'residence_id', 'coproprietaire_id', 'tantieme'];
protected $casts    = ['tantieme' => 'decimal:4', 'deleted_at' => 'datetime'];
// Relations
public function immeuble(): BelongsTo
public function residence(): BelongsTo
public function coproprietaire(): BelongsTo
public function cotisationDetails(): HasMany
public function reclamations(): HasMany
// Scopes
public function scopeActif($q): Builder { return $q->whereNull('deleted_at'); }
public function scopeByResidence($q, int $residenceId): Builder
```

### TypeScript Interface
```typescript
interface Appartement {
  id: number;
  numero: string;
  etage: number;
  tantieme: number;
  immeuble: Immeuble;
  residence: Residence;
  coproprietaire: User | null;
}
```

---

## 4. BudgetService (Critique)

```php
class BudgetService
{
    public function __construct(
        private BudgetPrevisionnelRepository $budgetRepo,
        private DepenseRepository $depenseRepo,
        private PeriodeRepository $periodeRepo,
    ) {}

    /**
     * Crée une nouvelle période annuelle pour une résidence.
     */
    public function createPeriode(array $data, int $residenceId): Periode

    /**
     * Définit ou met à jour le budget prévisionnel d'un compte charge pour une période.
     */
    public function setBudget(int $periodeId, int $compteChargeId, float $montant): BudgetPrevisionnel

    /**
     * Recalcule montant_consomme pour un budget prévisionnel.
     * Appelé par DepenseObserver sur created/updated/deleted.
     * Invalide le cache après recalcul.
     */
    public function recalculerConsomme(int $budgetPrevisionnelId): void
    {
        $budget = $this->budgetRepo->findWithCompteCharge($budgetPrevisionnelId);

        $consomme = $this->depenseRepo->sumByCompteCharge(
            $budget->compte_charge_id,
            $budget->periode_id
        );

        $this->budgetRepo->updateConsomme($budgetPrevisionnelId, $consomme);
        Cache::forget("budget_summary_{$budget->periode_id}");
    }

    /**
     * Retourne le résumé complet du budget pour une période.
     * Résultat mis en cache.
     */
    public function getBudgetSummary(int $periodeId): array
    {
        return Cache::remember("budget_summary_{$periodeId}", now()->addDay(), function () use ($periodeId) {
            return $this->budgetRepo->getSummaryByPeriode($periodeId);
        });
    }

    /**
     * Vérifie si un budget est dépassé.
     * @return bool true si montant_consomme > montant_prevu
     */
    public function checkDepassement(int $budgetPrevisionnelId): bool
    {
        $budget = $this->budgetRepo->find($budgetPrevisionnelId);
        return $budget->montant_consomme > $budget->montant_prevu;
    }
}
```

---

## 5. CotisationService (Critique)

```php
class CotisationService
{
    public function __construct(
        private CotisationRepository $cotisationRepo,
        private AppartementRepository $appartementRepo,
    ) {}

    /** Crée une cotisation mensuelle fixe */
    public function createCotisationFixe(array $data, int $residenceId): Cotisation

    /** Crée une cotisation exceptionnelle et génère les détails */
    public function createCotisationExceptionnelle(array $data, int $residenceId): Cotisation
    {
        $cotisation = $this->cotisationRepo->create([...$data, 'residence_id' => $residenceId, 'type' => 'exceptionnelle']);
        $this->generateDetails($cotisation->id, $data['mode_repartition'], $data['montants_map'] ?? []);
        event(new CotisationCreated($cotisation));
        return $cotisation->load('cotisationDetails');
    }

    /**
     * Génère les cotisation_details selon le mode de répartition.
     * ⚠️ Utilise les appartements ACTIFS de la résidence au moment de l'appel.
     */
    public function generateDetails(int $cotisationId, string $mode, array $montantsMap = []): Collection
    {
        $cotisation   = $this->cotisationRepo->findWithResidence($cotisationId);
        $appartements = $this->appartementRepo->findActifsByResidence($cotisation->residence_id);

        $details = match($mode) {
            'egale'           => $this->calculerRepartitionEgale($cotisation, $appartements),
            'par_appartement' => $this->calculerRepartitionParAppartement($cotisation, $appartements, $montantsMap),
            'par_tantieme'    => $this->calculerRepartitionParTantieme($cotisation, $appartements),
        };

        return $this->cotisationRepo->bulkCreateDetails($details);
    }

    /** Mode A : montant = total / nb_appartements */
    public function calculerRepartitionEgale(Cotisation $cotisation, Collection $appartements): array
    {
        $montantParAppart = round($cotisation->montant_total / $appartements->count(), 2);
        return $appartements->map(fn($a) => [
            'cotisation_id'     => $cotisation->id,
            'appartement_id'    => $a->id,
            'coproprietaire_id' => $a->coproprietaire_id,
            'montant'           => $montantParAppart,
            'statut'            => CotisationDetailStatut::NonPaye,
        ])->toArray();
    }

    /** Mode B : montant défini manuellement par appartement */
    public function calculerRepartitionParAppartement(Cotisation $cotisation, Collection $appartements, array $montantsMap): array

    /**
     * Mode C : montant = (tantieme_appart / SUM(tantièmes actifs)) * montant_total
     * ⚠️ SUM(tantièmes) calculé sur les appartements ACTIFS de la résidence
     */
    public function calculerRepartitionParTantieme(Cotisation $cotisation, Collection $appartements): array
    {
        $totalTantiemes = $appartements->sum('tantieme');
        if ($totalTantiemes == 0) throw new \LogicException('Total tantièmes = 0, répartition impossible.');

        return $appartements->map(fn($a) => [
            'cotisation_id'     => $cotisation->id,
            'appartement_id'    => $a->id,
            'coproprietaire_id' => $a->coproprietaire_id,
            'montant'           => round(($a->tantieme / $totalTantiemes) * $cotisation->montant_total, 2),
            'statut'            => CotisationDetailStatut::NonPaye,
        ])->toArray();
    }

    /** Retourne les impayés regroupés par copropriétaire pour une résidence */
    public function getImpayesByCoproprietaire(int $residenceId): Collection

    /** Retourne les impayés pour une période donnée */
    public function getImpayesByPeriode(int $periodeId): Collection
}
```

---

## 6. PaiementService (Critique)

```php
class PaiementService
{
    /**
     * Enregistre un paiement (complet ou partiel).
     * ⚠️ Validation : montant <= (cotisation_detail.montant - montant_paye)
     * Déclenche GenerateReceipt job en queue.
     */
    public function enregistrerPaiement(int $cotisationDetailId, array $data): Paiement
    {
        $detail = $this->paiementRepo->findDetail($cotisationDetailId);
        $resteAPayer = $detail->montant - $detail->montant_paye;

        if ($data['montant'] > $resteAPayer) {
            throw new \InvalidArgumentException(
                "Le montant saisi ({$data['montant']} DH) dépasse le restant à payer ({$resteAPayer} DH)."
            );
        }

        $paiement = $this->paiementRepo->create([
            ...$data,
            'cotisation_detail_id' => $cotisationDetailId,
            'coproprietaire_id'    => $detail->coproprietaire_id,
        ]);

        event(new PaiementRecorded($paiement));
        GenerateReceipt::dispatch($paiement->id)->onQueue('receipts');
        return $paiement;
    }

    /**
     * Met à jour statut + montant_paye du cotisation_detail.
     * Appelé par PaiementObserver.
     */
    public function updateCotisationDetailStatut(int $cotisationDetailId): void
    {
        $detail       = $this->paiementRepo->findDetail($cotisationDetailId);
        $totalPaye    = $this->paiementRepo->sumPaiementsByDetail($cotisationDetailId);
        $nouveauStatut = match(true) {
            $totalPaye >= $detail->montant => CotisationDetailStatut::Paye,
            $totalPaye > 0                 => CotisationDetailStatut::PartiellementPaye,
            default                        => CotisationDetailStatut::NonPaye,
        };

        $this->paiementRepo->updateDetail($cotisationDetailId, [
            'montant_paye' => $totalPaye,
            'statut'       => $nouveauStatut,
        ]);
    }

    /** Génère le PDF du reçu — appelé par GenerateReceipt job */
    public function genererRecu(int $paiementId): string  // retourne path

    /** Historique des paiements par appartement */
    public function getHistoriqueByAppartement(int $appartementId): Collection

    /** Total perçu sur une période pour une résidence */
    public function getTotalPercu(int $residenceId, int $periodeId): float
}
```

---

## 7. ReclamationService

```php
class ReclamationService
{
    /**
     * Crée une réclamation par un copropriétaire.
     * Notifie le syndic de la résidence.
     */
    public function create(array $data, int $coproprietaireId): Reclamation
    {
        $reclamation = $this->reclamationRepo->create([
            ...$data,
            'coproprietaire_id' => $coproprietaireId,
            'statut'            => ReclamationStatut::Nouveau,
        ]);
        // Notifier le syndic
        $syndic = $reclamation->residence->syndic;
        $syndic->notify(new NouvelleReclamationNotification($reclamation));
        return $reclamation;
    }

    /**
     * Met à jour statut + réponse du syndic.
     * Notifie le copropriétaire.
     */
    public function updateStatut(int $reclamationId, string $statut, ?string $reponse): Reclamation
    {
        $reclamation = $this->reclamationRepo->update($reclamationId, [
            'statut'        => $statut,
            'reponse_syndic'=> $reponse,
            'date_reponse'  => now(),
        ]);
        event(new ReclamationUpdated($reclamation));
        return $reclamation;
    }

    public function getByResidence(int $residenceId, array $filters): LengthAwarePaginator
    public function getByCoproprietaire(int $coproprietaireId): Collection
}
```

---

## 8. Observers

### `DepenseObserver`
```php
class DepenseObserver
{
    public function __construct(private BudgetService $budgetService) {}

    public function created(Depense $depense): void  { $this->recalculer($depense); }
    public function updated(Depense $depense): void  { $this->recalculer($depense); }
    public function deleted(Depense $depense): void  { $this->recalculer($depense); }

    private function recalculer(Depense $depense): void
    {
        // Trouve le BudgetPrevisionnel correspondant
        $budget = BudgetPrevisionnel::query()
            ->whereHas('compteCharge.sousCharges', fn($q) => $q->where('id', $depense->sous_charge_id))
            ->where('periode_id', function ($q) use ($depense) {
                $q->select('id')->from('periodes')
                  ->where('residence_id', $depense->residence_id)
                  ->where('is_active', 1)->limit(1);
            })->first();

        if ($budget) {
            $this->budgetService->recalculerConsomme($budget->id);
        }
    }
}
```

### `PaiementObserver`
```php
class PaiementObserver
{
    public function __construct(private PaiementService $paiementService) {}

    public function created(Paiement $paiement): void
    {
        $this->paiementService->updateCotisationDetailStatut($paiement->cotisation_detail_id);
    }

    public function deleted(Paiement $paiement): void
    {
        $this->paiementService->updateCotisationDetailStatut($paiement->cotisation_detail_id);
    }
}
```

---

## 9. Policies Complètes

### `ResidencePolicy`
```php
public function viewAny(User $user): bool         { return $user->role === UserRole::Syndic; }
public function view(User $user, Residence $r): bool { return $user->id === $r->syndic_id; }
public function create(User $user): bool          { return $user->role === UserRole::Syndic; }
public function update(User $user, Residence $r): bool { return $user->id === $r->syndic_id; }
public function delete(User $user, Residence $r): bool { return $user->id === $r->syndic_id; }
```

### `CotisationPolicy`
```php
public function viewAny(User $user, Residence $r): bool { return $user->id === $r->syndic_id; }
public function create(User $user, Residence $r): bool  { return $user->id === $r->syndic_id; }
public function viewMine(User $user, CotisationDetail $cd): bool {
    return $user->id === $cd->coproprietaire_id;
}
```

### `ReclamationPolicy`
```php
public function create(User $user, Residence $r): bool    { return $user->role === UserRole::Coproprietaire; }
public function view(User $user, Reclamation $rec): bool  {
    return $user->id === $rec->coproprietaire_id || $user->id === $rec->residence->syndic_id;
}
public function updateStatut(User $user, Reclamation $rec): bool {
    return $user->id === $rec->residence->syndic_id;
}
```

### `BudgetPolicy`
```php
public function manage(User $user, Residence $r): bool { return $user->id === $r->syndic_id; }
```

---

## 10. TypeScript Interfaces Complètes

```typescript
// types/entities.types.ts

interface Immeuble {
  id: number;
  nom: string;
  residence_id: number;
  residence?: Residence;
  appartements?: Appartement[];
}

interface CompteCharge {
  id: number;
  nom: string;
  description: string | null;
  is_active: boolean;
  residence_id: number;
  sous_charges?: SousCharge[];
}

interface SousCharge {
  id: number;
  nom: string;
  description: string | null;
  compte_charge_id: number;
  residence_id: number;
  compte_charge?: CompteCharge;
}

interface Depense {
  id: number;
  sous_charge_id: number;
  residence_id: number;
  date: string;
  montant: number;
  description: string;
  justificatif_url: string | null;
  sous_charge?: SousCharge;
}

interface Periode {
  id: number;
  residence_id: number;
  annee: number;
  is_active: boolean;
  date_debut: string;
  date_fin: string;
}

interface BudgetPrevisionnel {
  id: number;
  periode_id: number;
  compte_charge_id: number;
  montant_prevu: number;
  montant_consomme: number;
  montant_restant: number;   // calculé: prevu - consomme
  pourcentage_consomme: number;
  est_depasse: boolean;
  compte_charge?: CompteCharge;
  sous_charges_detail?: SousChargeDetail[];
}

interface SousChargeDetail {
  sous_charge: SousCharge;
  consomme: number;
}

interface BudgetSummary {
  prevu_total: number;
  consomme_total: number;
  restant_total: number;
  hors_budget_total: number;
  par_compte: BudgetPrevisionnel[];
}

interface Cotisation {
  id: number;
  residence_id: number;
  periode_id: number;
  type: 'fixe' | 'exceptionnelle';
  label: string;
  montant_total: number;
  montant_mensuel: number | null;
  mode_repartition: 'egale' | 'par_appartement' | 'par_tantieme' | null;
  mois: number | null;
  annee: number | null;
  description: string | null;
  details?: CotisationDetail[];
}

interface CotisationDetail {
  id: number;
  cotisation_id: number;
  appartement_id: number;
  coproprietaire_id: number;
  montant: number;
  montant_paye: number;
  montant_restant: number;  // calculé: montant - montant_paye
  statut: 'non_paye' | 'partiellement_paye' | 'paye';
  appartement?: Appartement;
  coproprietaire?: User;
  paiements?: Paiement[];
}

interface Paiement {
  id: number;
  cotisation_detail_id: number;
  coproprietaire_id: number;
  date_paiement: string;
  montant: number;
  mode_paiement: 'especes' | 'virement' | 'cheque' | 'carte';
  reference: string | null;
  recu_url: string | null;
  cotisation_detail?: CotisationDetail;
  coproprietaire?: User;
}

interface Reclamation {
  id: number;
  coproprietaire_id: number;
  residence_id: number;
  appartement_id: number;
  titre: string;
  description: string;
  statut: 'nouveau' | 'en_cours' | 'traite' | 'rejete';
  priorite: 'normale' | 'urgente';
  reponse_syndic: string | null;
  date_reponse: string | null;
  coproprietaire?: User;
  residence?: Residence;
  appartement?: Appartement;
  created_at: string;
}

// API Envelope
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, string[]>;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Enums
type ModeRepartition = 'egale' | 'par_appartement' | 'par_tantieme';
type CotisationDetailStatut = 'non_paye' | 'partiellement_paye' | 'paye';
type ReclamationStatut = 'nouveau' | 'en_cours' | 'traite' | 'rejete';
type ModePaiement = 'especes' | 'virement' | 'cheque' | 'carte';
```
