# UI_UX_SPEC.md — SyndicPro
## Design Bible Complète — Remplace Figma

---

## A. Identité Design

**Philosophie** : Dashboard SaaS premium pour la gestion immobilière marocaine.
Précision de Notion · Clarté des données de Linear · Propreté de Stripe.
Outil quotidien : vitesse, lisibilité, efficacité avant tout.

**Ne doit PAS ressembler à** : Bootstrap générique, admin PHP des années 2010, templates arabes amateur, interfaces WordPress.

**Personnalité** : professionnel · digne de confiance · structuré · moderne · efficace · marocain

---

## B. Design Tokens

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand — Navy profond (autorité, finance, confiance)
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',  // brand principal
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',  // très foncé pour sidebar
          950: '#1e1b4b',  // fond sidebar
        },
        // Accent — Ambre chaud (action, Maroc)
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // accent principal
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Surfaces
        surface: {
          DEFAULT: '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
        },
        // Texte
        text: {
          primary:   '#0f172a',
          secondary: '#475569',
          muted:     '#94a3b8',
          inverse:   '#ffffff',
        },
        // Status — Finance
        success: {
          light: '#dcfce7',
          DEFAULT: '#16a34a',
          dark:  '#15803d',
        },
        warning: {
          light: '#fef9c3',
          DEFAULT: '#ca8a04',
          dark:  '#a16207',
        },
        danger: {
          light: '#fee2e2',
          DEFAULT: '#dc2626',
          dark:  '#b91c1c',
        },
        info: {
          light: '#dbeafe',
          DEFAULT: '#2563eb',
          dark:  '#1d4ed8',
        },
        // Cotisation statuts
        statut: {
          paye:         '#16a34a',
          partiel:      '#ca8a04',
          impaye:       '#dc2626',
          nouveau:      '#2563eb',
          en_cours:     '#d97706',
          traite:       '#16a34a',
          rejete:       '#6b7280',
        },
      },
      fontFamily: {
        sans:  ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1rem' }],
        sm:   ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem',     { lineHeight: '1.5rem' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':['1.5rem',   { lineHeight: '2rem' }],
        '3xl':['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':['2.25rem',  { lineHeight: '2.5rem' }],
      },
      spacing: {
        // Grille 8pt
        1: '0.25rem',   //  4px
        2: '0.5rem',    //  8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        5: '1.25rem',   // 20px
        6: '1.5rem',    // 24px
        8: '2rem',      // 32px
        10: '2.5rem',   // 40px
        12: '3rem',     // 48px
        16: '4rem',     // 64px
        20: '5rem',     // 80px
        24: '6rem',     // 96px
      },
      borderRadius: {
        none: '0',
        sm:   '0.25rem',   // 4px — inputs, badges petits
        DEFAULT:'0.5rem',  // 8px — buttons, inputs standard
        md:   '0.5rem',
        lg:   '0.75rem',   // 12px — cards
        xl:   '1rem',      // 16px — modals, panels
        '2xl':'1.5rem',    // 24px — gros éléments
        full: '9999px',    // pill — badges status
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-md':'0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        'card-lg':'0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        dropdown:'0 4px 16px -2px rgb(0 0 0 / 0.12), 0 2px 8px -2px rgb(0 0 0 / 0.08)',
        modal:   '0 20px 60px -10px rgb(0 0 0 / 0.25)',
        toast:   '0 8px 32px -4px rgb(0 0 0 / 0.15)',
        focus:   '0 0 0 3px rgb(99 102 241 / 0.35)',
      },
      transitionDuration: {
        fast:   '150ms',
        normal: '250ms',
        slow:   '400ms',
        budget: '600ms',
      },
      transitionTimingFunction: {
        'ease-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring':      'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out':    'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## C. Patterns UI Globaux

### App Shell
```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (240px expanded / 64px collapsed)              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Logo "SyndicPro"                       [◀]      │   │
│  │ ────────────────────────────────────────────     │   │
│  │ [🏢] Résidence Maarif         ▼                │   │
│  │ ────────────────────────────────────────────     │   │
│  │ VUE D'ENSEMBLE                                   │   │
│  │   [📊] Tableau de bord                          │   │
│  │ BÂTIMENT                                         │   │
│  │   [🏠] Résidences                               │   │
│  │   [🏗️] Immeubles                               │   │
│  │   [🚪] Appartements                             │   │
│  │ COPROPRIÉTAIRES                                  │   │
│  │   [👥] Copropriétaires                          │   │
│  │ FINANCES                                         │   │
│  │   [💰] Budget                                   │   │
│  │   [📋] Charges & Dépenses                       │   │
│  │   [📄] Cotisations                              │   │
│  │   [💳] Paiements                                │   │
│  │ RÉCLAMATIONS                                     │   │
│  │   [📢] Réclamations    [3]                      │   │
│  │ RAPPORTS                                         │   │
│  │   [📈] Rapports                                 │   │
│  │ ────────────────────────────────────────────     │   │
│  │ [👤] Ahmed Benali                   [logout]    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  TOPBAR (64px)                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [≡]  Tableau de bord            [🔔] [👤]      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  MAIN CONTENT                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  (contenu de la page)                            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Montants Financiers
```tsx
// Toujours : font-mono font-semibold text-text-primary
// Suffixe "DH" en text-text-muted text-sm
<span className="font-mono font-semibold text-text-primary">
  1 200,00 <span className="text-text-muted text-sm font-normal">DH</span>
</span>
```

### Badges de Statut
```tsx
// Pill shape avec ● indicateur couleur
// cotisation_detail
const statutConfig = {
  paye:              { label: 'Payé',           color: 'bg-success-light text-success-dark' },
  partiellement_paye:{ label: 'Partiel',        color: 'bg-warning-light text-warning-dark' },
  non_paye:          { label: 'Non payé',       color: 'bg-danger-light text-danger-dark'   },
};
// réclamation
const reclamationConfig = {
  nouveau:  { label: 'Nouveau',  color: 'bg-info-light text-info-dark',    pulse: true  },
  en_cours: { label: 'En cours', color: 'bg-warning-light text-warning-dark', pulse: false },
  traite:   { label: 'Traité',   color: 'bg-success-light text-success-dark', pulse: false },
  rejete:   { label: 'Rejeté',   color: 'bg-surface-200 text-text-secondary', pulse: false },
};
```

### Tables
```tsx
// Structure : striped (bg-surface-50 sur lignes impaires), hover bg-brand-50 150ms
// Header : bg-surface-100, text-text-secondary text-xs font-semibold uppercase tracking-wider
// Colonnes triables : flèche indicateur ↕ / ↑ / ↓ qui rotate au clic
// Mobile : overflow-x-auto, première colonne sticky
```

### Formulaires
```tsx
// Label : au-dessus du champ, text-sm font-medium text-text-secondary mb-1
// Input : border border-surface-300 rounded focus:ring-2 focus:ring-brand-500
//         focus:border-brand-500 transition-all duration-fast
// Erreur : text-danger text-xs mt-1 (shake animation si form submit avec erreurs)
// Champs montant : font-mono, formatage live "1 200,00 DH"
```

### Modales
```tsx
// max-w-lg (600px), centered, backdrop blur-sm bg-black/40
// Animation : backdrop fade 250ms + slide-up spring 300ms
// Header : titre h2 + bouton fermer (×)
// Footer : boutons alignés à droite (Annuler | Action principale)
// Confirmation delete : bouton rouge "Supprimer définitivement"
```

### Toast Système
```tsx
// Position : top-right, z-50
// Animation : slide-in depuis droite 250ms, slide-out vers droite
// Auto-dismiss : 4 secondes avec barre de progression
// Types : success (vert) | error (rouge) | warning (ambre) | info (bleu)
```

### États Vides
```tsx
// Illustration SVG simple + titre + description + bouton d'action (si applicable)
// Exemples :
// "Aucune dépense enregistrée" → bouton "+ Ajouter une dépense"
// "Aucune réclamation" → pas de bouton (syndic)
```

### Skeleton Loaders
```tsx
// Utilisés sur toutes les sections avec données asynchrones
// Classes : animate-pulse bg-surface-200 rounded
// Reproduire exactement la forme du contenu réel (même hauteur/largeur)
```

### Barre de Progression Budget
```tsx
// Couleur dynamique selon % consommé :
// 0–60%  → bg-success     (vert)
// 60–85% → bg-warning     (ambre)
// 85%+   → bg-danger      (rouge)
// Animation : width 0 → valeur réelle sur 600ms ease-out au mount
```

---

## D. Système d'Animation

### Référence Tokens
```typescript
// Durées
const duration = { fast: 150, normal: 250, slow: 400, budget: 600 } // ms

// Easings (Framer Motion)
const easing = {
  smooth: [0.4, 0, 0.2, 1],
  spring: { type: 'spring', stiffness: 300, damping: 25 },
  easeOut: [0, 0, 0.2, 1],
}
```

### Animations Obligatoires (toutes doivent être implémentées)

**1. Sidebar collapse**
```tsx
<motion.aside
  animate={{ width: isCollapsed ? 64 : 240 }}
  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
>
  {/* Icons toujours visibles — labels cachés en collapsed */}
</motion.aside>
```

**2. KPI Cards — Count-up**
```tsx
// Utiliser react-countup ou implémentation custom avec useMotionValue
// Anime de 0 → valeur réelle sur mount, durée 1200ms, ease-out
```

**3. Budget Progress Bar**
```tsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 0.6, ease: 'easeOut' }}
  className={getProgressColor(percentage)}
/>
```

**4. Table Rows — Stagger**
```tsx
<AnimatePresence>
  {rows.map((row, i) => (
    <motion.tr
      key={row.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04, duration: 0.2 }}
    />
  ))}
</AnimatePresence>
```

**5. Modal**
```tsx
// Backdrop
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  transition={{ duration: 0.25 }} />
// Panel
<motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 40 }}
  transition={{ type: 'spring', stiffness: 300, damping: 28 }} />
```

**6. Toast**
```tsx
<motion.div
  initial={{ x: 100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 100, opacity: 0 }}
  transition={{ duration: 0.25 }}
/>
```

**7. Submit Button States**
```tsx
// idle → loading (spinner tourne) → success (✓) ou error (✗)
// Morphing du contenu avec AnimatePresence
```

**8. Form Shake Error**
```tsx
const shakeVariants = {
  shake: { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.4 } }
};
// Déclenché sur submit avec erreurs de validation
```

**9. Réclamation statut badge color-cross-fade**
```tsx
<motion.span animate={{ backgroundColor: statusColors[statut] }}
  transition={{ duration: 0.2 }} />
```

**10. Hover KPI Card**
```tsx
<motion.div whileHover={{ y: -2, boxShadow: shadows.cardLg }}
  transition={{ duration: 0.2 }} />
```

**11. Expandable rows (budget sous-charges)**
```tsx
<motion.div
  initial={false}
  animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
  style={{ overflow: 'hidden' }}
/>
```

**12. Cotisation generation — Step Progress**
```tsx
// Multi-step wizard avec barre de progression animée
// Step indicator : cercles numérotés, ligne de connexion animée
// Transition entre steps : slide horizontal
```

**13. Amount field live formatting**
```typescript
// Sur onChange du champ montant :
// "12000" → "12 000,00 DH" formatté en temps réel
// Utiliser useAmountFormatter hook
```

**14. Paiement partiel — remaining update**
```tsx
// Quand l'utilisateur tape dans le champ montant :
// "Restant après ce paiement : X,XX DH" mis à jour en temps réel
// Avec motion.span animate key change pour flash
```

**Reduced Motion** : tous les useReduceMotion() de Framer Motion doivent être
respectés — désactive les animations si l'utilisateur a activé `prefers-reduced-motion`.

---

## E. Pages Syndic — Spécifications Complètes

### 1. Sidebar Navigation
- Logo : "Syndic**Pro**" — "Syndic" en font-sans normal, "Pro" en text-accent-500 font-bold
- Sélecteur résidence : si plusieurs résidences → dropdown avec recherche
  Badge avec nb immeubles à côté du nom
- Sections de navigation avec groupement :
  - `VUE D'ENSEMBLE` : Tableau de bord
  - `BÂTIMENT` : Résidences | Immeubles | Appartements
  - `COPROPRIÉTAIRES`
  - `FINANCES` : Budget | Charges & Dépenses | Cotisations | Paiements
  - `RÉCLAMATIONS` (badge rouge si réclamations nouvelles)
  - `RAPPORTS`
- State actif : bg-brand-900 text-white + barre gauche accent-500 3px
- State hover : bg-brand-900/50 text-white
- Collapsed : icons seuls 24px, tooltip au hover
- Bottom : avatar initiales + nom + icône logout

### 2. Tableau de Bord Syndic

**Row KPIs (6 cards)**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Budget Annuel│ │ Total        │ │ Budget       │
│ Prévu        │ │ Consommé     │ │ Restant      │
│ 80 000,00 DH │ │ 45 000,00 DH │ │ 35 000,00 DH │
│ Exercice 2026│ │ ██████░░ 56% │ │ [vert] ✓    │
└──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Hors Budget  │ │ Total        │ │ Impayés      │
│ Total        │ │ Cotisations  │ │              │
│ 3 200,00 DH  │ │ 96 000,00 DH │ │ 12 400,00 DH │
│              │ │              │ │ 🔴 8 dossiers│
└──────────────┘ └──────────────┘ └──────────────┘
```

**Row Charts**
- Gauche (60%) : BarChart groupé Recharts
  - X : comptes charges (Entretien, Jardinage, Sécurité, etc.)
  - Y : montant DH
  - Séries : Budget Prévu (bleu brand) | Consommé (ambre accent)
  - Tooltip custom : format "12 500,00 DH"
- Droite (40%) : PieChart / Donut Recharts
  - Répartition % par compte charge des dépenses consommées
  - Légende sous le chart
  - Tooltip : label + montant + %

**Row Tableaux Récents**
- Dépenses récentes (5 lignes) : date | sous-charge | montant | icône voir
- Impayés récents (5 lignes) : copropriétaire | appartement | montant | badge statut
- Réclamations récentes (3 lignes) : titre | badge statut | date | bouton voir

### 3. Page Budget Prévisionnel

**Sélecteur de période** : onglets années (2025 | 2026 | [+])
  Onglet actif : bg-brand-600 text-white pill rounded-full

**Résumé global** : 4 KPI cards (Prévu | Consommé | Restant | Hors Budget)

**Table Budget Principale**
```
┌────────────────────┬────────────┬────────────┬────────────┬──────┬────────────────────┐
│ Compte Charge      │ Prévu      │ Consommé   │ Restant    │  %   │ Progression        │
├────────────────────┼────────────┼────────────┼────────────┼──────┼────────────────────┤
│ ▶ Entretien & Rép. │ 20 000 DH  │ 12 500 DH  │  7 500 DH  │ 62%  │ ████████░░ [+]     │
│ ▶ Jardinage        │ 10 000 DH  │  8 500 DH  │  1 500 DH  │ 85%  │ ████████▓░ [+]     │
│ ▶ Sécurité         │ 15 000 DH  │ 18 000 DH  │ -3 000 DH  │ 120% │ ████████████ ⚠️    │
└────────────────────┴────────────┴────────────┴────────────┴──────┴────────────────────┘
```
- Ligne expandable → sous-charges avec leur consommé
- Barre de progression dans colonne "Progression"
- Couleur barre : vert < 60%, ambre 60-85%, rouge > 85%
- Bouton [+] ajouter dépense par ligne
- Alerte banner rouge dismissible si dépassement

**Section Hors Budget** : table séparée en dessous, fond légèrement différent

### 4. Page Charges & Dépenses

**4 onglets** : Comptes Charges | Sous-Charges | Dépenses | Hors Budget

Chaque onglet :
- Header avec bouton "+ Ajouter" à droite
- Filtres au-dessus du tableau (selon contexte)
- Tableau avec actions (modifier | supprimer) par ligne

Onglet Dépenses — colonnes spécifiques :
```
Date | Sous-Charge | Compte | Montant | Description | Justif. | Actions
```
- Icône 📎 si justificatif attaché → ouvre en modal / nouvel onglet

### 5. Page Cotisations

**3 onglets** : Cotisations Fixes | Cotisations Exceptionnelles | Impayés

**Cotisations Exceptionnelles → Wizard Multi-étapes**
```
Étape 1 ───────── Étape 2 ───────── Étape 3
Informations    Prévisualisation  Confirmation
de base         répartition       & Génération
```
- Étape 1 : label, description, montant total, mode répartition (radio buttons visuels)
- Étape 2 : tableau avec appartement / copropriétaire / tantième / montant calculé
  - Mode C : affiche formule sous le tableau
  - Mode B : champs éditables dans le tableau
- Étape 3 : résumé + bouton "Générer les cotisations" (primary, large)
  - État loading : spinner + "Génération en cours..."
  - Succès : animation ✓ + message

**Onglet Impayés — colonnes** :
```
Copropriétaire | Appartement | Cotisation | Montant Dû | Payé | Restant | Ancienneté | Statut | Action
```
- Filtres : résidence, statut, période
- Action "Enregistrer paiement" par ligne → ouvre modal paiement

### 6. Page Paiements

Table avec filtres date/copropriétaire :
```
Date | Copropriétaire | Appartement | Cotisation | Montant | Mode | Référence | Reçu | Actions
```
- Icône PDF 📄 → téléchargement reçu
- Modal "Enregistrer un paiement" :
  - Recherche copropriétaire par nom (autocomplete)
  - Affiche : cotisations non payées du copropriétaire
  - Sélectionner cotisation → affiche montant dû, déjà payé, restant
  - Champ montant avec validation live ≤ restant
  - Champ "Restant après ce paiement : X,XX DH" mis à jour en temps réel
  - Mode paiement : radio buttons avec icônes (💵 Espèces, 🏦 Virement, 📋 Chèque, 💳 Carte)
  - Référence (optionnel)

### 7. Page Copropriétaires

Table :
```
Nom | Email | Téléphone | Nb Appartements | Statut | Actions
```
- Drawer latéral droit (pas modal) sur clic ligne :
  - Info coordonnées + username
  - Appartements owned (avec liens)
  - Résumé cotisations : dû / payé / impayés
  - 5 derniers paiements
  - 3 dernières réclamations
  - Bouton "Modifier" + "Désactiver"

### 8. Page Réclamations (Syndic)

Table :
```
Copropriétaire | Résidence | Titre | Priorité | Statut | Date | Actions
```
- Filtres : statut, priorité, résidence, date range
- Tri défaut : date décroissante, urgentes d'abord
- Badge "nouveau" : pulse animation bleue
- Modal détail :
  - Info complète : titre, description, appartement, date
  - Dropdown statut + textarea réponse syndic
  - Bouton "Sauvegarder" → met à jour + envoie notification

### 9. Pages Bâtiment

**Résidences** : cards (pas table)
```
┌─────────────────────────────┐
│ 🏢 Résidence Maarif         │
│ Casablanca                  │
│ 3 immeubles · 24 apparts    │
│ Période active : 2026       │
│ [Gérer] [Budget] [Modifier] │
└─────────────────────────────┘
```

**Immeubles** : table filtrable par résidence
**Appartements** : table avec résidence / immeuble / étage / numéro / copropriétaire / tantième
- Bouton "Assigner" inline si copropriétaire_id = null → dropdown recherche copropriétaire

---

## F. Pages Copropriétaire — Spécifications Complètes

### 1. Dashboard Copropriétaire

Header personnalisé : "Bonjour, **Fatima** 👋"

**4 KPI Cards**
```
┌────────────────────┐  ┌────────────────────┐
│ Montant dû ce mois │  │ Total impayés       │
│ 200,00 DH          │  │ 600,00 DH           │
│ [rouge si > 0]     │  │ 3 cotisations       │
└────────────────────┘  └────────────────────┘
┌────────────────────┐  ┌────────────────────┐
│ Dernier paiement   │  │ Réclamations        │
│ 05/04/2026         │  │ en cours            │
│ 200,00 DH          │  │ 1                   │
└────────────────────┘  └────────────────────┘
```

**Raccourcis rapides** :
```
[Voir mes cotisations]  [Faire une réclamation]  [Voir mes paiements]
```

**Mes Appartements** : 1 card par appartement
```
🚪 Appartement 12 · 3ème étage
Résidence Maarif · Immeuble B
Tantième : 80/1000
```

**Activité récente** : liste chronologique des 5 derniers paiements + réclamations

### 2. Mes Cotisations

2 onglets : Cotisations Fixes | Cotisations Exceptionnelles

Table :
```
Période | Label | Montant | Payé | Restant | Statut | Action
```
- "Voir détail" → expandable ou drawer avec historique paiements de cette cotisation

### 3. Mes Paiements

Table :
```
Date | Cotisation | Montant | Mode | Reçu
```
- Filtre date range + type cotisation
- Icône PDF 📄 par ligne pour télécharger reçu

### 4. Mes Réclamations

Bouton "+ Nouvelle réclamation" en haut à droite → form modal :
- Appartement (dropdown si plusieurs)
- Titre (text input)
- Description (textarea)
- Priorité (radio : Normale | Urgente)

Table :
```
Date | Titre | Appartement | Priorité | Statut | Réponse Syndic
```
- Colonne "Réponse Syndic" : tronquée 60 chars + "Voir tout" si longue
- Detail view (expandable row) : timeline statut + réponse complète

---

## G. Checklist Micro-interactions

Toutes obligatoires en Phase 20 :

- [x] Sidebar collapse : width 250ms ease
- [x] Sélecteur résidence : dropdown avec recherche, transition fade
- [x] KPI cards : count-up au mount (0 → valeur, 1200ms ease-out)
- [x] Budget progress bars : width 0 → actual% sur 600ms ease-out, viewport enter
- [x] Budget bar couleur : vert → ambre → rouge (gradient dynamique CSS)
- [x] Charts : animation Recharts built-in + fade-in 300ms au mount
- [x] Table rows : stagger fade-in (delay 40ms par ligne) au chargement
- [x] Table row hover : bg transition 150ms
- [x] Colonnes triables : flèche qui rotate 180° sur changement de sens
- [x] Status badges : color-coded, pulse sur "nouveau" réclamation
- [x] Expandable rows budget : height smooth 200ms ease
- [x] Modal open : backdrop fade 250ms + slide-up spring 300ms
- [x] Modal close : animation inverse
- [x] Toast : slide-in droite, barre de progression auto-dismiss 4s
- [x] Form focus : border glow brand-500, label slide up 150ms
- [x] Form error shake : x oscillation 400ms au submit invalide
- [x] Submit button : idle → spinner → ✓ success / ✗ error (AnimatePresence)
- [x] Delete confirm : dialog slide-in, bouton rouge "Supprimer définitivement"
- [x] Wizard cotisation : step progress animé, transitions horizontales
- [x] Amount fields : formatage live "1 200,00 DH" à chaque frappe
- [x] Paiement partiel : "Restant : X DH" mis à jour en temps réel
- [x] Réclamation statut change : badge color cross-fade 200ms

---

## H. Responsive Design

### Breakpoints (Tailwind)
```
sm   : 640px   → mobile landscape
md   : 768px   → tablet portrait
lg   : 1024px  → tablet landscape / petit laptop
xl   : 1280px  → desktop
2xl  : 1536px  → grand écran
```

### Sidebar
- `>= 1024px` : sidebar visible, collapsible en icônes
- `< 1024px`  : sidebar cachée par défaut, bouton hamburger dans topbar
- `< 640px`   : sidebar en drawer complet (overlay)

### Tables
- `>= 768px` : table normale
- `< 768px`  : `overflow-x-auto` + première colonne sticky left-0 bg-white

### KPI Cards
- `>= 1280px` : 6 colonnes (3+3)
- `1024–1280px` : 3 colonnes
- `768–1024px` : 2 colonnes
- `< 768px`   : 1 colonne

### Formulaires
- `< 640px` : tous les champs en full-width

### Charts
- `< 768px` : légende masquée, chart simplifié
- Recharts `ResponsiveContainer` obligatoire sur tous les charts
