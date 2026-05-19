# API.md — SyndicPro
## Documentation Complète des Endpoints

---

## Enveloppe de Réponse Standard

```json
// Succès
{
  "success": true,
  "data": {},
  "message": "Opération réussie.",
  "meta": { "current_page": 1, "last_page": 5, "per_page": 20, "total": 97 }
}

// Erreur de validation (422)
{
  "success": false,
  "data": null,
  "message": "Les données soumises sont invalides.",
  "errors": {
    "montant": ["Le montant est obligatoire.", "Le montant doit être un nombre positif."]
  }
}

// Erreur métier (400) / Non autorisé (403) / Introuvable (404) / Serveur (500)
{
  "success": false,
  "data": null,
  "message": "Message d'erreur descriptif en français."
}
```

---

## Groupe 1 — Authentification

### `POST /api/auth/login`
- **Middleware** : `throttle:5,1` (5 tentatives/min)
- **FormRequest** : `LoginRequest`
- **Body** :
```json
{ "username": "string", "password": "string" }
```
- **Réponse 200** :
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Ahmed Benali", "role": "syndic", "username": "ahmed.syndic" }
  },
  "message": "Connexion réussie."
}
```
- **Erreurs** : 401 identifiants incorrects | 403 compte désactivé

### `POST /api/auth/logout`
- **Middleware** : `auth:sanctum`
- **Réponse 200** : `{ "success": true, "message": "Déconnexion réussie." }`

### `GET /api/auth/me`
- **Middleware** : `auth:sanctum`
- **Réponse 200** : `UserResource`

---

## Groupe 2 — Syndic : Résidences

### `GET /api/syndic/residences`
- **Middleware** : `auth:sanctum, role:syndic`
- **Réponse** : `ResidenceResource[]` (toutes les résidences du syndic connecté)

### `POST /api/syndic/residences`
- **FormRequest** : `StoreResidenceRequest`
- **Body** : `{ nom, ville, adresse }`
- **Réponse 201** : `ResidenceResource`

### `GET /api/syndic/residences/{id}`
- **Policy** : `ResidencePolicy@view`
- **Réponse** : `ResidenceResource` (avec immeubles, période active)

### `PUT /api/syndic/residences/{id}`
- **FormRequest** : `UpdateResidenceRequest`
- **Policy** : `ResidencePolicy@update`
- **Réponse 200** : `ResidenceResource`

### `DELETE /api/syndic/residences/{id}`
- **Policy** : `ResidencePolicy@delete`
- **Réponse 200** : message de confirmation

---

## Groupe 3 — Syndic : Immeubles

### `GET /api/syndic/residences/{residenceId}/immeubles`
- **Réponse** : `ImmeubleResource[]` avec appartements count

### `POST /api/syndic/residences/{residenceId}/immeubles`
- **Body** : `{ nom }`
- **Réponse 201** : `ImmeubleResource`

### `PUT /api/syndic/immeubles/{id}`
- **Body** : `{ nom }`
- **Réponse 200** : `ImmeubleResource`

### `DELETE /api/syndic/immeubles/{id}`
- **Réponse 200** : message | **Erreur 409** si appartements associés

---

## Groupe 4 — Syndic : Appartements

### `GET /api/syndic/residences/{residenceId}/appartements`
- **Réponse** : `AppartementResource[]` (eager: immeuble, coproprietaire)

### `POST /api/syndic/residences/{residenceId}/appartements`
- **Body** : `{ numero, etage, immeuble_id, tantieme, coproprietaire_id? }`
- **Réponse 201** : `AppartementResource`

### `PUT /api/syndic/appartements/{id}`
- **Body** : `{ numero?, etage?, tantieme? }`
- **Réponse 200** : `AppartementResource`

### `PUT /api/syndic/appartements/{id}/assigner`
- **Description** : Assigne ou réassigne un copropriétaire
- **Body** : `{ coproprietaire_id }`
- **Réponse 200** : `AppartementResource`

### `DELETE /api/syndic/appartements/{id}`
- **Action** : Soft delete
- **Réponse 200** : message

---

## Groupe 5 — Syndic : Copropriétaires

### `GET /api/syndic/coproprietaires`
- **Query params** : `?residence_id=`, `?search=`
- **Réponse** : `UserResource[]` (paginated)

### `POST /api/syndic/coproprietaires`
- **FormRequest** : `StoreCoproprietaireRequest`
- **Body** : `{ name, email, phone, username, password, password_confirmation }`
- **Réponse 201** : `UserResource`

### `GET /api/syndic/coproprietaires/{id}`
- **Réponse** : `UserResource` + appartements + cotisations summary + derniers paiements + dernières réclamations

### `PUT /api/syndic/coproprietaires/{id}`
- **FormRequest** : `UpdateCoproprietaireRequest`
- **Réponse 200** : `UserResource`

### `POST /api/syndic/coproprietaires/{id}/reset-password`
- **Body** : `{ password, password_confirmation }`
- **Réponse 200** : message de confirmation

### `PUT /api/syndic/coproprietaires/{id}/toggle-actif`
- **Action** : Active ou désactive (soft delete)
- **Réponse 200** : `UserResource`

---

## Groupe 6 — Syndic : Comptes Charges

### `GET /api/syndic/residences/{residenceId}/comptes-charges`
- **Réponse** : `CompteChargeResource[]` (avec sous_charges count)

### `POST /api/syndic/residences/{residenceId}/comptes-charges`
- **Body** : `{ nom, description? }`
- **Réponse 201** : `CompteChargeResource`

### `PUT /api/syndic/comptes-charges/{id}`
- **Body** : `{ nom?, description?, is_active? }`
- **Réponse 200** : `CompteChargeResource`

### `DELETE /api/syndic/comptes-charges/{id}`
- **Réponse 200** | **Erreur 409** si sous_charges ou budgets associés

---

## Groupe 7 — Syndic : Sous-Charges

### `GET /api/syndic/comptes-charges/{compteChargeId}/sous-charges`
- **Réponse** : `SousChargeResource[]`

### `POST /api/syndic/comptes-charges/{compteChargeId}/sous-charges`
- **Body** : `{ nom, description? }`
- **Réponse 201** : `SousChargeResource`

### `PUT /api/syndic/sous-charges/{id}`
- **Réponse 200** : `SousChargeResource`

### `DELETE /api/syndic/sous-charges/{id}`
- **Réponse 200** | **Erreur 409** si dépenses associées

---

## Groupe 8 — Syndic : Dépenses

### `GET /api/syndic/residences/{residenceId}/depenses`
- **Query params** : `?sous_charge_id=`, `?date_debut=`, `?date_fin=`, `?per_page=20`, `?page=`
- **Réponse** : `DepenseResource[]` (paginated, eager: sous_charge.compte_charge)

### `POST /api/syndic/residences/{residenceId}/depenses`
- **FormRequest** : `StoreDepenseRequest`
- **Body** (multipart/form-data) : `{ sous_charge_id, date, montant, description, justificatif? }`
- **Réponse 201** : `DepenseResource`
- **⚡ Déclenche** : `DepenseObserver::created()` → recalcule budget

### `PUT /api/syndic/depenses/{id}`
- **Body** : `{ date?, montant?, description? }`
- **Réponse 200** : `DepenseResource`
- **⚡ Déclenche** : `DepenseObserver::updated()`

### `DELETE /api/syndic/depenses/{id}`
- **Réponse 200** : message
- **⚡ Déclenche** : `DepenseObserver::deleted()`

### `GET /api/syndic/depenses/{id}/justificatif`
- **Réponse** : Signed URL temporaire (60 min) vers le fichier

---

## Groupe 9 — Syndic : Hors Budget

### `GET /api/syndic/residences/{residenceId}/hors-budgets`
- **Query params** : `?date_debut=`, `?date_fin=`, `?per_page=20`
- **Réponse** : `HorsBudgetResource[]` (paginated)

### `POST /api/syndic/residences/{residenceId}/hors-budgets`
- **Body** (multipart) : `{ date, montant, description, justificatif? }`
- **Réponse 201** : `HorsBudgetResource`

### `PUT /api/syndic/hors-budgets/{id}` | `DELETE /api/syndic/hors-budgets/{id}`

---

## Groupe 10 — Syndic : Budget Prévisionnel

### `GET /api/syndic/residences/{residenceId}/periodes`
- **Réponse** : `PeriodeResource[]`

### `POST /api/syndic/residences/{residenceId}/periodes`
- **Body** : `{ annee, date_debut, date_fin }`
- **Réponse 201** : `PeriodeResource`

### `PUT /api/syndic/periodes/{id}`
- **Body** : `{ is_active? }` (pour activer/désactiver)
- **Réponse 200** : `PeriodeResource`

### `GET /api/syndic/periodes/{periodeId}/budgets`
- **Description** : Résumé complet du budget (depuis le cache)
- **Réponse** :
```json
{
  "success": true,
  "data": {
    "prevu_total": 80000.00,
    "consomme_total": 45000.00,
    "restant_total": 35000.00,
    "hors_budget_total": 3200.00,
    "par_compte": [
      {
        "id": 1,
        "compte_charge": { "id": 1, "nom": "Entretien & Réparation" },
        "montant_prevu": 20000.00,
        "montant_consomme": 12500.00,
        "montant_restant": 7500.00,
        "pourcentage_consomme": 62.5,
        "est_depasse": false,
        "sous_charges_detail": [
          { "sous_charge": { "nom": "Entretien électricité" }, "consomme": 4500.00 }
        ]
      }
    ]
  }
}
```

### `POST /api/syndic/periodes/{periodeId}/budgets`
- **Body** : `{ compte_charge_id, montant_prevu }`
- **Réponse 201** : `BudgetPrevisionnelResource`

### `PUT /api/syndic/budgets/{id}`
- **Body** : `{ montant_prevu }`
- **Réponse 200** : `BudgetPrevisionnelResource`

---

## Groupe 11 — Syndic : Cotisations

### `GET /api/syndic/residences/{residenceId}/cotisations`
- **Query params** : `?type=fixe|exceptionnelle`, `?periode_id=`
- **Réponse** : `CotisationResource[]`

### `POST /api/syndic/residences/{residenceId}/cotisations/fixe`
- **FormRequest** : `StoreCotisationFixeRequest`
- **Body** : `{ label, montant_mensuel, periode_id, description? }`
- **Réponse 201** : `CotisationResource`

### `POST /api/syndic/residences/{residenceId}/cotisations/exceptionnelle`
- **FormRequest** : `StoreCotisationExceptionnelleRequest`
- **Body** :
```json
{
  "label": "Réfection ascenseur",
  "montant_total": 12000.00,
  "mode_repartition": "par_tantieme",
  "periode_id": 3,
  "description": "...",
  "montants_map": {}
}
```
- **Réponse 201** : `CotisationResource` avec `details[]`

### `GET /api/syndic/cotisations/{id}/details`
- **Réponse** : `CotisationDetailResource[]` (eager: appartement, coproprietaire, paiements)

### `GET /api/syndic/residences/{residenceId}/cotisations/previsualiser`
- **Query params** : `?mode_repartition=&montant_total=&periode_id=`
- **Description** : Calcule sans persister — pour le wizard de prévisualisation
- **Réponse** : `[{ appartement_id, numero, coproprietaire_nom, montant_calcule }]`

### `GET /api/syndic/residences/{residenceId}/impayes`
- **Query params** : `?periode_id=`, `?statut=non_paye|partiellement_paye`, `?per_page=20`
- **Réponse** : `CotisationDetailResource[]` (paginated)

---

## Groupe 12 — Syndic : Paiements

### `GET /api/syndic/residences/{residenceId}/paiements`
- **Query params** : `?coproprietaire_id=`, `?date_debut=`, `?date_fin=`, `?per_page=20`
- **Réponse** : `PaiementResource[]` (paginated)

### `POST /api/syndic/paiements`
- **FormRequest** : `StorePaiementRequest`
- **Body** :
```json
{
  "cotisation_detail_id": 45,
  "date_paiement": "2026-05-10",
  "montant": 500.00,
  "mode_paiement": "especes",
  "reference": null
}
```
- **Validation** : `montant <= (detail.montant - detail.montant_paye)`
- **Réponse 201** : `PaiementResource`
- **⚡ Déclenche** : `PaiementObserver` + `GenerateReceipt` job + `SendPaymentConfirmation` job
- **Erreur 422** : montant dépassé | **Erreur 400** : cotisation déjà payée intégralement

### `GET /api/syndic/paiements/{id}/recu`
- **Réponse** : Signed URL vers PDF reçu | **404** si non encore généré

### `GET /api/syndic/residences/{residenceId}/paiements/total-percu`
- **Query params** : `?periode_id=`
- **Réponse** : `{ total_percu: 45000.00, nb_paiements: 87 }`

---

## Groupe 13 — Syndic : Réclamations

### `GET /api/syndic/residences/{residenceId}/reclamations`
- **Query params** : `?statut=`, `?priorite=`, `?date_debut=`, `?date_fin=`, `?per_page=20`
- **Réponse** : `ReclamationResource[]` (paginated)

### `GET /api/syndic/reclamations/{id}`
- **Policy** : syndic possède la résidence
- **Réponse** : `ReclamationResource` (avec coproprietaire, appartement)

### `PUT /api/syndic/reclamations/{id}/statut`
- **FormRequest** : `UpdateReclamationStatutRequest`
- **Body** : `{ statut: 'en_cours'|'traite'|'rejete', reponse_syndic?: string }`
- **Réponse 200** : `ReclamationResource`
- **⚡ Déclenche** : `ReclamationUpdated` event → notification copropriétaire

---

## Groupe 14 — Syndic : Rapports

### `GET /api/syndic/residences/{residenceId}/rapports/budget`
- **Query params** : `?periode_id=`
- **Réponse** : résumé budget complet formaté pour export

### `GET /api/syndic/residences/{residenceId}/rapports/impayes`
- **Query params** : `?periode_id=`, `?per_page=50`
- **Réponse** : liste complète des impayés avec ancienneté (nb jours)

### `GET /api/syndic/residences/{residenceId}/rapports/paiements`
- **Query params** : `?periode_id=`, `?date_debut=`, `?date_fin=`
- **Réponse** : liste paiements + total_percu + nb_paiements

---

## Groupe 15 — Copropriétaire : Dashboard

### `GET /api/coproprietaire/dashboard`
- **Middleware** : `auth:sanctum, role:coproprietaire`
- **Réponse** :
```json
{
  "montant_du_ce_mois": 200.00,
  "total_impayes": 600.00,
  "nb_impayes": 3,
  "dernier_paiement": { "date": "2026-04-05", "montant": 200.00 },
  "reclamations_en_cours": 1,
  "appartements": [ AppartementResource ],
  "activite_recente": [ PaiementResource | ReclamationResource ]
}
```

---

## Groupe 16 — Copropriétaire : Appartements

### `GET /api/coproprietaire/appartements`
- **Réponse** : `AppartementResource[]` (uniquement les appartements du copropriétaire connecté)

---

## Groupe 17 — Copropriétaire : Cotisations

### `GET /api/coproprietaire/cotisations`
- **Query params** : `?type=fixe|exceptionnelle`, `?statut=`
- **Réponse** : `CotisationDetailResource[]` (uniquement les siennes)

### `GET /api/coproprietaire/cotisations/{detailId}`
- **Policy** : `CotisationPolicy@viewMine` — vérifie `coproprietaire_id`
- **Réponse** : `CotisationDetailResource` avec historique paiements

---

## Groupe 18 — Copropriétaire : Paiements

### `GET /api/coproprietaire/paiements`
- **Query params** : `?date_debut=`, `?date_fin=`, `?per_page=20`
- **Réponse** : `PaiementResource[]` (uniquement les siens, paginated)

### `GET /api/coproprietaire/paiements/{id}/recu`
- **Policy** : vérifie `coproprietaire_id === paiement.coproprietaire_id`
- **Réponse** : Signed URL vers PDF reçu

---

## Groupe 19 — Copropriétaire : Réclamations

### `GET /api/coproprietaire/reclamations`
- **Réponse** : `ReclamationResource[]` (uniquement les siennes)

### `POST /api/coproprietaire/reclamations`
- **FormRequest** : `StoreCoproprietaireReclamationRequest`
- **Body** : `{ appartement_id, titre, description, priorite: 'normale'|'urgente' }`
- **Réponse 201** : `ReclamationResource`
- **⚡ Déclenche** : notification email au syndic

### `GET /api/coproprietaire/reclamations/{id}`
- **Policy** : `ReclamationPolicy@view` — vérifie `coproprietaire_id`
- **Réponse** : `ReclamationResource` avec `reponse_syndic`

---

## Codes d'Erreur HTTP Utilisés

| Code | Cas d'usage |
|------|-------------|
| 200 | Succès GET / PUT / DELETE |
| 201 | Ressource créée |
| 400 | Erreur métier (paiement excédentaire, etc.) |
| 401 | Non authentifié |
| 403 | Non autorisé (Policy échoue) |
| 404 | Ressource introuvable |
| 409 | Conflit (suppression d'une entité référencée) |
| 422 | Erreur de validation FormRequest |
| 429 | Trop de requêtes (rate limit) |
| 500 | Erreur serveur inattendue |
