# PHASE_PROMPTS_C.md — SyndicPro
## Prompts Phases 14 à 22 — Paste-Ready

---

## PHASE 14 — Frontend Syndic Dashboard

```
Tu es un senior React 18 + Recharts + Framer Motion developer.
Lis ces fichiers de contexte :
  - UI_UX_SPEC.md (§ E page 2 — Tableau de bord Syndic)
  - ENTITIES.md (§ 10 TypeScript interfaces)
  - CONVENTIONS.md (§ 5 formatage montants/dates)

Prérequis : Phase 13 complète (composants UI + AppShell opérationnels).

Tâche : Construire la page Tableau de Bord Syndic.

### `SyndicDashboardPage.tsx`

Structure de la page :
```
<PageHeader title="Tableau de bord" subtitle={`Résidence ${activeResidence.nom}`} />
<KPIRow />
<ChartsRow />
<RecentActivityRow />
```

**KPIRow — 6 KpiCard** :
Données depuis `useDashboardSummary(residenceId, activePeriodeId)` :
1. Budget Annuel Prévu : `prevu_total` DH — icône 📊 — color brand
2. Total Consommé : `consomme_total` DH + barre % inline — icône 💸 — color warning
3. Budget Restant : `restant_total` DH — icône 💰 — color success si positif, danger si négatif
4. Hors Budget : `hors_budget_total` DH — icône ⚠️ — color warning
5. Total Cotisations (période) : total des cotisations générées — icône 📄 — color brand
6. Impayés : `total_impayes` DH + nb dossiers badge rouge — icône 🔴 — color danger

Layout responsive :
- 2xl : 6 colonnes
- xl  : 3 colonnes + 3 colonnes (2 rows)
- md  : 2 colonnes
- sm  : 1 colonne

Count-up sur toutes les valeurs numériques au mount (1200ms ease-out).
Skeleton loader pour chaque card pendant le chargement.

**ChartsRow — 2 colonnes** :

Colonne gauche (60%) — BudgetBarChart :
- Titre : "Budget par compte de charges"
- Sous-titre : "Exercice {annee}"
- BudgetBarChart.tsx (déjà construit en phase 13)
- Bouton "Voir le budget complet" → navigate('/syndic/budget')
- Skeleton : rectangle 300px height pendant chargement

Colonne droite (40%) — DepensePieChart :
- Titre : "Répartition des dépenses"
- DepensePieChart.tsx
- Legend items : icône couleur + nom compte + % + montant
- Skeleton : cercle + lignes legend

**RecentActivityRow — 3 colonnes** :

Colonne 1 — Dépenses récentes (5 dernières) :
```
Table :
Date    | Sous-Charge         | Montant
10/05   | Entretien électricité| 1 500,00 DH
```
Lien "Voir toutes les dépenses" en bas

Colonne 2 — Impayés urgents (5 premiers) :
```
Table :
Copropriétaire | Appartement | Montant | Statut
Fatima Benkirane | 01         | 200 DH  | [Non payé]
```
Badge coloré pour statut
Lien "Voir tous les impayés"

Colonne 3 — Réclamations récentes (3 premières) :
```
Chaque item :
[badge statut] Titre de la réclamation
Copropriétaire · Appartement 01 · il y a 2 jours
```
Lien "Voir toutes les réclamations"

**Hook `useDashboardData.ts`** :
```typescript
// Parallélise 4 queries
export const useDashboardData = (residenceId: number, periodeId: number) => ({
  budget:       useQuery(['budget', 'summary', periodeId], () => budget.api.getSummary(periodeId)),
  impayes:      useQuery(['impayes', residenceId], () => cotisation.api.getImpayesResume(residenceId)),
  recentDeps:   useQuery(['depenses', 'recent', residenceId], () => depense.api.getRecent(residenceId, 5)),
  reclamations: useQuery(['reclamations', residenceId, { limit: 3 }], ...),
});
```

**Animations à implémenter** :
- KPI cards : fade-in staggered (delay 80ms/card) + count-up
- Chart sections : fade-in 400ms delay 300ms après KPIs
- Recent activity tables : stagger rows 40ms
- Hover KPI card : y -2px, shadow-card-lg

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 15 — Frontend Budget & Charges

```
Tu es un senior React 18 + Framer Motion + Tailwind developer.
Lis ces fichiers de contexte :
  - UI_UX_SPEC.md (§ E pages 3 et 4 — Budget, Charges & Dépenses)
  - ENTITIES.md (§ 10 BudgetPrevisionnel, Depense interfaces)
  - CONVENTIONS.md (§ 5 formatage)

Prérequis : Phases 13 + 14 complètes.

Tâche : Pages Budget Prévisionnel + Charges & Dépenses avec UX complète.

### BudgetPage.tsx

**Structure** :
```
<PageHeader title="Budget Prévisionnel" actions={<CreatePeriodeButton />} />
<PeriodeTabs />                    ← Pills onglets par année
<BudgetSummaryCards />             ← 4 KPI cards
{budgetDepasse && <AlertBanner />} ← Alerte rouge si dépassement
<BudgetTable />                    ← Table principale
<HorsBudgetSection />              ← Section séparée en bas
```

**PeriodeTabs** :
- Une pill par période (2024, 2025, 2026, [+])
- Active : bg-brand-600 text-white rounded-full px-4
- Clic [+] → modal création nouvelle période
- onChange → invalide budget query

**BudgetSummaryCards** :
- 4 KpiCard : Prévu total | Consommé total | Restant total | Hors Budget total
- Restant : bg-success si positif, bg-danger si négatif
- Hors Budget : always bg-warning-light text-warning-dark

**AlertBanner** :
```tsx
// Si un ou plusieurs budgets dépassés
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-danger-light border border-danger rounded-lg p-4"
>
  ⚠️ {nbDepassements} compte(s) de charges dépasse(nt) leur budget prévu.
  <button onClick={scrollToDepassements}>Voir les détails</button>
</motion.div>
```

**BudgetTable.tsx** (composant principal) :
```
Colonnes :
Compte Charge | Budget Prévu | Consommé | Restant | % | Progression | Action

Chaque ligne (BudgetRow) :
- Icône ▶ pour expand
- Nom compte
- Montants (font-mono)
- ProgressBar avec couleur dynamique
- Bouton [+ Dépense] → ouvre DepenseSidePanel filtré par compte

Ligne expandée (sous-charges) :
  Sous-Charge | Consommé | — | — | — | [+ Dépense]
  Fond légèrement grisé (bg-surface-50)
  Animation height 0 → auto (200ms ease-out)

Footer de table :
  TOTAL | Σ prévu | Σ consommé | Σ restant | % global | ProgressBar globale
```

**DepenseSidePanel.tsx** :
- Panel slide depuis la droite (width 480px)
- Header : nom de la sous-charge + bouton fermer
- Liste des dépenses filtrées par sous-charge
- Bouton "+ Ajouter une dépense" en haut du panel
- Chaque dépense : date | description | montant | 📎 si justificatif | icône supprimer
- Skeleton 3 items pendant chargement
- EmptyState si aucune dépense

**Modale Nouvelle Période** :
- Champs : année (number input), date_debut, date_fin
- Validation : année unique pour la résidence

**Modale Définir Budget** (clic sur montant_prevu) :
- Champ montant DH avec formatage live
- Bouton "Enregistrer"

---

### ChargesDepensesPage.tsx

**4 onglets** avec navigation pill-style :
Comptes Charges | Sous-Charges | Dépenses | Hors Budget

**Onglet Comptes Charges** :
Table :
```
Compte       | Nb Sous-Charges | Statut    | Actions
Entretien    | 3               | ✅ Actif  | ✏️ 🔴 🗑️
Jardinage    | 2               | ✅ Actif  | ✏️ 🔴 🗑️
```
- Toggle actif : switch inline (style iOS-like)
- Supprimer : confirm dialog avec warning "Ce compte a X sous-charges"

**Onglet Sous-Charges** :
- Filtre compte charge en haut (Select)
- Table : Sous-Charge | Compte | Description | Actions
- Modal création : dropdown comptes (groupé par résidence) + nom + description

**Onglet Dépenses** :
Filtres :
- Select compte charge (optionnel)
- Date range (date_debut + date_fin)
- Bouton Réinitialiser filtres

Table :
```
Date | Sous-Charge → Compte | Description | Montant DH | 📎 | Actions
```
- Clic 📎 → URL signée → ouvre PDF/image dans nouvel onglet
- Hover ligne → actions (modifier, supprimer)
- Pagination en bas (20/page)

Modal création dépense :
- Sous-charge : grouped Select (groupe = CompteCharge > SousCharge)
- Date (date picker, max = today)
- Montant : input font-mono avec formatage live DH
- Description : textarea 1000 chars max + compteur
- Justificatif : zone drag-and-drop (dashed border)
  * Affiche nom + taille du fichier après sélection
  * Bouton supprimer fichier sélectionné
  * Accepte: .pdf, .jpg, .jpeg, .png — max 5 Mo

**Onglet Hors Budget** :
- Fond entête avec bande warning-light + icône ⚠️
- Table identique aux Dépenses mais sans colonne sous-charge
- Tooltip : "Dépense non prévue au budget (incident, urgence)"

**Animations** :
- Transition entre onglets : fade-in 200ms
- Nouvelles lignes ajoutées : slide-down + fade-in depuis le haut

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 16 — Frontend Cotisations & Paiements

```
Tu es un senior React 18 + Framer Motion developer.
Lis ces fichiers de contexte :
  - UI_UX_SPEC.md (§ E pages 5 et 6 — Cotisations, Paiements)
  - ENTITIES.md (§ 10 Cotisation, CotisationDetail, Paiement interfaces)
  - PROJECT.md (§ 4.2 Répartition, § 4.5 Paiement partiel)

Prérequis : Phases 13 + 14 + 15 complètes.

Tâche : Pages Cotisations + Paiements avec wizards et formulaires avancés.

### CotisationsPage.tsx

**3 onglets** : Cotisations Fixes | Cotisations Exceptionnelles | Impayés

**Onglet Fixes** :
```
Header : titre "Cotisations Fixes" + bouton "+ Nouvelle cotisation fixe"
Table :
  Label | Montant/mois | Période | Description | Générations | Actions
```
Note "Générations" : icône calendrier + "Générée automatiquement le 1er de chaque mois"

Modal Cotisation Fixe :
- Label, montant_mensuel (input font-mono), période (Select), description
- Note info : "Les détails seront générés automatiquement chaque mois."

**Onglet Exceptionnelles** :
Table :
```
Label | Montant Total | Mode Répartition | Appartements | Période | Actions
```

Bouton "+ Nouvelle cotisation exceptionnelle" → **CotisationExceptionnelleWizard.tsx**

---

**CotisationExceptionnelleWizard.tsx** (voir spec UI_UX_SPEC.md § E page 5) :

**Step Indicator** (en haut du wizard) :
```tsx
// 3 cercles + lignes de connexion
// Cercle actif    : bg-brand-600 text-white ring-2 ring-brand-200
// Cercle complété : bg-success text-white (checkmark ✓)
// Cercle futur    : bg-surface-200 text-text-muted
// Ligne : bg-brand-600 si complétée, bg-surface-200 sinon (animation width)
```

**Étape 1 — Informations** :
- Label (text input)
- Description (textarea optionnel)
- Montant total (input font-mono, formatage live, min 1 DH)
- Période (Select dropdown)
- Mode de répartition : 3 cartes radio cliquables
  ```
  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
  │ ⚖️  Répartition      │ │ 📋 Par Appartement  │ │ 📐 Par Tantième     │
  │    Égale             │ │                     │ │                     │
  │ Même montant pour   │ │ Définir manuellement│ │ Proportionnel aux   │
  │ tous les appts      │ │ par appartement      │ │ tantièmes           │
  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
  Selected : border-brand-500 bg-brand-50
  ```
- Bouton "Suivant →" (disabled si formulaire invalide)

**Étape 2 — Prévisualisation** :
- Appel automatique à GET /cotisations/previsualiser avec les données step1
- Loading : skeleton table pendant l'appel
- Table résultats :
  ```
  Appartement | Copropriétaire  | Tantième | Montant Calculé
  01 - RDC    | Fatima Benkirane| 120/1000 | 1 440,00 DH
  ```
- Si mode = par_tantieme : note sous le tableau avec formule :
  "Formule : (tantième ÷ total_tantièmes) × montant_total"
  "Ex : 120 ÷ 1 000 × 12 000,00 DH = 1 440,00 DH"
- Si mode = par_appartement : montants éditables dans le tableau
  - Validation live : total colonne = montant_total (rouge si écart)
  - Pied de tableau : "Total : {sum} / {montant_total}" avec indicateur ✓ ou ✗
- Total en pied de table
- Boutons : "← Retour" | "Suivant →"

**Étape 3 — Confirmation** :
- Récapitulatif dans cards :
  ```
  Label : Réfection toiture
  Montant total : 12 000,00 DH
  Mode : Par tantième
  Appartements concernés : 6
  Période : 2026
  ```
- Liste preview des 3 premiers montants + "et {n} autres..."
- Bouton "Générer les cotisations" (primary, large)
  - Loading : spinner + texte "Génération en cours..."
  - onSuccess : 
    * Animation ✓ 500ms (scale 0 → 1.2 → 1)
    * Toast "Cotisations générées avec succès."
    * Fermeture wizard + refresh table

---

**Onglet Impayés** :
Filtres : statut, période

Table :
```
Copropriétaire | Appartement | Cotisation     | Dû         | Payé     | Restant    | Depuis  | Statut    | Action
Fatima B.      | 01 - RDC    | Charges mai    | 200,00 DH  | 0,00 DH  | 200,00 DH  | 32 j ⚠️ | Non payé  | [Payer]
Omar T.        | 03 - 1er    | Charges mai    | 200,00 DH  | 100,00 DH| 100,00 DH  | 15 j    | Partiel   | [Payer]
```

"Depuis" :
- > 30j : rouge + ⚠️
- 15–30j : orange
- < 15j : normal

Bouton [Payer] → ouvre EnregistrerPaiementModal avec cotisationDetail pré-sélectionné

---

### PaiementsPage.tsx

```
Header : "Paiements" + Bouton "+ Enregistrer un paiement"

Filtres :
  Date début (date input) | Date fin | Copropriétaire (autocomplete) | [Réinitialiser]

Résumé (si filtres actifs) :
  "Total perçu sur la période : 45 200,00 DH · 87 paiements"

Table :
  Date       | Copropriétaire  | Appartement | Cotisation      | Montant    | Mode     | Référence | Reçu | —
  10/05/2026 | Fatima Benkirane| 01          | Charges mai 2026| 200,00 DH  | Espèces  | —         | 📄   | —
```

- 📄 cliquable → ouvre signed URL PDF dans nouvel onglet
- Si reçu_url = null → icône ⏳ tooltip "Reçu en cours de génération"

---

**EnregistrerPaiementModal.tsx** (voir spec complète API PHASE 9) :

Sections :
1. Recherche copropriétaire (Combobox avec debounce 300ms)
2. Sélection cotisation (liste des non-payées/partielles)
3. Détails paiement :
   - Montant DH : input avec formatage live
     * Placeholder = montant_restant
     * Validation live ≤ restant (erreur rouge + shake si dépassement)
     * Sous le champ : "Restant après ce paiement : **{calculé} DH**" (motion.span avec flash)
   - Date paiement (par défaut = aujourd'hui)
   - Mode : 4 cartes radio avec icônes 💵🏦📋💳
   - Référence (optionnel, placeholder adapté au mode)

Footer :
- [Annuler] | [Enregistrer le paiement]
- Loading : spinner + formulaire disabled
- Succès : toast + fermeture + invalidate queries

**useEnregistrerPaiement** :
```typescript
onSuccess: () => {
  queryClient.invalidateQueries(['paiements']);
  queryClient.invalidateQueries(['cotisations']);
  queryClient.invalidateQueries(['impayes']);
  queryClient.invalidateQueries(['budget', 'summary']); // le total perçu du dashboard
}
```

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 17 — Frontend Copropriétaires, Appartements, Résidences, Immeubles

```
Tu es un senior React 18 developer.
Lis ces fichiers de contexte :
  - UI_UX_SPEC.md (§ E pages 7 et 9)
  - ENTITIES.md (§ 10 User, Appartement, Residence, Immeuble)

Prérequis : Phase 13 complète.

Tâche : Pages Bâtiment + Copropriétaires.

### ResidencesPage.tsx
Cards (pas table) — 3 colonnes desktop, 2 tablet, 1 mobile :
```
┌──────────────────────────────────┐
│ 🏢 Résidence Maarif              │
│ 📍 Casablanca                    │
│ Rue Maarif, Quartier Maarif      │
│ ─────────────────────────────    │
│ 2 immeubles  ·  8 appartements   │
│ Période active : 2026            │
│ ─────────────────────────────    │
│ [Gérer] [Budget] [✏️ Modifier]  │
└──────────────────────────────────┘
```
- Bouton "Gérer" → navigate('/syndic/appartements?residence_id={id}')
- Bouton "Budget" → navigate('/syndic/budget?residence_id={id}')
- Hover card : shadow-card-lg + y -2px

Modal Nouvelle Résidence / Modifier :
- Nom, ville, adresse (textarea)
- Validation Zod avec messages français

### ImmeublesPage.tsx
Filtre résidence en haut (Select, obligatoire si plusieurs résidences)
Table :
```
Immeuble   | Résidence        | Nb Appartements | Actions
Bâtiment A | Résidence Maarif | 4               | ✏️ 🗑️
```
- Confirmation suppression si 0 appartements, blocage avec message si appartements liés

### AppartementsPage.tsx
Filtres : résidence (Select) + immeuble (Select dépendant)
Table :
```
N°  | Étage  | Immeuble   | Résidence        | Tantième | Copropriétaire  | Actions
01  | RDC    | Bâtiment A | Résidence Maarif | 120/1000 | Fatima Benkirane| ✏️ 👤 🗑️
06  | RDC    | Bâtiment B | Résidence Maarif | 100/1000 | Non assigné     | ✏️ [Assigner]
```

Bouton "Assigner" (si coproprietaire_id null) :
- Ouvre un petit modal / inline dropdown
- Recherche copropriétaire (autocomplete)
- Confirmation : "Assigner Fatima Benkirane à l'appartement 06 ?"

Modal Nouvel Appartement :
- Numéro, étage, immeuble (Select), tantième (input décimal)
- Copropriétaire (optionnel, autocomplete)

Modal Modifier :
- Numéro, étage, tantième
- Pas de modification immeuble (risque comptable)

### CoproprietairesPage.tsx
Filtre recherche (nom/email/username) :
```
Table :
Nom              | Username    | Email                | Téléphone    | Appartements | Statut   | Actions
Fatima Benkirane | fatima.b    | fatima@example.com   | 0661 234 567 | 1 appt       | ✅ Actif | 👁️ ✏️ 🔴
```

Action icônes :
- 👁️ → ouvre CoproprietaireDrawer
- ✏️ → ouvre modal édition
- 🔴 → toggle actif/désactivé avec confirm dialog

**CoproprietaireDrawer.tsx** :
Panel droit, slide depuis la droite (width 420px), overlay semi-transparent

Structure :
```
Header :
  Avatar initiales (grandes, bg-brand-100)
  Nom complet + username
  Badge statut (Actif / Désactivé)
  Boutons : [Modifier] [Reset MDP] [Désactiver/Réactiver]

Section Appartements :
  Liste des appartements (numéro + immeuble + résidence + tantième)

Section Cotisations (résumé) :
  Dû ce mois : {montant} DH
  Total impayés : {montant} DH
  Dernière cotisation payée : {date}

Section Derniers Paiements (5) :
  Date | Cotisation | Montant | Mode
  (mini-table, pas de pagination)

Section Dernières Réclamations (3) :
  Date | Titre | Badge statut
```

Animation : slide-in depuis droite (x: 100% → 0, 300ms spring)
Fermeture : clic overlay, bouton ×, ESC

Modal Reset Mot de Passe :
- Champ nouveau mot de passe + confirmation
- Note : "L'utilisateur devra utiliser ce mot de passe à sa prochaine connexion."

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 18 — Frontend Réclamations

```
Tu es un senior React 18 + Framer Motion developer.
Lis ces fichiers de contexte :
  - UI_UX_SPEC.md (§ E page 8, § F page 4)
  - ENTITIES.md (§ 10 Reclamation)
  - CONVENTIONS.md (badges statut)

Prérequis : Phase 13 complète.

Tâche : Pages Réclamations syndic + portail copropriétaire.

### ReclamationsPage.tsx (Syndic)

Header : "Réclamations" + résumé badges :
"3 nouvelles · 2 en cours · 0 urgente non traitée"

Filtres :
- Statut : checkboxes Nouveau | En cours | Traité | Rejeté
- Priorité : Toutes | Normale | Urgente
- Date range
- Bouton "Réinitialiser"

Table :
```
Copropriétaire   | Appartement | Titre                | Priorité    | Statut      | Date       | Ancienneté | Actions
Fatima Benkirane | 01 - RDC    | Panne ascenseur      | 🔴 Urgente  | 🔵 Nouveau  | 10/05/2026 | 2 jours    | 👁️
Omar Tazi        | 03 - 1er    | Éclairage défectueux | ⚪ Normale  | 🟡 En cours | 08/05/2026 | 4 jours    | 👁️
```

Tri défaut : urgentes d'abord, puis par date DESC
Badge "Nouveau" : animate-pulse ring bleu

**ReclamationDetailModal.tsx** :
Taille : max-w-2xl

Structure :
```
Header :
  Titre réclamation + badge statut + badge priorité

Body :
  ┌─────────────────────────────────┐
  │ Copropriétaire : Fatima Benkirane│
  │ Appartement    : 01 - RDC        │
  │ Date           : 10/05/2026      │
  │ Ancienneté     : 2 jours         │
  └─────────────────────────────────┘

  Description :
  [bg-surface-50 rounded-lg p-4]
  "L'ascenseur est en panne depuis..."

  Réponse syndic existante (si présente) :
  [bg-success-light rounded-lg p-4]
  "Réponse le 11/05/2026 : Un technicien est prévu..."

  Section Mise à jour (si statut != traite ET != rejete) :
  ─────────────────────────
  Nouveau statut :
  [Select] En cours | Traité | Rejeté

  Réponse au copropriétaire (optionnel) :
  [Textarea placeholder="Votre réponse au copropriétaire..."]
  ─────────────────────────
```

Footer :
[Fermer] | [Sauvegarder les modifications] (primary)
Loading : spinner + fields disabled
Succès : toast "Statut mis à jour. Le copropriétaire a été notifié." + refresh table

---

### MesReclamationsPage.tsx (Copropriétaire)

Header : "Mes Réclamations" + bouton "+ Nouvelle réclamation"

Table :
```
Date       | Titre                 | Appartement | Priorité    | Statut      | Réponse
10/05/2026 | Panne ascenseur       | 01 - RDC    | 🔴 Urgente  | 🔵 Nouveau  | En attente
08/05/2026 | Éclairage défectueux  | 01 - RDC    | ⚪ Normale  | ✅ Traité   | "Un technicien..."
```

Colonne "Réponse" :
- "En attente" en gris si pas de réponse
- Réponse tronquée 60 chars + lien "Voir la réponse complète"

Row expandable (clic sur ligne) :
- Affiche description complète + réponse complète
- Timeline statut (icônes + dates)

**NouvelleReclamationForm.tsx** (dans modal) :
- Appartement : pré-sélectionné si 1 seul, dropdown sinon
- Titre (input, max 200 chars)
- Description (textarea, 2000 chars max + compteur restant)
- Priorité : 2 cartes radio
  ```
  ┌─────────────────┐ ┌─────────────────┐
  │ ⚪ Normale       │ │ 🔴 Urgente      │
  │ Pour les sujets │ │ Nécessite une   │
  │ non urgents     │ │ action rapide   │
  └─────────────────┘ └─────────────────┘
  ```
- Bouton "Soumettre la réclamation"
- Succès : toast "Réclamation soumise. Le syndic a été notifié." + fermeture + refresh

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 19 — Frontend Portail Copropriétaire

```
Tu es un senior React 18 developer.
Lis ces fichiers de contexte :
  - UI_UX_SPEC.md (§ F — toutes les pages copropriétaire)
  - ENTITIES.md (§ 10 interfaces)
  - PROJECT.md (§ 3.2 copropriétaire)

Prérequis : Phases 13 + 18 complètes.

Tâche : Construire le portail copropriétaire complet.

### CoproprietaireLayout.tsx
Navigation simplifiée (sidebar plus légère ou topbar) :
- Logo SyndicPro
- Navigation : Tableau de bord | Mes Cotisations | Mes Paiements | Mes Réclamations
- User info + logout

### CoproDashboardPage.tsx

Salutation personnalisée :
```tsx
<h1 className="text-2xl font-bold text-text-primary">
  Bonjour, <span className="text-brand-600">{user.name.split(' ')[0]}</span> 👋
</h1>
<p className="text-text-secondary">Voici un résumé de votre situation.</p>
```

4 KPI Cards :
1. "Montant dû ce mois" : rouge si > 0, vert si 0
2. "Total impayés" : rouge + nb cotisations
3. "Dernier paiement" : date + montant (gris si aucun)
4. "Réclamations en cours" : bleu + nb

Section "Mes Appartements" :
```
┌──────────────────────────────────┐
│ 🚪 Appartement 01                │
│ RDC · Bâtiment A                 │
│ Résidence Maarif, Casablanca     │
│ Tantième : 120/1 000             │
└──────────────────────────────────┘
```

Raccourcis rapides :
```
[💳 Voir mes cotisations] [📢 Nouvelle réclamation] [📋 Mes paiements]
```

Section "Activité Récente" :
- Chronologie des 5 dernières actions (paiements + réclamations)
- Icône 💳 pour paiement, 📢 pour réclamation
- Format : "Paiement de 200,00 DH · Charges mai 2026 · 10/05/2026"

### MesCotisationsPage.tsx

2 onglets : Cotisations Fixes | Cotisations Exceptionnelles

Table Fixes :
```
Période      | Label               | Montant    | Payé       | Restant    | Statut
Mai 2026     | Charges mensuelles  | 200,00 DH  | 200,00 DH  | 0,00 DH    | ✅ Payé
Avril 2026   | Charges mensuelles  | 200,00 DH  | 0,00 DH    | 200,00 DH  | 🔴 Non payé
```

Ligne expandable → historique des paiements pour cette cotisation :
```
  Date       | Montant   | Mode      | Référence | Reçu
  05/04/2026 | 200,00 DH | Espèces   | —         | 📄
```

Table Exceptionnelles :
```
Label            | Montant Total | Montant Calculé | Payé      | Restant   | Statut
Réfection toiture| 12 000,00 DH  | 1 440,00 DH     | 720,00 DH | 720,00 DH | 🟡 Partiel
```

### MesPaiementsPage.tsx

Filtres : date range + type cotisation

Table :
```
Date       | Cotisation          | Montant    | Mode      | Référence | Reçu
10/05/2026 | Charges mai 2026    | 200,00 DH  | Espèces   | —         | 📄
05/04/2026 | Charges avril 2026  | 200,00 DH  | Virement  | VIR-001   | 📄
```

Icône 📄 : télécharge reçu PDF
Si reçu_url = null : ⏳ tooltip "En cours de génération"

Total en bas : "Total payé : X,XX DH · {n} paiements"

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 20 — Polish : Animations, États Vides, Accessibilité

```
Tu es un senior React 18 + Framer Motion + a11y expert.
Lis ces fichiers de contexte :
  - UI_UX_SPEC.md (§ D animations complètes, § C patterns UI)
  - CONVENTIONS.md (§ 4 animations, checklist pre-commit)

Prérequis : Toutes les phases 13–19 complètes.

Tâche : Polish complet — animations, états vides, accessibilité, formatage.

### 1. Toutes les Animations de la Checklist (UI_UX_SPEC.md § G)

Vérifier et implémenter chaque animation listée, dans l'ordre :

1. **Sidebar collapse** : motion.aside width 240→64px, labels fade
2. **KPI count-up** : react-countup sur tous les KpiCard
3. **Budget progress bars** : motion initial={width:0} animate={width:`${pct}%`}
4. **Table stagger** : rows fade-in delay 40ms/item
5. **Modal open/close** : backdrop fade + panel slide-up spring
6. **Toast slide** : x: 100 → 0
7. **Submit button states** : idle/loading/success/error AnimatePresence
8. **Form shake error** : x oscillation sur submit invalide
9. **Status badge cross-fade** : backgroundColor animation
10. **KPI hover** : y -2px + shadow
11. **Expandable rows** : height auto animation overflow hidden
12. **Wizard step progress** : step circle + connecting line animation
13. **Amount live format** : useAmountFormatter sur tous les inputs montant
14. **Paiement partiel live** : motion.span key change pour flash restant
15. **Réclamation badge pulse** : ring animation sur statut "nouveau"

### 2. Skeleton Loaders — Complet

Vérifier TOUTES les sections de données asynchrones :

```typescript
// Pattern obligatoire sur toutes les pages
if (isLoading) return <SkeletonPageContent />;
if (isError)   return <ErrorState onRetry={refetch} />;
if (!data)     return <EmptyState />;
return <ActualContent />;
```

Skeletons manquants à implémenter :
- `SkeletonKpiRow` (6 cards grises)
- `SkeletonTableFull` (header + 5 lignes)
- `SkeletonBudgetTable` (reproduit exactement la structure BudgetTable)
- `SkeletonChartBar` (barres grises)
- `SkeletonChartPie` (cercle gris)
- `SkeletonDrawer` (pour CoproprietaireDrawer)

### 3. États Vides — Tous les Scénarios

Implémenter avec SVG illustration + titre + description + CTA :

```typescript
const emptyStates = {
  residences:      { title: "Aucune résidence", description: "Commencez par créer votre première résidence.", cta: "+ Nouvelle résidence" },
  depenses:        { title: "Aucune dépense enregistrée", description: "Toutes les dépenses de cette période apparaîtront ici.", cta: "+ Ajouter une dépense" },
  cotisations:     { title: "Aucune cotisation", description: "Créez des cotisations pour les copropriétaires.", cta: "+ Créer une cotisation" },
  impayes:         { title: "Aucun impayé 🎉", description: "Tous les copropriétaires sont à jour.", cta: null },
  paiements:       { title: "Aucun paiement", description: "Les paiements enregistrés apparaîtront ici.", cta: null },
  reclamations:    { title: "Aucune réclamation", description: "Les réclamations des copropriétaires apparaîtront ici.", cta: null },
  mes_cotisations: { title: "Aucune cotisation", description: "Le syndic n'a pas encore généré de cotisations pour votre appartement.", cta: null },
  mes_paiements:   { title: "Aucun paiement", description: "Votre historique de paiements apparaîtra ici.", cta: null },
};
```

Illustrations SVG : dessiner des SVG simples et propres (maison, calendrier, monnaie, etc.) — thème immobilier.

### 4. États d'Erreur

```typescript
// ErrorState.tsx
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}
// Affiche : icône ⚠️ + message + bouton "Réessayer" si onRetry fourni
```

Implémenter sur toutes les pages via :
```typescript
if (isError) return (
  <ErrorState
    message="Impossible de charger les données. Vérifiez votre connexion."
    onRetry={refetch}
  />
);
```

### 5. Accessibilité

- `aria-label` sur tous les boutons icon-only (supprimer, modifier, fermer, etc.)
- `role="status"` sur les skeleton loaders
- `aria-live="polite"` sur les zones de notification toast
- Focus trap dans modales : utiliser `@radix-ui/react-dialog` ou implémentation manuelle
- ESC ferme modales et drawers (déjà fait — vérifier)
- `tabIndex` correct sur DataTable rows interactives
- Contraste couleur : vérifier brand-600 sur fond blanc (ratio ≥ 4.5:1)

### 6. Reduced Motion

```typescript
// Dans tous les composants animés
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();
const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' };
```

### 7. Formatage Universel — Audit Final

Vérifier chaque fichier TSX :
- [ ] Tous les montants passent par `formatCurrency()`
- [ ] Toutes les dates passent par `formatDate()` ou `formatDateTime()`
- [ ] Aucun `new Date().toLocaleDateString()` non formaté
- [ ] Aucun montant affiché avec `.toFixed(2)` sans "DH"
- [ ] Tous les nombres > 999 ont séparateur de milliers

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 21 — Tests

```
Tu es un senior PHP developer (Pest) + TypeScript developer.
Lis ces fichiers de contexte :
  - PROJECT.md (§ 4 règles métier — à tester en priorité)
  - ENTITIES.md (§ 5 CotisationService, § 6 PaiementService, § 4 BudgetService)
  - CONVENTIONS.md (§ 2 règles sécurité — isolation données)

Tâche : Écrire la suite de tests complète.

### Tests Feature (Pest PHP)

**Auth** (`tests/Feature/Auth/AuthTest.php`) :
```php
it('allows syndic to login with valid credentials')
it('rejects login with invalid password')
it('blocks disabled account from login')
it('rate limits login attempts after 5 failures')
it('returns correct user role in response')
it('logout invalidates session')
it('me returns authenticated user data')
```

**Résidences — Isolation Syndic** (`tests/Feature/Syndic/ResidenceTest.php`) :
```php
it('syndic can only see own residences')
it('syndic cannot view another syndic residence')  // 403
it('syndic can create a residence')
it('syndic can update own residence')
it('syndic cannot update another syndic residence') // 403
it('syndic can delete own residence')
```

**Budget — Recalcul Automatique** (`tests/Feature/Syndic/BudgetTest.php`) :
```php
it('recalculates budget when depense is created')
it('recalculates budget when depense is updated')
it('recalculates budget when depense is deleted')
it('budget restant = prevu - consomme')
it('detects budget depassement correctly')
it('invalidates cache on depense mutation')
```

**Cotisations — 3 Modes** (`tests/Feature/Syndic/CotisationTest.php`) :
```php
it('generates equal distribution correctly')
// Vérifie : SUM(details.montant) = cotisation.montant_total
// Vérifie : tous les montants = montant_total / nb_appartements

it('generates tantieme distribution correctly')
// Appartement tantième=80, total=1000, cotisation=12000
// Vérifie : detail.montant = (80/1000) * 12000 = 960.00

it('generates per_appartement distribution correctly')
// Vérifie que les montants correspondent à la map fournie
// Vérifie : SUM(montants) = cotisation.montant_total

it('only considers active appartements in generation')
// Soft-delete un appartement → ne doit pas apparaître dans les détails

it('idempotent monthly generation')
// Appeler 2 fois → ne crée pas de doublons
```

**Paiements** (`tests/Feature/Syndic/PaiementTest.php`) :
```php
it('records full payment and updates statut to paye')
it('records partial payment and updates statut to partiellement_paye')
it('rejects payment exceeding restant a payer')
it('rejects payment on already fully paid cotisation')
it('dispatches GenerateReceipt job on payment')
it('PaiementObserver updates montant_paye correctly')
it('statut is always calculated never set manually')
```

**Réclamations** (`tests/Feature/Syndic/ReclamationTest.php`) :
```php
it('coproprietaire can create reclamation for own appartement')
it('coproprietaire cannot create reclamation for another appartement') // 403
it('syndic can update statut to en_cours')
it('syndic can update statut to traite with reponse')
it('coproprietaire cannot update statut') // 403
it('notification sent to syndic on new reclamation')
it('notification sent to coproprietaire on statut update')
```

**Isolation Copropriétaire** (`tests/Feature/Coproprietaire/IsolationTest.php`) :
```php
it('cannot view cotisation belonging to other coproprietaire')  // 403
it('cannot view paiement belonging to other coproprietaire')    // 403
it('cannot view reclamation belonging to other coproprietaire') // 403
it('cannot access syndic routes') // 403
it('dashboard only shows own data')
```

### Tests Unitaires (`tests/Unit/`)

**BudgetServiceTest.php** :
```php
it('calculates montant_restant as prevu minus consomme')
it('detects depassement when consomme exceeds prevu')
it('recalculates correctly after multiple depenses')
```

**CotisationServiceTest.php** :
```php
it('egale: each appartement gets same amount')
it('tantieme: amount proportional to tantieme fraction')
it('tantieme: throws when total tantiemes is zero')
it('par_appartement: uses provided montants_map')
it('par_appartement: throws when sum differs from total')
it('generateDetails returns correct count of details')
```

**PaiementServiceTest.php** :
```php
it('statut is non_paye when no payments')
it('statut is partiellement_paye when partial payment')
it('statut is paye when full payment')
it('montant_paye equals sum of all payments')
it('cannot pay more than restant')
```

### Configuration Pest

```php
// tests/Pest.php
uses(Tests\TestCase::class, Illuminate\Foundation\Testing\RefreshDatabase::class)->in('Feature');
uses(Tests\TestCase::class)->in('Unit');

// helpers
function syndicWith(array $attrs = []): User
function coproprietaireWith(array $attrs = []): User
function residenceFor(User $syndic): Residence
```

Ne passez pas à la phase suivante sans mon approbation.
```

---

## PHASE 22 — Build & Déploiement

```
Tu es un senior DevOps / Full-Stack developer.
Lis ces fichiers de contexte :
  - ARCHITECTURE.md (§ 10 queue, § 14 scheduled commands)
  - CONVENTIONS.md (§ 9 checklist pre-commit)
  - PROJECT.md (§ 5 NFRs — sécurité, performance)

Tâche : Préparer le build de production et le déploiement.

### Backend — Optimisations Production

1. **.env.production** :
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api.syndicpro.ma
   
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=syndicpro_prod
   DB_USERNAME=syndicpro_user
   DB_PASSWORD={SECRET}
   
   CACHE_DRIVER=redis
   SESSION_DRIVER=redis
   QUEUE_CONNECTION=redis
   
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   
   MAIL_MAILER=smtp
   MAIL_HOST={SMTP_HOST}
   MAIL_PORT=587
   MAIL_USERNAME={SMTP_USER}
   MAIL_PASSWORD={SECRET}
   MAIL_FROM_ADDRESS=noreply@syndicpro.ma
   MAIL_FROM_NAME=SyndicPro
   
   SANCTUM_STATEFUL_DOMAINS=syndicpro.ma,www.syndicpro.ma
   SESSION_DOMAIN=.syndicpro.ma
   ```

2. **Commandes de cache production** :
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan event:cache
   ```

3. **Supervisor config** (queue worker) :
   ```ini
   [program:syndicpro-worker]
   process_name=%(program_name)s_%(process_num)02d
   command=php /var/www/syndicpro-api/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
   autostart=true
   autorestart=true
   stopasgroup=true
   killasgroup=true
   numprocs=2
   redirect_stderr=true
   stdout_logfile=/var/log/syndicpro-worker.log
   
   [program:syndicpro-receipts]
   command=php /var/www/syndicpro-api/artisan queue:work redis --queue=receipts --sleep=3 --tries=3
   autostart=true
   autorestart=true
   numprocs=1
   ```

4. **Cron** (scheduler Laravel) :
   ```cron
   * * * * * www-data php /var/www/syndicpro-api/artisan schedule:run >> /dev/null 2>&1
   ```

5. **Nginx config (backend)** :
   ```nginx
   server {
     listen 443 ssl;
     server_name api.syndicpro.ma;
     root /var/www/syndicpro-api/public;
     
     add_header X-Frame-Options "SAMEORIGIN";
     add_header X-Content-Type-Options "nosniff";
     add_header X-XSS-Protection "1; mode=block";
     
     location / {
       try_files $uri $uri/ /index.php?$query_string;
     }
     
     location ~ \.php$ {
       fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
       fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
       include fastcgi_params;
     }
     
     location ~ /\.(?!well-known).* {
       deny all;
     }
   }
   ```

### Frontend — Build Production

6. **`vite.config.ts` production** :
   ```typescript
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           react:    ['react', 'react-dom'],
           router:   ['react-router-dom'],
           query:    ['@tanstack/react-query'],
           charts:   ['recharts'],
           motion:   ['framer-motion'],
           utils:    ['date-fns', 'zustand', 'axios'],
         }
       }
     },
     chunkSizeWarningLimit: 600,
   }
   ```

7. **`.env.production`** :
   ```
   VITE_API_URL=https://api.syndicpro.ma
   ```

8. **Nginx config (frontend SPA)** :
   ```nginx
   server {
     listen 443 ssl;
     server_name syndicpro.ma www.syndicpro.ma;
     root /var/www/syndicpro-front/dist;
     
     location / {
       try_files $uri $uri/ /index.html;
     }
     
     location ~* \.(js|css|png|jpg|svg|ico|woff2)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }
   }
   ```

### Checklist Finale

**Code quality** :
- [ ] `grep -r "console.log" src/` → 0 résultats
- [ ] `grep -r "dd\(\|dump\(" app/` → 0 résultats
- [ ] `grep -r "TODO\|FIXME\|HACK" app/ src/` → résolu ou documenté
- [ ] `npm run tsc` → 0 erreurs TypeScript
- [ ] `php artisan test` → 100% passing

**Sécurité** :
- [ ] `.env` et `.env.production` dans `.gitignore`
- [ ] `APP_DEBUG=false` en production
- [ ] CORS : `allowed_origins` = uniquement domaine frontend
- [ ] Fichiers uploadés : non accessibles directement (hors `public/`)
- [ ] Rate limiting : login et routes financières

**Performance** :
- [ ] `npm run build` bundle size < 2 MB total
- [ ] Cache Redis opérationnel
- [ ] Queue workers actifs
- [ ] Index MySQL vérifiés avec `EXPLAIN` sur requêtes principales

**Fonctionnel** :
- [ ] Login syndic → dashboard avec données réelles
- [ ] Login copropriétaire → dashboard self-service
- [ ] Créer une dépense → budget recalculé
- [ ] Enregistrer un paiement → statut cotisation mis à jour + reçu généré
- [ ] Créer une réclamation → email syndic reçu
- [ ] Scheduler test : `php artisan cotisations:generate-monthly` idempotent

**README.md** — Inclure :
```markdown
## Installation

### Prérequis
- PHP 8.3+, Composer, MySQL 8+, Node.js 20+, Redis

### Backend
git clone ...
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link

### Frontend
cd syndicpro-front
npm install
cp .env.example .env.local
npm run dev

### Comptes de démonstration
Syndic         : username=syndic    / password=password
Copropriétaire : username=fatima.b  / password=password
```

Ne passez pas à la phase suivante sans mon approbation.
```
