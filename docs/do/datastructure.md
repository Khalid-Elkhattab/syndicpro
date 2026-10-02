# Data Structure — SyndicPro

**Spec:** `docs/Functional_Specification_Property_Management_EN.md` (v1.0, 01/10/2026)
**Client:** KHALLOUFI NEGOCE — Ref. CDC-MA7314
**Date:** 2026-10-01
**Scope:** database migrations only (`syndicpro-api/database/migrations/`), compared against the functional spec.
**Stack:** Laravel 13 (PHP 8.3) · MySQL · 14 domain tables + 7 framework tables.

---

# PART 1 — Existing Schema (actual migrations)

Conventions: PK = primary key · FK = foreign key · UQ = unique · IDX = index · SD = soft deletes.

## Framework tables (no business logic)

| Table | Migration | Purpose |
|---|---|---|
| `cache` / `cache_locks` | `0001_01_01_000001` | Laravel cache store |
| `jobs` / `job_batches` / `failed_jobs` | `0001_01_01_000002` | Queue (receipt PDF generation, etc.) |
| `personal_access_tokens` | `2026_05_12_170938` | Sanctum tokens |
| `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions` | `2026_05_12_172917` | Spatie permission (migrated but unused — app checks `users.role` enum via `CheckRole` middleware instead) |
| `sessions` | `2026_05_15_183005` | Session driver |
| `media` | `2026_05_15_213803` | Spatie Media Library (expense justificatifs) |

Performance indexes added separately in `2026_05_19_000001_add_performance_indexes.php`.

---

## `users` — co-owners + syndic accounts

Migration: `2026_01_01_000001_create_users_table.php` · SD ✅

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | auto-increment |
| `name` | string(100) | Nom complet |
| `email` | string(150) | UQ — "optionnel pour copropriétaire" (but column is NOT nullable) |
| `phone` | string(20) | nullable — single phone number |
| `role` | enum(`syndic`, `coproprietaire`) | Rôle utilisateur |
| `username` | string(50) | UQ — login identifier |
| `password` | string (hashed) | — |
| `is_active` | boolean default true | 1=actif, 0=désactivé |
| `remember_token` | string nullable | — |
| `deleted_at` | timestamp nullable | soft delete |
| `created_at` / `updated_at` | timestamps | — |

IDX: `role`, `is_active`.

Relations (User model): `residences` (hasMany via `syndic_id`) · `appartements` · `cotisationDetails` · `paiements` · `reclamations`.

---

## `residences` — managed properties

Migration: `2026_01_01_000002_create_residences_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `syndic_id` | FK → `users.id` | `restrict` on delete |
| `nom` | string(150) | Nom de la résidence |
| `ville` | string(100) | Ville |
| `adresse` | text | Adresse complète |
| `nb_immeubles` | unsigned int default 0 | "calculé" — **dead counter, always 0 in practice** |
| `created_at` / `updated_at` | timestamps | — |

IDX: `syndic_id`.

---

## `immeubles` — buildings

Migration: `2026_01_01_000003_create_immeubles_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `residence_id` | FK → `residences.id` | `cascade` on delete |
| `nom` | string(100) | Nom ou lettre (ex: Bâtiment A) |
| `created_at` / `updated_at` | timestamps | — |

IDX: `residence_id`.

---

## `appartements` — units (lots)

Migration: `2026_01_01_000004_create_appartements_table.php` · SD ✅

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `numero` | string(20) | Numéro d'appartement |
| `etage` | tinyint default 0 | Étage (0=RDC) — bonus field, not in spec |
| `immeuble_id` | FK → `immeubles.id` | `restrict` |
| `residence_id` | FK → `residences.id` (denormalized) | `restrict` |
| `coproprietaire_id` | FK → `users.id`, nullable | `restrict` — **single owner per unit** |
| `tantieme` | decimal(10,4) default 0 | Quote-part en tantièmes |
| `deleted_at` | timestamp nullable | soft delete |
| `created_at` / `updated_at` | timestamps | — |

UQ: (`numero`, `immeuble_id`). IDX: `residence_id`, `coproprietaire_id`.

---

## `compte_charges` — charge accounts (chart of accounts)

Migration: `2026_01_01_000005_create_compte_charges_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `residence_id` | FK → `residences.id` | `restrict` |
| `nom` | string(150) | Ex: Entretien & Réparation |
| `description` | text nullable | — |
| `is_active` | boolean default true | — |
| `created_at` / `updated_at` | timestamps | — |

IDX: `residence_id`, `is_active`.

---

## `sous_charges` — charge sub-accounts

Migration: `2026_01_01_000006_create_sous_charges_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `compte_charge_id` | FK → `compte_charges.id` | `restrict` |
| `residence_id` | FK → `residences.id` (denormalized) | `restrict` |
| `nom` | string(150) | Ex: Entretien électricité |
| `description` | text nullable | — |
| `created_at` / `updated_at` | timestamps | — |

IDX: `compte_charge_id`, `residence_id`.

---

## `depenses` — expenses

Migration: `2026_01_01_000007_create_depenses_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `sous_charge_id` | FK → `sous_charges.id` | `restrict` |
| `residence_id` | FK → `residences.id` (denormalized) | `restrict` |
| `date` | date | Date de la dépense |
| `montant` | decimal(12,2) | Montant en DH |
| `description` | text | Description de la dépense |
| `justificatif_path` | string(500) nullable | Chemin Spatie Media Library |
| `created_at` / `updated_at` | timestamps | — |

IDX: `sous_charge_id`, `residence_id`, `date`.

---

## `hors_budgets` — off-budget (urgent) expenses

Migration: `2026_01_01_000008_create_hors_budgets_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `residence_id` | FK → `residences.id` | `restrict` |
| `date` | date | — |
| `montant` | decimal(12,2) | — |
| `description` | text | Nature de l'incident ou urgence |
| `justificatif_path` | string(500) nullable | — |
| `created_at` / `updated_at` | timestamps | — |

IDX: `residence_id`, `date`.

---

## `periodes` — fiscal periods

Migration: `2026_01_01_000009_create_periodes_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `residence_id` | FK → `residences.id` | `restrict` |
| `annee` | year | Exercice annuel (ex: 2026) |
| `is_active` | boolean default true | 1=période courante |
| `date_debut` | date | Début de période |
| `date_fin` | date | Fin de période |
| `created_at` / `updated_at` | timestamps | — |

UQ: (`residence_id`, `annee`). IDX: `residence_id`, `annee`, `is_active`.

---

## `budget_previsionnels` — forecast budget lines

Migration: `2026_01_01_000010_create_budget_previsionnels_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `periode_id` | FK → `periodes.id` | `restrict` |
| `compte_charge_id` | FK → `compte_charges.id` | `restrict` |
| `montant_prevu` | decimal(12,2) | Budget alloué en DH |
| `montant_consomme` | decimal(12,2) default 0 | Total réel — updated by DepenseObserver |
| `created_at` / `updated_at` | timestamps | — |

UQ: (`periode_id`, `compte_charge_id`). IDX: `periode_id`, `compte_charge_id`.

---

## `cotisations` — contributions (fund calls)

Migration: `2026_01_01_000011_create_cotisations_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `residence_id` | FK → `residences.id` | `restrict` |
| `periode_id` | FK → `periodes.id` | `restrict` |
| `type` | enum(`fixe`, `exceptionnelle`) | Type de cotisation |
| `label` | string(200) | Ex: Charges mensuelles |
| `montant_total` | decimal(12,2) | Montant total |
| `montant_mensuel` | decimal(12,2) nullable | Par appartement — fixe uniquement |
| `mode_repartition` | enum(`egale`, `par_appartement`, `par_tantieme`) nullable | Exceptionnelle uniquement |
| `mois` | tinyint nullable | 1–12 — fixe uniquement |
| `annee` | year nullable | Fixe uniquement |
| `description` | text nullable | — |
| `created_at` / `updated_at` | timestamps | — |

IDX: `residence_id`, `periode_id`, `type`, (`mois`, `annee`).

---

## `cotisation_details` — per-unit contribution lines

Migration: `2026_01_01_000012_create_cotisation_details_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `cotisation_id` | FK → `cotisations.id` | `restrict` |
| `appartement_id` | FK → `appartements.id` | `restrict` |
| `coproprietaire_id` | FK → `users.id` (denormalized snapshot) | `restrict` |
| `montant` | decimal(12,2) | Montant dû par cet appartement |
| `statut` | enum(`non_paye`, `partiellement_paye`, `paye`) default `non_paye` | Auto by PaiementObserver — never set manually |
| `montant_paye` | decimal(12,2) default 0 | Sum of payments — updated by PaiementObserver |
| `created_at` / `updated_at` | timestamps | — |

UQ: (`cotisation_id`, `appartement_id`). IDX: `cotisation_id`, `appartement_id`, `coproprietaire_id`, `statut`.

---

## `paiements` — payments received

Migration: `2026_01_01_000013_create_paiements_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `cotisation_detail_id` | FK → `cotisation_details.id` | `restrict` — **1 payment → 1 detail line** |
| `coproprietaire_id` | FK → `users.id` | `restrict` |
| `date_paiement` | date | Date d'encaissement |
| `montant` | decimal(12,2) | Montant encaissé |
| `mode_paiement` | enum(`especes`, `virement`, `cheque`, `carte`) default `especes` | — |
| `reference` | string(100) nullable | N° chèque, réf. virement, etc. |
| `recu_path` | string(500) nullable | Chemin PDF reçu (généré en async) |
| `created_at` / `updated_at` | timestamps | — |

IDX: `cotisation_detail_id`, `coproprietaire_id`, `date_paiement`.

---

## `reclamations` — complaints

Migration: `2026_01_01_000014_create_reclamations_table.php` · SD ❌

| Column | Type | Constraints / comment |
|---|---|---|
| `id` | bigint PK | — |
| `coproprietaire_id` | FK → `users.id` | `restrict` |
| `residence_id` | FK → `residences.id` | `restrict` |
| `appartement_id` | FK → `appartements.id` | `restrict` |
| `titre` | string(200) | Titre court |
| `description` | text | Description détaillée |
| `statut` | enum(`nouveau`, `en_cours`, `traite`, `rejete`) default `nouveau` | `rejete` is a bonus value beyond spec's 3 statuses |
| `priorite` | enum(`normale`, `urgente`) default `normale` | — |
| `reponse_syndic` | text nullable | Réponse du syndic |
| `date_reponse` | timestamp nullable | Date dernière réponse |
| `created_at` / `updated_at` | timestamps (auto datetime) | — |

IDX: `coproprietaire_id`, `residence_id`, `statut`, `priorite`.

---

## Entity-relationship overview (ASCII)

```
users (syndic) 1───* residences 1───* immeubles 1───* appartements
users (copro)  1───* appartements (single owner) · cotisation_details · paiements · reclamations

residences 1───* compte_charges 1───* sous_charges 1───* depenses
residences 1───* hors_budgets · periodes 1───* budget_previsionnels
                                  periodes 1───* cotisations 1───* cotisation_details 1───* paiements

residences 1───* reclamations (via coproprietaire + appartement)
```

---

# PART 2 — Migration vs Spec Comparison

Legend: ✅ present · ⚠️ partial/deviating · ❌ missing.

## Module 1 — Residences and Units (spec §3, Module 1)

| Spec data | Migration column/table | Verdict |
|---|---|---|
| Residence name | `residences.nom` | ✅ |
| Syndicate name | — | ❌ no column |
| City, address | `residences.ville`, `residences.adresse` | ✅ |
| Building no. | `immeubles.nom` (name only) | ⚠️ no number/code field |
| Unit type (apartment, duplex, shop, office, house, other) | — | ❌ no column |
| Unit no. | `appartements.numero` (UQ per building) | ✅ |
| Surface area (m²) | — | ❌ no column |
| Share (tantième / quote-part) | `appartements.tantieme` decimal(10,4) | ✅ |
| Land title no. | — | ❌ no column |
| Parking space (yes/no/common + space no.) | — | ❌ no table |
| Storage box (yes/no + box no.) | — | ❌ no table |
| Total-shares check per residence | — | ❌ no constraint |
| Unit owner/payment history | — | ❌ no history table |

Note: `appartements.etage` exists as a bonus (not in spec). `residences.nb_immeubles` is a dead counter — always 0, never updated by code.

## Module 2 — Co-owners (spec §3, Module 2)

| Spec data | Migration column/table | Verdict |
|---|---|---|
| First and last name (individual or company) | `users.name` | ✅ (no individual/company distinction) |
| CIN (or RC for a company) | — | ❌ **no column → search by CIN impossible** |
| Phone — one or more, WhatsApp flag | `users.phone` single, nullable | ⚠️ single phone, no WhatsApp flag |
| Email — one or more | `users.email` single, unique | ⚠️ single email |
| Units (several, one or more residences) | via `appartements.coproprietaire_id` | ✅ one owner → many units |
| Joint ownership (several co-owners, same unit) | — | ❌ no pivot table |
| Change of owner (sale), history preserved | — | ❌ no history table |
| Portal activation | `users.is_active` + softDeletes | ✅ |
| Internal notes per co-owner | — | ❌ no column/table |

Current search (`CoproprietaireRepository::paginateFiltered`) covers `name`, `email`, `username` only.

## Module 3 — Contributions and Fund Calls (spec §3, Module 3)

| Spec data | Migration column/table | Verdict |
|---|---|---|
| Residence | `cotisations.residence_id` | ✅ |
| Contribution type (syndic / exceptional) | `cotisations.type` enum | ✅ |
| Contribution name | `cotisations.label` | ✅ |
| Period from…to… | `cotisations.periode_id` + `mois`/`annee` | ⚠️ period exists, but cotisations keyed to month/year, not a from–to window |
| Calculation method fixed vs share, per residence | — | ❌ no residence-level method field; `mode_repartition` is per exceptional cotisation only |
| Amount per month / per year | `cotisations.montant_total`, `montant_mensuel` | ✅ |
| Fixed mode: grid by unit category | — | ❌ no table |
| Share mode: coefficient = budget ÷ total shares | derivable (`tantieme` + budget) | ⚠️ computable, not stored |
| Monthly pro-rata by days + rounding | — | ❌ no fields |
| Exceptional: whole residence or certain buildings | — | ❌ no `immeuble_id` link |
| Per-unit detail lines | `cotisation_details` (montant, statut, montant_paye) | ✅ |

## Module 4 — Payments and Receipts (spec §3, Module 4)

| Spec data | Migration column/table | Verdict |
|---|---|---|
| Date | `paiements.date_paiement` | ✅ |
| Residence, building, unit (owner auto-displayed) | via `cotisation_detail_id` → appartement → immeuble/résidence/coproprietaire | ⚠️ reachable by joins, building derived |
| Contribution type | via detail → cotisation | ⚠️ reachable by joins |
| Payment method | `paiements.mode_paiement` enum(`especes`,`virement`,`cheque`,`carte`) | ⚠️ spec lists cheque/transfer/**deposit**/cash → **deposit missing**; `carte` present although online card payment is **out of scope** (spec §8) |
| Document no. mandatory for cheque | `paiements.reference` nullable | ❌ no conditional NOT NULL |
| Bank (list of banks) | — | ❌ no column/table |
| Payment amount | `paiements.montant` | ✅ |
| One payment spread over several contributions/years | single `cotisation_detail_id` FK | ❌ **schema blocks this — 1 payment → 1 detail line**, no allocation table |
| Numbered receipt | — | ❌ no receipt-number column (`recu_path` only) |
| Portal declaration + manager approval | — | ❌ no status/pending columns, no justificatif on paiement |
| Cancellation tracked in history | — | ❌ no history table |

## Module 5 — Budgets and Expenses (spec §3, Module 5)

| Spec data | Migration column/table | Verdict |
|---|---|---|
| Budget type (forecast / off-budget), name (operating / investment) | — | ❌ no columns (off-budget is a separate table, not a type) |
| Account / sub-account | `compte_charges`, `sous_charges` | ✅ |
| Budget line qty × unit price, monthly/annual computed | `budget_previsionnels.montant_prevu` total only | ❌ quantity/unit-price absent |
| Expense date / residence | `depenses.date`, `depenses.residence_id` | ✅ |
| Charge type expense vs intervention (0 allowed) | — | ❌ no column |
| Expense payment method / doc no. / bank | — | ❌ no columns |
| Allocation by building | — | ❌ no `immeuble_id` on depenses |
| Supplier + supporting document | doc ✅ (`justificatif_path` + `media` table) / supplier ❌ | ⚠️ supplier table missing |
| Fiscal period | `periodes` (annee, date_debut, date_fin, is_active) | ✅ |
| Planned vs actual | `montant_prevu` vs `montant_consomme` (+ DepenseObserver) | ✅ |

## Module 6 — Cash Management / Treasury (spec §3, Module 6)

| Spec data | Migration column/table | Verdict |
|---|---|---|
| Period, opening balance, auto totals, closing balance vs bank statement | — | ❌ **no tables at all** |

## Module 7 — Debt Collection (spec §3, Module 7)

| Spec data | Migration column/table | Verdict |
|---|---|---|
| Due/paid/remaining per co-owner per period | derivable from `cotisation_details` (statut, montant, montant_paye) | ⚠️ computable, no dedicated schema |
| Reminders, formal notices, lawyer list, reminder history | — | ❌ **no tables** |

## Module 8 — Complaints (spec §3, Module 8)

| Spec data | Migration column/table | Verdict |
|---|---|---|
| Date/time auto | `reclamations.created_at` | ✅ |
| Complaint type (configurable list) | — | ❌ no column (`titre`/`priorite` only) |
| Residence / building / unit | `residence_id` ✅ / `appartement_id` ✅ / `immeuble_id` ❌ | ⚠️ building via join only |
| Description / photos | `description` ✅ / photos ❌ (no media on reclamations) | ⚠️ |
| Handling date/time at closure | `reclamations.date_reponse` | ✅ |
| Feedback to client | `reclamations.reponse_syndic` | ✅ |
| Message exchange thread | — | ❌ single response fields only |
| Measured handling time | — | ❌ derivable only |

## Module 9 — General Assemblies and Reports (spec §3, Module 9)

| Spec data | Migration column/table | Verdict |
|---|---|---|
| AG notices, attendance, proxies, minutes, resolutions, votes, quitus, financial/moral reports, announcements | — | ❌ **no tables (~8 tables missing)** |

## Module 10 — Co-owner Portal (spec §3, Module 10)

Portal rides on `users` auth + existing tables (dashboard, cotisations, paiements, réclamations readable). Schema gaps: payment declarations, residence documents library, announcements — ❌ no tables.

## Module 11 — AI Connectivity (spec §3, Module 11)

WhatsApp assistant state, MCP/API keys, exchange logs — ❌ **no tables**.

## Module 12 — Showcase Website (spec §3, Module 12)

Pages, contact/quote requests, editable content — ❌ **no tables**.

## Cross-cutting — Technical & Security (spec §5)

| Spec requirement | Migration coverage | Verdict |
|---|---|---|
| Roles: super-admin, manager/assistant | `users.role` enum(`syndic`,`coproprietaire`) only; Spatie tables migrated but unused | ❌ 2 of 4 roles |
| Permissions per module / per residence | — | ❌ no tables in use |
| Audit log (who did what, when) | — | ❌ no table |
| Recycle bin (restore deleted items) | softDeletes on `users` + `appartements` only; 12 other tables hard-delete | ⚠️ 2 of 14 tables |
| FR/AR interface | — | ❌ nothing schema-level |
| Automatic daily backup | — | ❌ infra-level, not in repo |

---

# PART 3 — Consolidated Gap Lists

## A. Missing columns on existing tables

| Table | Missing column(s) |
|---|---|
| `users` | `cin` (+ uniqueness decision), multi-phone/email or contact fields, `whatsapp` flag, `notes`, individual/company flag |
| `residences` | `nom_syndicat` (syndicate name), calculation method (fixed vs share) |
| `immeubles` | building number/code (currently name only) |
| `appartements` | `type` (apt/duplex/shop/office/house/other), `surface_m2`, `titre_foncier` |
| `cotisations` | `immeuble_id` scoping for exceptional; from–to period semantics |
| `paiements` | `banque`, receipt number, declaration/approval status, justificatif |
| `depenses` | `immeuble_id`, `type` (expense/intervention), `mode_paiement`, `piece_no`, `banque`, `fournisseur_id` |
| `reclamations` | `type_id` (configurable list), `immeuble_id` |
| `budget_previsionnels` | `type` (forecast/off-budget, operating/investment), `quantite`, `prix_unitaire` |

## B. Missing tables entirely (~15+)

| Area | Missing table(s) |
|---|---|
| Units | `parkings`, `boites_stockage` (or polymorphic `annexes`) |
| Co-owners | `appartement_coproprietaire` pivot (joint ownership), `proprietaire_historique` (owner changes), co-owner contacts/notes |
| Contributions | `grilles_tarifaires` (fixed grid by unit category) |
| Payments | `paiement_allocations` (multi-contribution split), `paiement_historique` (cancellations), `banques` |
| Expenses | `fournisseurs`, `depense_immeuble` pivot (building allocation) |
| Treasury (M6) | `tresoreries` (period, opening/closing balance, reconciliation) |
| Collection (M7) | `relances`, `mises_en_demeure`, `dossiers_avocat`, `relance_historique` |
| Complaints (M8) | `types_reclamation`, `reclamation_messages` (thread) |
| Assemblies (M9) | `assemblees`, `convocations`, `presences`, `procurations`, `proces_verbaux`, `resolutions`, `votes`, `quitus`, `annonces` |
| Portal (M10) | `documents_residence` (minutes, regulations), portal payment declarations (or status on `paiements`) |
| AI (M11) | `api_keys`, `ai echanges/logs` |
| Showcase (M12) | `pages`, `demandes_contact`, `demandes_devis` |
| Security (§5) | `audit_logs` (+ roles: super-admin, manager) |

## C. Structural blockers (schema-level, can't fix in code alone)

1. **CIN search impossible** — no `cin` column on `users`. Requires new migration + index.
2. **Multi-contribution payment impossible** — `paiements.cotisation_detail_id` is a single FK. Requires `paiement_allocations` table (or equivalent redesign).
3. **Fixed grid by unit category impossible** — no unit `type`/`surface` + no tariff table. Requires both.
4. **Expense building allocation impossible** — no `immeuble_id` on `depenses`. Requires column or pivot.
5. **Joint ownership impossible** — `appartements.coproprietaire_id` is single. Requires pivot table.
6. **Enum deviation:** `mode_paiement` has `carte` (out of scope per spec §8) but lacks `depot/versement` (required by spec). Requires enum migration.
7. **Soft delete on 2/14 tables** — recycle bin per spec §5 requires adding `deleted_at` to the other 12 + restore endpoints/UI.

## D. Tallies

- Spec data fields: **~25 of ~70 present**, ~10 partial, **~35 missing**
- Missing columns on existing tables: **~25**
- Missing tables: **~15+** (AG suite alone is ~8)
- Modules at 0% schema: **6 (Treasury), 7 (Collection tables), 9 (AG), 11 (AI), 12 (Showcase)** + audit log
- Modules at ~40–60% field completeness: **1, 2, 3, 4, 5, 8**
- Soft-delete coverage: **2 of 14** domain tables

---

*Source of truth: `syndicpro-api/database/migrations/2026_01_01_000001` → `000014` + framework migrations. Application-layer features (controllers, pages, PDF/Excel generation) are out of scope for this file — see `projstat.md` for the full spec-vs-project comparison.*
