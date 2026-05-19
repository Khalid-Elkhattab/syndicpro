# CONVENTIONS.md — SyndicPro
## Standards et Conventions du Projet

---

## 1. Règles de Nommage

### Backend (PHP / Laravel)

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Classes | PascalCase | `BudgetService`, `CotisationDetail` |
| Méthodes | camelCase | `recalculerConsomme()`, `generateDetails()` |
| Variables | camelCase | `$montantTotal`, `$cotisationDetail` |
| Propriétés | snake_case (Eloquent) | `montant_prevu`, `coproprietaire_id` |
| Tables MySQL | snake_case pluriel | `cotisation_details`, `budgets_previsionnels` |
| Migrations | date_snake_case | `2026_01_01_000001_create_users_table.php` |
| Factories | PascalCaseFactory | `CotisationDetailFactory` |
| Seeders | PascalCaseSeeder | `BudgetPrevisionnelSeeder` |
| Routes nommées | dot.notation | `syndic.cotisations.store-fixe` |
| Enums PHP | PascalCase + values en anglais | `UserRole::Syndic`, `CotisationDetailStatut::Paye` |
| FormRequests | Action + Entité + Request | `StoreCotisationFixeRequest` |
| Resources | Entité + Resource | `BudgetPrevisionnelResource` |

### Frontend (TypeScript / React)

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Composants | PascalCase | `BudgetTable`, `KpiCard` |
| Hooks | camelCase préfixé use | `useBudget`, `useCotisations` |
| Variables | camelCase | `montantTotal`, `activeResidence` |
| Fichiers composants | PascalCase.tsx | `EnregistrerPaiementModal.tsx` |
| Fichiers hooks | camelCase.ts | `usePaiements.ts` |
| Fichiers API | camelCase.api.ts | `cotisation.api.ts` |
| Interfaces TypeScript | PascalCase | `Cotisation`, `ApiResponse<T>` |
| Types unions | camelCase string literals | `'non_paye' \| 'paye'` |
| Stores Zustand | camelCase Store | `authStore`, `residenceStore` |
| Clés React Query | tableaux string | `['budget', periodeId]` |

### Labels UI
- **Toujours en français** — aucun mot anglais visible par l'utilisateur final
- Exemples corrects : "Enregistrer", "Annuler", "Supprimer", "Tableau de bord"
- Exemples interdits : "Submit", "Cancel", "Delete", "Dashboard"

---

## 2. Règles de Sécurité

### 2.1 Isolation des Données Syndic
```php
// RÈGLE ABSOLUE : un syndic ne voit que ses résidences
// Toute Policy de résidence vérifie :
$user->id === $residence->syndic_id
// Cette vérification doit être dans la Policy ET dans le Repository
```

### 2.2 Isolation des Données Copropriétaire
```php
// Un copropriétaire ne voit que :
// - Ses propres appartements (appartements.coproprietaire_id = user.id)
// - Ses propres cotisation_details (cotisation_details.coproprietaire_id = user.id)
// - Ses propres paiements (paiements.coproprietaire_id = user.id)
// - Ses propres réclamations (reclamations.coproprietaire_id = user.id)
// JAMAIS de données financières d'autres copropriétaires dans une réponse API
```

### 2.3 Validation des Inputs
- Toute donnée entrante est validée via un `FormRequest` dédié
- Messages d'erreur : **toujours en français**
- Règle stricte : pas de validation dans le Controller ou le Service

### 2.4 Rate Limiting
```php
// config/sanctum.php ou RouteServiceProvider
'login'     => '5,1'      // 5 tentatives par minute
'financial' => '20,1'     // 20 requêtes financières par minute
// Appliqué à : login, POST paiements, POST cotisations, POST dépenses
```

### 2.5 Uploads de Fichiers
```php
// Règles strictes pour justificatifs et reçus
'justificatif' => [
    'nullable',
    'file',
    'mimes:pdf,jpg,jpeg,png',
    'max:5120',  // 5 MB en kilobytes
]
// Stockage : hors de public/ via Spatie Media Library
// Accès    : uniquement via URL signée temporaire (60 min)
```

### 2.6 Soft Delete Obligatoire
```php
// Entités avec soft delete : User, Appartement
// Raison : audit trail financier obligatoire
// Ne JAMAIS hard-delete un utilisateur ou un appartement
use SoftDeletes;
```

### 2.7 Réinitialisation de Mot de Passe
- Les copropriétaires ne peuvent PAS réinitialiser leur propre mot de passe (v1)
- Seul le syndic peut réinitialiser via `POST /api/syndic/coproprietaires/{id}/reset-password`

---

## 3. Règles de Performance

### 3.1 Cache Budget
```php
// Clé de cache : "budget_summary_{periode_id}"
// Durée : illimitée (invalidée manuellement)
// Invalidation : DepenseObserver::created/updated/deleted

Cache::forget("budget_summary_{$periodeId}");
Cache::remember("budget_summary_{$periodeId}", now()->addDay(), fn() => ...);
```

### 3.2 Eager Loading Obligatoire
```php
// Sur toutes les requêtes de résidence :
Residence::with(['immeubles', 'appartements.coproprietaire'])->get();

// Sur les cotisation_details :
CotisationDetail::with(['appartement', 'coproprietaire', 'paiements'])->get();

// Sur les réclamations :
Reclamation::with(['coproprietaire', 'appartement', 'residence'])->get();
```

### 3.3 Pagination Obligatoire
```php
// Tous les endpoints de liste utilisent paginate()
$per_page = min($request->get('per_page', 20), 100); // max 100 par page
return $query->paginate($per_page);
```

### 3.4 Génération PDF en Queue
```php
// JAMAIS de génération PDF dans le cycle HTTP
// Toujours via un job en queue
GenerateReceipt::dispatch($paiement->id)->onQueue('receipts');
```

### 3.5 Données Recharts Agrégées Backend
```php
// Envoyer des données déjà agrégées au frontend
// Format attendu : [{ compte_charge: 'Entretien', prevu: 20000, consomme: 12500 }]
// JAMAIS : envoyer toutes les dépenses brutes et agréger côté React
```

---

## 4. Messages de Validation en Français

### Modèle Standard
```php
// Dans chaque FormRequest
public function messages(): array
{
    return [
        'required'    => 'Le champ :attribute est obligatoire.',
        'string'      => 'Le champ :attribute doit être une chaîne de caractères.',
        'numeric'     => 'Le champ :attribute doit être un nombre.',
        'min'         => 'Le champ :attribute doit être au minimum :min.',
        'max'         => 'Le champ :attribute ne doit pas dépasser :max.',
        'unique'      => 'Cette valeur est déjà utilisée.',
        'exists'      => 'La valeur sélectionnée est invalide.',
        'date'        => 'Le champ :attribute doit être une date valide.',
        'email'       => 'L\'adresse email n\'est pas valide.',
        'mimes'       => 'Le fichier doit être au format : :values.',
        'max_file'    => 'Le fichier ne doit pas dépasser 5 Mo.',
        'in'          => 'La valeur sélectionnée n\'est pas autorisée.',
        'confirmed'   => 'La confirmation ne correspond pas.',
        'integer'     => 'Le champ :attribute doit être un entier.',
        'boolean'     => 'Le champ :attribute doit être vrai ou faux.',
        'between'     => 'Le champ :attribute doit être entre :min et :max.',
        'gte'         => 'Le champ :attribute doit être supérieur ou égal à :value.',
        'lte'         => 'Le champ :attribute doit être inférieur ou égal à :value.',
        'decimal'     => 'Le champ :attribute doit être un nombre décimal valide.',
    ];
}
```

### Messages Spécifiques Métier
```php
// StoreDepenseRequest
'montant.min' => 'Le montant doit être supérieur à 0.',
'date.before_or_equal' => 'La date ne peut pas être dans le futur.',

// StorePaiementRequest
'montant.lte' => 'Le montant saisi dépasse le restant à payer.',

// StoreCotisationExceptionnelleRequest
'montant_total.min' => 'Le montant total de la cotisation doit être positif.',
'mode_repartition.in' => 'Le mode de répartition choisi est invalide.',

// LoginRequest
'username.required' => 'Le nom d\'utilisateur est obligatoire.',
'password.required' => 'Le mot de passe est obligatoire.',
```

---

## 5. Formatage des Données

### Monétaire (PHP)
```php
// Utiliser number_format avec virgule décimale et espace milliers
number_format(1200.50, 2, ',', ' ') . ' DH'
// Résultat : "1 200,50 DH"
```

### Monétaire (TypeScript)
```typescript
// utils/formatCurrency.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DH';
};
// Résultat : "1 200,50 DH"
```

### Date (PHP)
```php
// Carbon
$date->format('d/m/Y')  // "10/05/2026"
```

### Date (TypeScript)
```typescript
// utils/formatDate.ts
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (date: string | Date): string =>
  format(new Date(date), 'dd/MM/yyyy', { locale: fr });

export const formatDateTime = (date: string | Date): string =>
  format(new Date(date), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
```

---

## 6. Standards du Code

### PHP / Laravel
- **PHPDoc obligatoire** sur toutes les méthodes publiques
- **Type hints** sur tous les paramètres et retours
- **Enums PHP 8.1** pour toutes les valeurs fixes (statuts, modes, rôles)
- **Controllers** : max 7 méthodes (CRUD standard), max 20 lignes par méthode
- **Services** : inject par constructeur, jamais de `new Service()` direct
- **Repositories** : retournent des Models Eloquent ou Collections — jamais de arrays raw
- **Pas de `DB::` direct** dans les Controllers ou Services — uniquement dans les Repositories

### TypeScript / React
- **`strict: true`** dans `tsconfig.json` — aucun `any`
- **Interface Props** obligatoire sur chaque composant
- **Hooks** : logique asynchrone dans les hooks personnalisés, pas dans les composants
- **React Query** pour tout server state — pas de `useState` + `useEffect` pour les données API
- **Zod** pour toute validation de formulaire avec React Hook Form
- **Pas de `console.log`** en production — utiliser un logger configuré

---

## 7. Structure des Commits

```
feat(budget): ajouter recalcul automatique via DepenseObserver
fix(cotisation): corriger formule répartition par tantième
refactor(service): extraire CotisationService::generateDetails
test(paiement): ajouter test unitaire PaiementService::enregistrer
docs: mettre à jour API.md avec endpoints réclamations
```

---

## 8. Règles des Couches (Layer Laws — Résumé)

| Couche | ✅ Autorisé | ❌ Interdit |
|--------|-----------|-----------|
| **Controller** | Appeler Services, retourner Resources | Eloquent, logique métier, `DB::` |
| **Service** | Logique métier, appeler Repositories, Events, Jobs | Réponses HTTP, Eloquent direct |
| **Repository** | Requêtes Eloquent, eager loading | Logique métier, calculs |
| **Model** | fillable, casts, relations, scopes | Queries complexes, logique |
| **FormRequest** | Validation, autorisation basique | Logique métier |
| **Resource** | Formater la réponse | Queries, logique |
| **Observer** | Réagir aux événements Eloquent | Side effects directs sans Service |
| **Policy** | Autorisations ownership | Logique métier |

---

## 9. Checklist Pre-Commit

- [ ] Tous les messages d'erreur de formulaire sont en français
- [ ] Tous les labels UI sont en français
- [ ] Tous les montants affichent le format "1 200,00 DH"
- [ ] Toutes les dates affichent le format "DD/MM/YYYY"
- [ ] Aucun `any` TypeScript
- [ ] Aucun `console.log` restant
- [ ] Eager loading vérifié sur toutes les nouvelles requêtes
- [ ] Rate limiting appliqué aux nouvelles routes financières
- [ ] Policy vérifiée pour les nouvelles routes
- [ ] Pagination sur les nouveaux endpoints de liste
