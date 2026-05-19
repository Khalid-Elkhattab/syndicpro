# PHASE_PROMPTS_B.md — SyndicPro
## Prompts Phases 6 à 13 — Paste-Ready

---

## PHASE 6 — API Charges (Comptes, Sous-Charges, Dépenses, Hors Budget)

```
Tu es un senior Laravel 13 developer.
Lis ces fichiers de contexte :
  - ARCHITECTURE.md (Layer Laws, stockage Spatie § 13)
  - ENTITIES.md (models CompteCharge, SousCharge, Depense, HorsBudget)
  - API.md (groupes 6, 7, 8, 9)
  - CONVENTIONS.md (uploads, sécurité, messages français)
  - UI_UX_SPEC.md (§ E page 4 — Charges & Dépenses)

Tâche : Implémenter le module Charges & Dépenses complet.

### Backend

**Comptes Charges** :
1. `CompteChargeRepository` :
   - `findByResidence(int $residenceId)` : with(['sousCharges', 'budgetPrevisionnels'])
   - `findWithSousCharges(int $id)` : eager load sous-charges

2. `CompteChargeController` :
   - `index()` : liste des comptes de la résidence (filtré par résidence du syndic)
   - `store()` : crée compte charge
   - `update()` : modifie nom/description/is_active
   - `destroy()` : refuse si sous-charges ou budgets associés → 409 "Ce compte a des sous-charges associées."

3. `StoreCompteChargeRequest` / `UpdateCompteChargeRequest` :
   ```php
   'nom'         => 'required|string|max:150|unique:comptes_charges,nom,{id},id,residence_id,{residence_id}',
   'description' => 'nullable|string|max:500',
   'is_active'   => 'sometimes|boolean',
   ```

4. `CompteChargeResource` : id, nom, description, is_active, nb_sous_charges, created_at

---

**Sous-Charges** :
5. `SousChargeRepository` :
   - `findByCompteCharge(int $compteChargeId)` : with(['compteCharge'])

6. `SousChargeController` : CRUD standard
7. `StoreSousChargeRequest` :
   ```php
   'nom'         => 'required|string|max:150|unique:sous_charges,nom,NULL,id,compte_charge_id,{compte_charge_id}',
   'description' => 'nullable|string|max:500',
   ```
   - `authorize()` : vérifie que compteCharge appartient à une résidence du syndic connecté

8. `SousChargeResource` : id, nom, description, compte_charge (whenLoaded), residence_id

---

**Dépenses** :
9. `DepenseRepository` :
   - `findByResidence(int $residenceId, array $filters)` : paginate, filtres sous_charge_id, date range
   - `sumByCompteCharge(int $compteChargeId, int $periodeId)` : SUM(montant) via sous_charges

10. `DepenseController` :
    - `index()` : liste paginée avec filtres
    - `store()` : crée dépense + upload justificatif
    - `update()` : modifie champs texte (PAS l'upload — nouvel upload = nouveau fichier)
    - `destroy()` : supprime dépense + média associé
    - `justificatif()` : retourne signed URL temporaire 60 min

11. `StoreDepenseRequest` :
    ```php
    'sous_charge_id'  => 'required|exists:sous_charges,id',
    'date'            => 'required|date|before_or_equal:today',
    'montant'         => 'required|numeric|min:0.01|max:999999.99',
    'description'     => 'required|string|max:1000',
    'justificatif'    => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
    ```
    Messages :
    ```php
    'montant.min' => 'Le montant doit être supérieur à 0.',
    'date.before_or_equal' => 'La date ne peut pas être dans le futur.',
    'justificatif.mimes'   => 'Le fichier doit être au format PDF, JPG ou PNG.',
    'justificatif.max'     => 'Le fichier ne doit pas dépasser 5 Mo.',
    ```
    `authorize()` : vérifie que sous_charge appartient à une résidence du syndic

12. `DepenseResource` : id, sous_charge, date (DD/MM/YYYY), montant, description, has_justificatif, justificatif_url (signed si disponible), created_at

---

**Hors Budget** :
13. `HorsBudgetController` : CRUD identique à Dépenses mais sans sous_charge_id
14. `StoreHorsBudgetRequest` :
    ```php
    'date'         => 'required|date|before_or_equal:today',
    'montant'      => 'required|numeric|min:0.01',
    'description'  => 'required|string|max:1000',
    'justificatif' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
    ```
15. `HorsBudgetResource`

---

### Frontend

**ChargesDepensesPage.tsx** avec 4 onglets :

Onglet 1 — Comptes Charges :
- Table : Nom | Nb Sous-Charges | Statut | Actions (modifier, toggle actif, supprimer)
- Modal création/édition : nom + description + is_active toggle
- Confirmation suppression (avec warning si sous-charges)

Onglet 2 — Sous-Charges :
- Filtre par compte charge (select en haut)
- Table : Sous-Charge | Compte | Description | Actions
- Modal création : dropdown comptes + nom + description

Onglet 3 — Dépenses :
- Filtres : compte charge, date range
- Table : Date | Sous-Charge | Compte | Montant (font-mono) | Description | 📎 | Actions
- Icône 📎 si justificatif → onClick ouvre dans nouvel onglet (signed URL)
- Modal création : sous-charge (grouped dropdown), date, montant, description, upload fichier
  * Upload : zone drag & drop + bouton + prévisualisation nom fichier
  * Montant : input font-mono, formatage live

Onglet 4 — Hors Budget :
- Identique aux Dépenses mais sans filtre sous-charge
- Fond légèrement différent (warning-light) pour signaler les dépenses exceptionnelles

**Composant DepenseSidePanel.tsx** (utilisé depuis BudgetPage) :
- Panel slide-in droit listant les dépenses d'une sous-charge
- Déclenché par clic sur ligne expandée dans BudgetTable

**Hooks** :
- `useCharges.ts` : useQuery comptes charges + sous-charges
- `useDepenses.ts` : useQuery paginé + useMutation (create, update, delete)
- `useHorsBudgets.ts`

**API Functions** (`src/api/`) :
- `compteCharge.api.ts` : index, store, update, destroy
- `sousCharge.api.ts` : index, store, update, destroy
- `depense.api.ts` : index, store, update, destroy, getJustificatifUrl
- `horsBudget.api.ts` : index, store, update, destroy

**Validation Zod (français)** :
```typescript
const depenseSchema = z.object({
  sous_charge_id: z.number({ required_error: 'La sous-charge est obligatoire.' }),
  date:           z.string().min(1, 'La date est obligatoire.'),
  montant:        z.number().positive('Le montant doit être supérieur à 0.'),
  description:    z.string().min(1, 'La description est obligatoire.').max(1000),
  justificatif:   z.instanceof(File).optional(),
});
```

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 7 — Budget Prévisionnel

```
Tu es un senior Laravel 13 developer.
Lis ces fichiers de contexte :
  - PROJECT.md (§ 4.1 Budget Prévisionnel — règles de calcul)
  - ARCHITECTURE.md (§ 7 machine à états budget, § 9 cache, § 12 stratégie cache)
  - ENTITIES.md (§ 4 BudgetService, § 8 DepenseObserver)
  - API.md (groupe 10)
  - UI_UX_SPEC.md (§ E page 3 — Budget Prévisionnel)

Tâche : Implémenter le module Budget Prévisionnel complet.

### Backend — Service + Observer + Cache

1. `BudgetPrevisionnelRepository` :
   ```php
   public function findByPeriode(int $periodeId): Collection
   public function findWithCompteCharge(int $id): BudgetPrevisionnel  // eager: compteCharge
   public function getSummaryByPeriode(int $periodeId): array
   // Retourne :
   // {
   //   prevu_total, consomme_total, restant_total, hors_budget_total,
   //   par_compte: [ { id, compteCharge, montant_prevu, montant_consomme,
   //                   montant_restant, pourcentage_consomme, est_depasse,
   //                   sous_charges_detail: [ { sous_charge, consomme } ] } ]
   // }
   public function updateConsomme(int $id, float $montant): void
   public function upsert(int $periodeId, int $compteChargeId, float $montantPrevu): BudgetPrevisionnel
   ```

2. `DepenseRepository` — ajouter méthode :
   ```php
   public function sumByCompteCharge(int $compteChargeId, int $periodeId): float
   // = SUM(depenses.montant) WHERE sous_charge.compte_charge_id = $compteChargeId
   //   AND depenses.residence_id dans la période
   // Jointure : depenses → sous_charges → comptes_charges
   ```

3. `BudgetService` — implémenter TOUTES les méthodes (voir ENTITIES.md § 4) :
   - `createPeriode()` : crée période + initialise budgets à 0 pour chaque compte charge actif
   - `setBudget()` : upsert BudgetPrevisionnel
   - `recalculerConsomme()` : recalcule + invalide cache
   - `getBudgetSummary()` : cache::remember
   - `checkDepassement()` : compare consomme > prevu

4. `DepenseObserver` — implémenter (voir ENTITIES.md § 8) :
   - `created()`, `updated()`, `deleted()` : appellent recalculerConsomme
   - Trouver le bon BudgetPrevisionnel via sous_charge → compte_charge → periode active

5. `PeriodeController` :
   - `index()` : périodes de la résidence triées par annee DESC
   - `store()` : délègue à BudgetService::createPeriode()
   - `update()` : modifie dates ou toggle is_active

6. `BudgetPrevisionnelController` :
   - `summary()` : retourne BudgetService::getBudgetSummary() — depuis cache
   - `store()` : crée ou met à jour (upsert) un budget pour un compte charge
   - `update()` : modifie montant_prevu + invalide cache

7. `BudgetPrevisionnelResource` :
   ```php
   'id', 'montant_prevu', 'montant_consomme', 'montant_restant', // calculé accessor
   'pourcentage_consomme', 'est_depasse',
   'compte_charge' => CompteChargeResource::make($this->whenLoaded('compteCharge')),
   ```

8. `BudgetSummaryResource` : formater le array retourné par getSummaryByPeriode()

---

### Frontend

**BudgetPage.tsx** :
Structure :
- Header : titre "Budget Prévisionnel" + sélecteur période (pills/onglets)
- Section KPI : 4 cards (Prévu | Consommé | Restant | Hors Budget) avec count-up
- Alert banner : si des budgets sont dépassés → "⚠️ {n} compte(s) en dépassement"
- Section principale : BudgetTable

**BudgetTable.tsx** :
- Une ligne par CompteCharge avec : Nom | Prévu | Consommé | Restant | % | ProgressBar | [+]
- Ligne expandable → BudgetRow (sous-charges avec consomme individuel)
- Expand/collapse : height animation smooth 200ms (voir UI_UX_SPEC.md animations § D)
- Bouton [+] → ouvre DepenseSidePanel pour cette sous-charge

**ProgressBar** dans BudgetTable :
- Couleur dynamique : vert (< 60%), ambre (60–85%), rouge (> 85%)
- Animation width 0 → actual% sur mount (600ms ease-out)
- Tooltip au hover : "X,XX DH / Y,YY DH"

**BudgetSummaryCards.tsx** :
- 4 KpiCard avec icônes et count-up
- Restant : couleur verte si positif, rouge si négatif
- Hors Budget : toujours en ambre warning

**Hooks** :
```typescript
// useBudget.ts
export const useBudgetSummary = (periodeId: number) =>
  useQuery(['budget', 'summary', periodeId], () => budget.api.getSummary(periodeId));

export const usePeriodes = (residenceId: number) =>
  useQuery(['periodes', residenceId], () => periode.api.index(residenceId));

export const useCreateBudget = () =>
  useMutation(budget.api.store, { onSuccess: () => queryClient.invalidateQueries(['budget']) });
```

**KpiCard.tsx** (composant réutilisable) :
- Props : label, value (number), prefix?, suffix?, icon, color, trend?
- Count-up : `useMotionValue` ou `react-countup` — 0 → value en 1200ms ease-out
- Hover : y -2px + shadow-card-lg 200ms

Règles :
- Le summary vient TOUJOURS du cache (endpoint /periodes/{id}/budgets)
- JAMAIS calculer budget_restant côté frontend depuis les données brutes
- Invalider ['budget', 'summary', periodeId] à chaque mutation dépense

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 8 — Cotisations

```
Tu es un senior Laravel 13 developer.
Lis ces fichiers de contexte :
  - PROJECT.md (§ 4.2 Répartition, § 4.4 Auto-génération mensuelle)
  - ARCHITECTURE.md (§ 8 machine à états cotisation, § 10 queue)
  - ENTITIES.md (§ 5 CotisationService)
  - API.md (groupe 11)
  - CONVENTIONS.md (règles métier cotisation)
  - UI_UX_SPEC.md (§ E page 5 — Cotisations, wizard)

Tâche : Implémenter le module Cotisations complet.

### Backend

1. `CotisationRepository` :
   ```php
   public function findByResidence(int $residenceId, array $filters): Collection
   public function findWithResidence(int $id): Cotisation
   public function findWithDetails(int $id): Cotisation  // with cotisationDetails.appartement.coproprietaire
   public function bulkCreateDetails(array $details): Collection  // insert batch
   public function getImpayesByResidence(int $residenceId, array $filters): LengthAwarePaginator
   public function getPrevisualisation(int $residenceId, string $mode, float $montant, int $periodeId): array
   ```

2. `AppartementRepository` — ajouter :
   ```php
   public function findActifsByResidence(int $residenceId): Collection
   // Uniquement les appartements avec deleted_at = null ET coproprietaire_id IS NOT NULL
   ```

3. `CotisationService` — implémenter TOUTES les méthodes (voir ENTITIES.md § 5) :

   **createCotisationFixe()** :
   - Crée Cotisation (type=fixe, montant_total = montant_mensuel * 12)
   - NE génère PAS les détails (ils sont générés mensuellement par le scheduler)
   - Dispatch CotisationCreated event

   **createCotisationExceptionnelle()** :
   - Crée Cotisation (type=exceptionnelle)
   - Appelle generateDetails() immédiatement
   - Dispatch CotisationCreated event

   **generateDetails()** :
   - Récupère appartements ACTIFS (avec coproprietaire) de la résidence
   - Appelle la méthode de calcul selon mode
   - bulkCreateDetails() — insert batch
   - ⚠️ RÈGLE CRITIQUE : le total des détails = cotisation.montant_total ± arrondi

   **calculerRepartitionEgale()** : montant / nb_appartements (round 2 décimales)
   **calculerRepartitionParTantieme()** : (tantieme / SUM(tantiemes_actifs)) * montant_total
   **calculerRepartitionParAppartement()** : utilise $montantsMap[appartement_id]
     - Validation : SUM(montantsMap) doit == montant_total ± 0.01

   **getPrevisualisation()** (sans persister) :
   - Calcule les montants par appartement selon le mode
   - Retourne [ { appartement_id, numero, coproprietaire_nom, montant_calcule } ]

4. `CotisationController` :
   - `index()` : filtre par type et periode_id
   - `storeFixe()` : délègue à CotisationService::createCotisationFixe()
   - `storeExceptionnelle()` : délègue à CotisationService::createCotisationExceptionnelle()
   - `details()` : retourne CotisationDetailResource::collection avec appartement, coproprietaire, paiements
   - `previsualiser()` : retourne calcul sans persistance
   - `impayes()` : liste paginée des cotisation_details non payés ou partiels

5. `StoreCotisationFixeRequest` :
   ```php
   'label'          => 'required|string|max:200',
   'montant_mensuel'=> 'required|numeric|min:1',
   'periode_id'     => 'required|exists:periodes,id',
   'description'    => 'nullable|string|max:500',
   ```

6. `StoreCotisationExceptionnelleRequest` :
   ```php
   'label'           => 'required|string|max:200',
   'montant_total'   => 'required|numeric|min:1',
   'mode_repartition'=> 'required|in:egale,par_appartement,par_tantieme',
   'periode_id'      => 'required|exists:periodes,id',
   'description'     => 'nullable|string|max:500',
   'montants_map'    => 'required_if:mode_repartition,par_appartement|array',
   'montants_map.*'  => 'numeric|min:0',
   ```

7. `GenerateMonthlyCotisationsCommand` (`app/Console/Commands/`) :
   ```php
   protected $signature = 'cotisations:generate-monthly';
   // Logique :
   // Pour chaque CotisationFixe active (toutes résidences)
   // → Pour chaque appartement actif avec coproprietaire
   // → Vérifier si cotisation_detail existe déjà pour ce mois/année (IDEMPOTENCE)
   // → Sinon créer CotisationDetail (statut=non_paye, montant=cotisation.montant_mensuel)
   ```

8. Kernel / Scheduler :
   ```php
   $schedule->command('cotisations:generate-monthly')->monthlyOn(1, '00:00')
            ->withoutOverlapping()->onFailure(fn() => Log::error('Génération mensuelle échouée'));
   ```

9. Resources :
   - `CotisationResource` : tous les champs + `details_count` + `mode_repartition_label`
   - `CotisationDetailResource` : id, cotisation, appartement, coproprietaire, montant, montant_paye, montant_restant, statut + label, anciennete_jours (pour impayés)

---

### Frontend

**CotisationsPage.tsx** — 3 onglets : Cotisations Fixes | Cotisations Exceptionnelles | Impayés

**Onglet Fixe** :
- Table : Label | Montant/mois | Période | Description | Actions
- Modal simple : label, montant mensuel, période (dropdown), description

**Onglet Exceptionnelles** :
- Table : Label | Montant Total | Mode Répartition | Date | Actions
- Bouton "+ Nouvelle cotisation exceptionnelle" → ouvre wizard

**CotisationExceptionnelleWizard.tsx** :
```
Étape 1 — Informations :
  Label, montant total, mode répartition (3 cartes radio visuelles avec description)
  Mode Égale : "Même montant pour tous les appartements"
  Mode Par Appartement : "Définir manuellement le montant par appartement"
  Mode Par Tantième : "Proportionnel aux tantièmes de chaque appartement"
  Période (dropdown), description (optionnel)

Étape 2 — Prévisualisation :
  Appelle GET /cotisations/previsualiser (sans persister)
  Table : Appartement | Copropriétaire | Tantième | Montant calculé
  Si mode = par_tantieme : affiche formule sous le tableau
    "(tantième / total_tantièmes) × montant_total = montant_calculé"
  Si mode = par_appartement : champs éditables + validation total = montant_total
  Total en pied de tableau = montant_total (highlight si écart)

Étape 3 — Confirmation :
  Résumé : label, montant total, mode, nb appartements concernés
  Bouton "Générer les cotisations" → POST /cotisations/exceptionnelle
  Loading state : spinner + "Génération en cours..."
  Succès : ✓ animation + message + fermeture wizard + refresh table
```

**Step Indicator Component** :
- Cercles numérotés 1, 2, 3 avec ligne de connexion
- Étape active : bg-brand-600 + scale
- Étape complétée : bg-success + checkmark
- Étape future : bg-surface-200 gray

**Onglet Impayés** :
- Filtres : statut (non payé / partiel), période
- Table : Copropriétaire | Appt | Cotisation | Montant | Payé | Restant | Ancienneté | Statut | [Payer]
- Bouton "Payer" → ouvre directement EnregistrerPaiementModal pré-rempli
- Ancienneté : nb jours formaté (rouge si > 30j, orange si > 15j)

**Hooks** :
- `useCotisations.ts` : index (par type), storeFixe, storeExceptionnelle
- `usePrevisualisation.ts` : query sans persister (enabled quand données step1 remplies)
- `useImpayes.ts` : query paginée avec filtres

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 9 — Paiements

```
Tu es un senior Laravel 13 developer.
Lis ces fichiers de contexte :
  - PROJECT.md (§ 4.3 statut automatique, § 4.5 paiement partiel)
  - ARCHITECTURE.md (§ 10 queue jobs)
  - ENTITIES.md (§ 6 PaiementService, § 8 PaiementObserver)
  - API.md (groupe 12)
  - UI_UX_SPEC.md (§ E page 6 — Paiements)

Tâche : Implémenter le module Paiements complet.

### Backend

1. `PaiementRepository` :
   ```php
   public function findByResidence(int $residenceId, array $filters): LengthAwarePaginator
   public function findDetail(int $cotisationDetailId): CotisationDetail
   public function sumPaiementsByDetail(int $cotisationDetailId): float
   public function updateDetail(int $id, array $data): void
   public function getHistoriqueByAppartement(int $appartementId): Collection
   public function getTotalPercu(int $residenceId, int $periodeId): array
   public function findByCoproprietaire(int $coproprietaireId, array $filters): LengthAwarePaginator
   ```

2. `PaiementService` — implémenter TOUTES les méthodes (voir ENTITIES.md § 6) :

   **enregistrerPaiement()** :
   ```
   1. findDetail() → récupère cotisationDetail
   2. resteAPayer = detail.montant - detail.montant_paye
   3. if (montant > resteAPayer) throw InvalidArgumentException
   4. if (detail.statut === 'paye') throw InvalidArgumentException "Cette cotisation est déjà payée intégralement."
   5. paiementRepo.create()
   6. event(new PaiementRecorded($paiement))
   7. GenerateReceipt::dispatch($paiement->id)->onQueue('receipts')
   8. return $paiement
   ```

   **updateCotisationDetailStatut()** — appelé par PaiementObserver :
   ```
   totalPaye = SUM(paiements.montant) WHERE cotisation_detail_id = ?
   statut = match:
     totalPaye >= detail.montant → 'paye'
     totalPaye > 0              → 'partiellement_paye'
     default                    → 'non_paye'
   update cotisationDetail: montant_paye = totalPaye, statut = statut
   ```

   **genererRecu()** — appelé par GenerateReceipt job :
   - Générer PDF via DOMPDF (Blade template `resources/views/recus/recu.blade.php`)
   - Stocker via Spatie Media Library (collection "recus")
   - Retourner le path

3. `PaiementObserver` :
   - `created()` → appelle PaiementService::updateCotisationDetailStatut()
   - `deleted()` → appelle PaiementService::updateCotisationDetailStatut() (si on autorise la suppression)
   - ⚠️ JAMAIS modifier statut manuellement — toujours via Observer

4. `StorePaiementRequest` :
   ```php
   'cotisation_detail_id' => 'required|exists:cotisation_details,id',
   'date_paiement'        => 'required|date|before_or_equal:today',
   'montant'              => 'required|numeric|min:0.01',
   'mode_paiement'        => 'required|in:especes,virement,cheque,carte',
   'reference'            => 'nullable|string|max:100',
   ```
   Messages :
   ```php
   'montant.min' => 'Le montant doit être supérieur à 0.',
   ```
   Plus validation métier dans le Controller :
   - Vérifier que $montant <= resteAPayer AVANT de créer
   - Si dépassement : retourner 400 avec message "Le montant saisi dépasse le restant à payer ({resteAPayer} DH)."

5. `PaiementController` :
   - `index()` : liste paginée filtrable (résidence, coproprietaire, date range)
   - `store()` : délègue à PaiementService
   - `recu()` : retourne signed URL Spatie temporaire (60 min) | 404 si non encore généré
   - `totalPercu()` : retourne { total_percu, nb_paiements }

6. `GenerateReceipt` Job :
   - `public function handle(PaiementService $service)` → appelle `genererRecu()`
   - Queue : `receipts`
   - Retry : 3 tentatives, delay 60s

7. Blade Template `resources/views/recus/recu.blade.php` :
   Contenu du PDF (professionnel) :
   - Header : Logo "SyndicPro" + nom résidence + date génération
   - Corps :
     * Reçu N° {id} du {date_paiement}
     * Copropriétaire : {nom}
     * Appartement : {numero}, {etage}ème étage, {immeuble}
     * Cotisation : {label}
     * Montant payé : {montant} DH
     * Mode de paiement : {mode_paiement}
     * Référence : {reference}
     * Restant après paiement : {montant_restant} DH
   - Footer : "Ce reçu a été généré automatiquement par SyndicPro."
   Style CSS inline (compatible DOMPDF)

8. `PaiementResource` :
   ```php
   'id', 'date_paiement', 'montant', 'mode_paiement', 'mode_paiement_label',
   'reference', 'has_recu', 'recu_url' (signed, nullable),
   'cotisation_detail' => CotisationDetailResource (whenLoaded),
   'coproprietaire'    => UserResource (whenLoaded),
   ```

---

### Frontend

**PaiementsPage.tsx** :
- Table colonnes : Date | Copropriétaire | Appartement | Cotisation | Montant | Mode | Référence | Reçu | —
- Filtres : date range, copropriétaire (autocomplete)
- Icône PDF par ligne → téléchargement reçu
- Bouton "+ Enregistrer un paiement" en haut

**EnregistrerPaiementModal.tsx** :
```
Section 1 — Trouver le copropriétaire :
  Champ recherche autocomplete → liste des copropriétaires de la résidence
  (useQuery avec debounce 300ms)

Section 2 — Cotisations non payées (après sélection copropriétaire) :
  Affiche CotisationDetailResource[] pour ce copropriétaire (statut != 'paye')
  Chaque ligne : label cotisation | montant | déjà payé | restant
  Sélection par radio button

Section 3 — Détails du paiement :
  Montant (input font-mono) :
    - Placeholder = montant_restant
    - Validation live : si > restant → erreur rouge inline + shake
    - Sous le champ : "Restant après ce paiement : {calculé} DH" (mis à jour live)
  Date paiement (date picker, valeur défaut = aujourd'hui)
  Mode paiement : 4 cartes radio avec icônes (💵 Espèces | 🏦 Virement | 📋 Chèque | 💳 Carte)
  Référence (optionnel, placeholder selon mode)

Footer : [Annuler] [Enregistrer le paiement] (primary)
Loading state : spinner dans bouton + formulaire disabled
Succès : modal fermée + toast "Paiement enregistré. Le reçu est en cours de génération."
Erreur 400 : message d'erreur affiché en rouge sous le formulaire
```

**Mise à jour temps réel du restant** :
```typescript
const montantRestant = (cotisationDetail?.montant ?? 0) - (cotisationDetail?.montant_paye ?? 0);
const resteApresPaiement = montantRestant - (watchedMontant || 0);
// Afficher avec motion.span key={resteApresPaiement} pour flash
```

**Hooks** :
```typescript
// usePaiements.ts
export const usePaiements = (residenceId: number, filters: PaiementFilters) =>
  useQuery(['paiements', residenceId, filters], () => paiement.api.index(residenceId, filters));

export const useEnregistrerPaiement = () =>
  useMutation(paiement.api.store, {
    onSuccess: () => {
      queryClient.invalidateQueries(['paiements']);
      queryClient.invalidateQueries(['cotisations']);
      queryClient.invalidateQueries(['impayes']);
    }
  });
```

Règles critiques :
- JAMAIS modifier statut CotisationDetail depuis le frontend
- Reçu PDF : toujours en queue — afficher message "en cours de génération" si URL = null
- Validation montant ≤ restant : côté frontend (Zod) ET côté backend (FormRequest + Service)

Ne passez pas à la phase suivante sans mon approbation.
```

---

  ## PHASE 10 — Réclamations

  ```
  Tu es un senior Laravel 13 / React 18 developer.
  Lis ces fichiers de contexte :
    - PROJECT.md (§ 3.1 gestion réclamations, § 3.2 copropriétaire)
    - ARCHITECTURE.md (§ 9 machine à états réclamation, § 11 événements)
    - ENTITIES.md (§ 7 ReclamationService)
    - API.md (groupes 13, 19)
    - UI_UX_SPEC.md (§ E page 8, § F page 4)

  Tâche : Implémenter le module Réclamations (syndic + copropriétaire).

  ### Backend

  1. `ReclamationRepository` :
    ```php
    public function findByResidence(int $residenceId, array $filters): LengthAwarePaginator
    // filters: statut, priorite, date_debut, date_fin
    // eager: coproprietaire, appartement
    
    public function findByCoproprietaire(int $coproprietaireId): Collection
    
    public function findWithDetails(int $id): Reclamation
    // eager: coproprietaire, residence, appartement
    
    public function update(int $id, array $data): Reclamation
    ```

  2. `ReclamationService` — voir ENTITIES.md § 7 :

    **create()** :
    - Valider que appartement_id appartient au copropriétaire connecté
    - Créer la réclamation (statut = nouveau)
    - Notifier le syndic : `$syndic->notify(new NouvelleReclamationNotification($reclamation))`

    **updateStatut()** :
    - Valider transition de statut (pas de retour en arrière)
    - Update statut + reponse_syndic + date_reponse = now()
    - event(new ReclamationUpdated($reclamation))

  3. `ReclamationController` (Syndic) :
    - `index()` : liste paginée filtrée, tri par date DESC + urgentes en premier
    - `show()` : détail complet avec relations
    - `updateStatut()` : délègue à ReclamationService

  4. `ReclamationController` (Copropriétaire) :
    - `index()` : uniquement réclamations du copropriétaire connecté
    - `store()` : délègue à ReclamationService::create()
    - `show()` : vérifie coproprietaire_id === auth()->id() → sinon 403

  5. `StoreCoproprietaireReclamationRequest` :
    ```php
    'appartement_id' => 'required|exists:appartements,id',
    'titre'          => 'required|string|max:200',
    'description'    => 'required|string|max:2000',
    'priorite'       => 'required|in:normale,urgente',
    ```
    `authorize()` : vérifie que l'appartement appartient au copropriétaire connecté
    ```php
    $appartement = Appartement::findOrFail($this->appartement_id);
    return $appartement->coproprietaire_id === auth()->id();
    ```
    Message : `'appartement_id.exists' => 'L\'appartement sélectionné est invalide.'`

  6. `UpdateReclamationStatutRequest` :
    ```php
    'statut'         => 'required|in:en_cours,traite,rejete',
    'reponse_syndic' => 'nullable|string|max:2000',
    ```
    Validation personnalisée : si statut = 'rejete', reponse_syndic recommandée (warning seulement)

  7. `ReclamationPolicy` — voir ENTITIES.md § 9 :
    - `view()` : syndic de la résidence OU copropriétaire concerné
    - `updateStatut()` : syndic de la résidence uniquement

  8. `NouvelleReclamationNotification` :
    - Canal : email (via Laravel mail)
    - Sujet : "Nouvelle réclamation — {residence.nom}"
    - Corps : copropriétaire, appartement, titre, description, priorité, lien tableau de bord

  9. `ReclamationUpdatedNotification` :
    - Canal : email
    - Sujet : "Votre réclamation a été mise à jour — {statut_label}"
    - Corps : titre, nouveau statut, réponse syndic (si présente)

  10. `OnReclamationUpdated` Listener :
      ```php
      public function handle(ReclamationUpdated $event): void
      {
          $event->reclamation->coproprietaire->notify(new ReclamationUpdatedNotification($event->reclamation));
      }
      ```

  11. `ReclamationResource` :
      ```php
      'id', 'titre', 'description', 'statut', 'statut_label', 'priorite', 'priorite_label',
      'reponse_syndic', 'date_reponse' (format: DD/MM/YYYY à HH:mm),
      'anciennete_jours', // calculé: now()->diffInDays(created_at)
      'coproprietaire' => UserResource (whenLoaded),
      'residence'      => ResidenceResource (whenLoaded),
      'appartement'    => AppartementResource (whenLoaded),
      'created_at'     => format DD/MM/YYYY
      ```

  ---

  ### Frontend

  **ReclamationsPage.tsx** (Syndic) :
  - Table : Copropriétaire | Résidence | Appartement | Titre | Priorité | Statut | Date | —
  - Badge "nouveau" avec pulse animation bleue
  - Badge "urgente" en rouge
  - Tri défaut : date DESC + urgentes d'abord
  - Filtres : statut (multi-select), priorité, date range

  **ReclamationDetailModal.tsx** :
  ```
  Sections du modal (width 600px) :
  1. Header : titre + badge statut + badge priorité
  2. Info : copropriétaire | appartement | date création | ancienneté
  3. Description : texte complet (bg-surface-50 rounded p-4)
  4. Réponse syndic (si existante) : texte complet
  5. Actions (si statut != traite/rejete) :
    - Sélect statut : "En cours" | "Traité" | "Rejeté"
    - Textarea "Réponse au copropriétaire" (optionnel)
    - Bouton "Sauvegarder" → PUT /reclamations/{id}/statut
  ```

  **MesReclamationsPage.tsx** (Copropriétaire) :
  - Bouton "+ Nouvelle réclamation" en haut
  - Table : Date | Titre | Appartement | Priorité | Statut | Réponse
  - Colonne Réponse : tronquée 60 chars + expandable
  - Badge statut avec couleurs

**NouvelleReclamationForm.tsx** (dans modal) :
- Si 1 appartement : pré-sélectionné automatiquement
- Si plusieurs appartements : dropdown
- Titre (input)
- Description (textarea, 2000 chars max + compteur)
- Priorité : 2 cartes radio (Normale | Urgente ⚠️)
- Bouton "Soumettre"
- Succès : toast + refresh table

**Hooks** :
```typescript
// useReclamations.ts
export const useReclamationsResidence = (residenceId: number, filters) =>
  useQuery(['reclamations', residenceId, filters], ...);

export const useUpdateStatut = () =>
  useMutation(reclamation.api.updateStatut, {
    onSuccess: () => queryClient.invalidateQueries(['reclamations'])
  });

// Portail copropriétaire
export const useMesReclamations = () =>
  useQuery(['reclamations', 'mine'], reclamation.api.getMine);

export const useCreateReclamation = () =>
  useMutation(reclamation.api.store, ...);
```

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 11 — Portail Copropriétaire (APIs)

```
Tu es un senior Laravel 13 developer.
Lis ces fichiers de contexte :
  - PROJECT.md (§ 3.2 copropriétaire — fonctionnalités)
  - API.md (groupes 15, 16, 17, 18)
  - CONVENTIONS.md (§ 2.2 isolation données copropriétaire)
  - ENTITIES.md (Policies § 9)

Tâche : Implémenter TOUTES les APIs du portail copropriétaire.

### Règle de Sécurité Absolue (à vérifier sur CHAQUE endpoint)
```
auth()->id() === $model->coproprietaire_id
```
Aucune donnée financière d'un autre copropriétaire ne doit apparaître dans une réponse.

### Controllers Copropriétaire

1. `CoproDashboardController::index()` :
   - Appartements de l'utilisateur connecté
   - Pour le mois courant : SUM cotisation_details.montant WHERE coproprietaire_id = user.id AND mois = mois_courant AND statut != 'paye'
   - Total impayés toutes périodes
   - Nb impayés
   - Dernier paiement (date + montant)
   - Nb réclamations en_cours
   - Activité récente : 5 derniers paiements + 3 dernières réclamations (triés par date DESC)

2. `CoproAppartementController::index()` :
   - `Appartement::where('coproprietaire_id', auth()->id())->with(['immeuble', 'residence'])->get()`
   - Retourne `AppartementResource::collection`

3. `CoproCotisationController` :
   - `index()` :
     ```php
     CotisationDetail::where('coproprietaire_id', auth()->id())
       ->with(['cotisation', 'paiements', 'appartement'])
       ->when($request->type, fn($q, $t) => $q->whereHas('cotisation', fn($q2) => $q2->where('type', $t)))
       ->when($request->statut, fn($q, $s) => $q->where('statut', $s))
       ->get();
     ```
   - `show(CotisationDetail $detail)` :
     * Vérifie `$detail->coproprietaire_id === auth()->id()` → sinon 403
     * Retourne avec paiements chargés

4. `CoproPaiementController` :
   - `index()` :
     ```php
     Paiement::where('coproprietaire_id', auth()->id())
       ->with(['cotisationDetail.cotisation'])
       ->latest('date_paiement')
       ->paginate($perPage);
     ```
   - `recu(Paiement $paiement)` :
     * Vérifie `$paiement->coproprietaire_id === auth()->id()` → sinon 403
     * Retourne signed URL Spatie

5. `CoproReclamationController` — déjà implémenté en Phase 10 mais vérifier :
   - `index()` : filtre par coproprietaire_id
   - `store()` : déjà fait
   - `show()` : vérifie ownership

### Note sur les Ressources
Les Resources syndic et copropriétaire partagent les mêmes classes Resource.
Les relations sensibles (autres copropriétaires) doivent être absentes des réponses copropriétaire.
Utiliser `when()` et `whenLoaded()` avec précaution.

### Tests de Sécurité à Écrire (tests Feature)
```php
// test: copropriétaire ne peut pas voir les cotisations d'un autre copropriétaire
it('cannot view other coproprietaire cotisations', function () {
    $copro1 = User::factory()->coproprietaire()->create();
    $copro2 = User::factory()->coproprietaire()->create();
    $detail = CotisationDetail::factory()->for($copro2, 'coproprietaire')->create();

    $this->actingAs($copro1)
         ->getJson("/api/coproprietaire/cotisations/{$detail->id}")
         ->assertStatus(403);
});
```
Écrire ce test + variantes pour paiements et réclamations.

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 12 — Rapports

```
Tu es un senior Laravel 13 / React 18 developer.
Lis ces fichiers de contexte :
  - PROJECT.md (§ 3.1 rapports, § 6 KPIs)
  - API.md (groupe 14 — Rapports)
  - UI_UX_SPEC.md (§ E page 10)
  - CONVENTIONS.md (agrégation backend obligatoire)

Tâche : Implémenter le module Rapports.

### Backend

1. `RapportController` :

   **budget()** :
   - Retourne le BudgetSummary complet de la période (depuis BudgetService)
   - Format enrichi : prevu, consomme, restant, hors_budget, par_compte, taux_consommation_global
   - Utilisé pour affichage ET potentiellement export

   **impayes()** :
   ```php
   $impayes = CotisationDetail::where('residence_id', $residence->id) // via cotisation
     ->whereIn('statut', ['non_paye', 'partiellement_paye'])
     ->with(['cotisation', 'appartement.coproprietaire'])
     ->join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
     ->where('cotisations.residence_id', $residence->id)
     ->when($periodeId, fn($q) => $q->where('cotisations.periode_id', $periodeId))
     ->paginate($perPage);
   // Ajouter pour chaque : anciennete_jours = Carbon::now()->diffInDays($detail->created_at)
   ```

   **paiements()** :
   ```php
   $paiements = Paiement::whereHas('cotisationDetail.cotisation', fn($q) =>
       $q->where('residence_id', $residence->id)
   )
   ->with(['coproprietaire', 'cotisationDetail.cotisation'])
   ->when($dateDebut, fn($q) => $q->where('date_paiement', '>=', $dateDebut))
   ->when($dateFin,   fn($q) => $q->where('date_paiement', '<=', $dateFin))
   ->latest('date_paiement')
   ->paginate($perPage);

   // Inclure dans la réponse :
   $meta['total_percu']   = $paiements->sum('montant');
   $meta['nb_paiements']  = $paiements->total();
   $meta['par_mode']      = [
     'especes'  => SUM filtre mode_paiement='especes',
     'virement' => ...,
     'cheque'   => ...,
     'carte'    => ...,
   ];
   ```

2. Format de Réponse Enrichi pour `impayes()` :
   ```json
   {
     "data": [ CotisationDetailResource[] ],
     "meta": {
       "total_impaye": 12400.00,
       "nb_impayes": 8,
       "par_statut": { "non_paye": 5, "partiellement_paye": 3 }
     }
   }
   ```

### Frontend

**RapportsPage.tsx** — 3 sections :

Section 1 — Budget :
- Filtre : sélection période
- Affichage résumé budget (réutilise BudgetSummaryCards + BudgetTable)
- Bouton "Exporter CSV" (optionnel — génère téléchargement côté frontend depuis les données)

Section 2 — Impayés :
- Filtres : période, statut
- Total impayé en gros (rouge) + nb dossiers
- Table impayés identique à CotisationsPage onglet Impayés
- Bouton "Exporter CSV"

Section 3 — Paiements :
- Filtres : date range
- KPIs : total perçu, nb paiements, répartition par mode (4 mini-cards)
- Table paiements
- PieChart optionnel : répartition par mode de paiement

**Hooks** :
```typescript
export const useRapportBudget   = (residenceId, periodeId) =>
  useQuery(['rapport', 'budget', residenceId, periodeId], ...);
export const useRapportImpayes  = (residenceId, filters) =>
  useQuery(['rapport', 'impayes', residenceId, filters], ...);
export const useRapportPaiements= (residenceId, filters) =>
  useQuery(['rapport', 'paiements', residenceId, filters], ...);
```

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 13 — Setup Frontend Complet (AppShell + Composants UI)

```
Tu es un senior React 18 + TypeScript + Framer Motion + Tailwind developer.
Lis ces fichiers de contexte :
  - UI_UX_SPEC.md (§ A identité, § C patterns UI, § D animations, § G responsive)
  - ARCHITECTURE.md (§ 3 arborescence frontend)
  - CONVENTIONS.md (§ 1 nommage frontend, § 5 formatage)

Tâche : Construire le système de design et le layout complet.

### 1. Utilitaires (`src/utils/`)

**formatCurrency.ts** :
```typescriptd

**formatDate.ts** :
```typescript
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
export const formatDate = (date: string | Date): string =>
  format(typeof date === 'string' ? parseISO(date) : date, 'dd/MM/yyyy', { locale: fr });
export const formatDateTime = (date: string | Date): string =>
  format(typeof date === 'string' ? parseISO(date) : date, "dd/MM/yyyy 'à' HH:mm", { locale: fr });
export const daysSince = (date: string): number =>
  Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
```

**useAmountFormatter.ts** :
```typescript
// Hook pour formatage live des inputs montant
export const useAmountFormatter = () => {
  const format = (value: string): string => {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };
  return { format };
};
```

### 2. Composants UI Atomiques (tous dans `src/components/ui/`)

**Button.tsx** :
- Variants : primary (brand-600), secondary, ghost, danger
- Sizes : sm, md (défaut), lg
- States : normal, loading (spinner), disabled
- Animation : scale(0.97) sur clic 150ms

**Badge.tsx** :
- Variante pill (rounded-full) pour statuts
- Colors : success, warning, danger, info, gray
- Prop `pulse` : animation ring pour "nouveau"

**StatusBadge.tsx** :
- Mappe automatiquement les statuts (CotisationDetailStatut, ReclamationStatut) vers Badge
- Voir mapping complet dans UI_UX_SPEC.md § C

**Card.tsx** :
- Wrapper : bg-white rounded-xl shadow-card p-6
- Variants : default, highlighted (border-brand-200)
- Hover effect optionnel

**KpiCard.tsx** :
- Props : label, value, prefix?, suffix?, icon, color, trend?, isLoading
- Count-up sur mount (react-countup ou custom)
- Skeleton quand isLoading
- Hover : y -2px, shadow-card-lg

**Modal.tsx** :
- Props : isOpen, onClose, title, size ('sm'|'md'|'lg'), children, footer
- Animations Framer Motion (voir UI_UX_SPEC.md § D)
- Trap focus quand ouvert, fermeture ESC

**ConfirmDialog.tsx** :
- Spécialisé pour les suppressions
- Bouton "Supprimer définitivement" rouge
- Message personnalisable

**DataTable.tsx** :
- Props : columns (ColDef[]), data, isLoading, pagination?, onSort?, emptyState?
- ColDef : key, label, render?, sortable?, width?
- Stagger animation sur rows (delay 40ms/ligne)
- Skeleton 5 lignes quand isLoading
- Responsive : overflow-x-auto + sticky first col

**EmptyState.tsx** :
- Illustration SVG (simple, thème gestion immobilière)
- Titre + description + bouton CTA optionnel

**FormField.tsx** :
- Label + input wrapper + message d'erreur

**ProgressBar.tsx** :
- Props : value (0-100), showLabel?, colorAuto?
- colorAuto : vert < 60%, ambre 60-85%, rouge > 85%
- Animation width 0 → value sur mount (600ms ease-out)

**Skeleton.tsx** :
- Base : animate-pulse bg-surface-200 rounded
- Variants : line, circle, rect (avec dimensions)
- Composé : SkeletonTable, SkeletonKpi, SkeletonCard

**Toast system** :
- `useUIStore` : addToast(type, message), removeToast(id)
- `ToastContainer.tsx` : fixed top-right, z-50
- Animation : slide-in depuis droite
- Auto-dismiss : 4s avec barre de progression décroissante

**Select.tsx** :
- Wrapper html select avec styling Tailwind
- Prop grouped? pour optgroup

### 3. Layout (`src/components/layout/`)

**AppShell.tsx** :
- Sidebar + Topbar + main content area
- Gestion responsive (hamburger mobile)
- `useResidenceStore` pour contexte résidence active

**Sidebar.tsx** :
- Logo "Syndic**Pro**" (voir spec UI)
- ResidenceSelector si plusieurs résidences
- Navigation groupée (voir UI_UX_SPEC.md § E page 1)
- Badges de notification (réclamations nouvelles)
- Collapse button → icons seuls
- User info + logout en bas
- Animations : voir UI_UX_SPEC.md § D animation 1 (sidebar collapse)

**SidebarNav.tsx** :
- Items avec icon + label + badge optionnel
- Active state : bg-brand-900 + barre gauche accent-500
- Hover : bg-brand-900/50

**ResidenceSelector.tsx** :
- Dropdown des résidences du syndic
- Icône immeuble + nom + nb immeubles badge
- onChange → residenceStore.setActiveResidence() + refetch des données

**Topbar.tsx** :
- Bouton hamburger (mobile)
- Titre page courante
- Notifications icon (optionnel)
- Avatar initiales + nom (petit)

**PageHeader.tsx** :
- Props : title, subtitle?, actions? (slot pour boutons droite)
- Séparateur sous le header

### 4. Charts (`src/components/charts/`)

**BudgetBarChart.tsx** :
- Recharts BarChart groupé (Prévu vs Consommé)
- X : comptes charges
- Y : montants DH
- Tooltip custom : format montants en français
- ResponsiveContainer width="100%" height={300}
- Couleurs : brand-500 (prévu), accent-500 (consommé)

**DepensePieChart.tsx** :
- Recharts PieChart / Donut
- Données : répartition % par compte charge
- Tooltip custom
- Légende en dessous

### 5. Router (`src/router/`)
Toutes les routes définies dans ROUTES.md §1 avec imports lazys (React.lazy) :
```typescript
const SyndicDashboardPage = lazy(() => import('../pages/syndic/DashboardPage'));
// etc. pour toutes les pages
```
Wrappé dans `<Suspense fallback={<FullPageSkeleton />}>`.

Règles impératives :
- Chaque composant UI a des props TypeScript strictement typées
- JAMAIS de `style={{}}` inline — uniquement Tailwind
- TOUS les textes visibles en français
- Formatage monétaire via `formatCurrency()` exclusivement
- Formatage dates via `formatDate()` exclusivement

Ne passez pas à la phase suivante sans mon approbation.
```
