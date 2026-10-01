# SyndicPro - Project Status Report

**Date:** 2026-09-11
**Tested by:** Chrome MCP automated + manual testing
**Environment:** Local (Vite dev server + Laravel artisan serve)

---

## Executive Summary

Tested all 15+ pages across both roles (Syndic + Coproprietaire). Found **2 critical 500 errors**, **1 data integrity bug**, and **multiple performance issues** causing slow data loading.

**Backend Tests:** 38/38 passing (69 assertions, 0 failures)
**Critical Bugs:** 3 (page-breaking)
**Performance Issues:** 5+ (causing slow loading)
**UI Bugs:** 4

---

## CRITICAL BUGS (Page-Breaking)

### 1. Coproprietaire "Mes Réclamations" - HTTP 500

- **Error:** `Call to undefined method ReclamationRepository::findByCoproprietaires()`
- **File:** `syndicpro-api/app/Services/ReclamationService.php:67`
- **Root Cause:** Service calls `findByCoproprietaires()` on the repository, but the method does not exist
- **Impact:** Coproprietaire cannot view their réclamations at all
- **Fix:** Add `findByCoproprietaires(int $coproprietaireId)` method to `ReclamationRepository`

### 2. Rapports "Paiements" Tab - HTTP 500

- **Error:** `SQLSTATE[42000]: 'syndicpro.paiements.id' isn't in GROUP BY`
- **File:** `syndicpro-api/app/Http/Controllers/Syndic/RapportController.php:160-162`
- **Root Cause:** Query selects `paiements.*` but groups by `paiements.mode_paiement` only, violating MySQL's `ONLY_FULL_GROUP_BY` mode
- **Impact:** Rapports Paiements tab is completely broken (3 failed requests per page load)
- **Fix:** Change to `selectRaw('paiements.mode_paiement, SUM(paiements.montant) as total')` — already correct, but `pluck()` forces `SELECT *`. Use `->get()->pluck(...)` instead, or use a subquery approach.

### 3. Coproprietaire Reclamation Detail - Wrong Relationship Name

- **Error:** Would throw error when loading reclamation detail
- **File:** `syndicpro-api/app/Http/Controllers/Coproprietaires/ReclamationController.php:63`
- **Root Cause:** Uses `$reclamation->load(['coproprietaires', ...])` (plural) instead of `'coproprietaire'` (singular)
- **Impact:** Viewing individual reclamation detail would fail
- **Fix:** Change `'coproprietaires'` to `'coproprietaire'`

---

## DATA INTEGRITY BUG

### 4. Residences `nb_immeubles` / `nb_appartements` Always 0

- **Symptom:** All residence cards show "0 immeubles, 0 appartements"
- **Root Cause:** The API resource returns `nb_immeubles: 0, nb_appartements: 0` for ALL residences, even though the actual data IS present in the nested `immeubles.appartements` arrays
- **Impact:** Users think their residences have no buildings/apartments when they actually do
- **Fix:** Either use `withCount('immeubles')` in the query and ensure the resource reads the counts, or compute counts from the eager-loaded `immeubles` array in the resource

---

## PERFORMANCE ISSUES (Root Cause of Slow Loading)

### 5. Excessive API Calls Per Page Load

| Page | API Calls | Notes |
|------|-----------|-------|
| Rapports | **10** | Duplicates with/without periode_id |
| Paiements | **7** | Includes invalid `residence_id=0` query |
| Cotisations | **7** | Duplicates with/without periode_id |
| Charges & Dépenses | **5** | Pre-loads all 4 tabs eagerly |
| Budget | **5** | |
| Dashboard | **2** | Reasonable |

### 6. Redundant Requests

- **Every page** re-fetches `/api/syndic/residences` — React Query should deduplicate this, but the queries fire with different keys
- **Cotisations** fetches cotisations **twice** (without and with `periode_id`) — second overwrites first
- **Rapports** fetches **same endpoints twice** (initial load + period-filtered load)
- **Paiements** fires `coproprietaires?residence_id=0` — invalid query that wastes a roundtrip

### 7. Backend-Heavy Queries

- **DashboardController:** ~7-10 DB queries per load
- **RapportController:** Clones base query 3-4 times (pagination + aggregates), running 5+ queries
- **BudgetSummary:** Loads all budgets + runs grouped depense query + hors budget sum (3+ queries)
- **Missing caching** on dashboard, cotisation totals, and impayes (only budget summary is cached)

---

## UI/UX BUGS

### 8. Double "+" Button on Cotisations Empty State

- **Symptom:** Shows `+ + Nouvelle cotisation fixe` 
- **Fix:** Remove one of the "+" characters in the EmptyState component

### 9. Immeubles Table Missing Residence Name

- **Symptom:** Résidence column shows "—" instead of the residence name
- **Fix:** Ensure the immeubles API includes/resolves residence name, or the frontend looks it up from the residences list

### 10. Reclamations Pagination Broken

- **Symptom:** Pagination buttons render page numbers but have **no onClick handlers** wired up
- **Fix:** Connect pagination state and handlers to the pagination buttons

### 11. Coproprietaire Sidebar Uses Emojis

- **Symptom:** Uses raw emojis (📊, 💳, 📢) instead of lucide-react icons like the syndic sidebar
- **Fix:** Replace emojis with `lucide-react` icons for consistency

---

## BACKEND SECURITY / COMPLETENESS GAPS

### 12. Missing Scheduled Command

- `AppServiceProvider@schedule` registers `cotisations:generate-monthly` but the Artisan command class doesn't exist
- **Impact:** Monthly cotisation auto-generation will fail silently

### 13. Ownership Middleware Never Applied

- `EnsureResidenceOwnership` middleware is defined (`residence.owned` alias) but never used on any route in `api.php`
- **Impact:** Some controllers do manual ownership checks, others don't — inconsistent security

### 14. Missing Signed URL on Syndic Receipt Download

- Syndic `download-recu` route has no `signed` middleware
- **Impact:** Anyone with a payment ID could download receipts without URL signing

### 15. Receipt Queue Jobs Stuck

- Payment receipts show "En cours" permanently
- `.env` has `QUEUE_CONNECTION=database` but Supervisor config references `redis` queue worker
- **Impact:** PDF receipt generation never completes

---

## WHAT'S WORKING WELL

- Login/Logout flow with Sanctum SPA auth
- Syndic Dashboard (with real data on seeded residences)
- Résidences CRUD (card grid with edit/delete)
- Immeubles page (table with edit/delete)
- Appartements page (empty state + filters)
- Copropriétaires page (search, filter, pagination, drawer)
- Budget Prévisionnel page (period tabs, summary cards, inline editing)
- Charges & Dépenses page (4 tabs functional)
- Cotisations (syndic side) — data loads, wizard present
- Paiements (syndic side) — data loads, filters work
- Réclamations (syndic side) — data loads, filters work
- Coproprietaire Dashboard (KPIs, apartment cards, quick nav)
- Coproprietaire Mes Cotisations (fixe/exceptionnelle tabs)
- Coproprietaire Mes Paiements (payment history)
- All 38 backend tests passing
- Skeleton loading states implemented across all pages
- Error states with retry buttons
- React Query caching with 5-minute stale time
- Code splitting with React.lazy for all pages
- Custom motion library respecting prefers-reduced-motion

---

## FIX PLAN

### Phase 1 — P0 Critical Fixes (Must fix first)

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 1 | Add `findByCoproprietaires()` to ReclamationRepository | `ReclamationRepository.php` | Small |
| 2 | Fix GROUP BY SQL in RapportController@paiements | `RapportController.php:159-162` | Small |
| 3 | Fix `coproprietaires` → `coproprietaire` plural typo | `ReclamationController.php:63` | Tiny |

### Phase 2 — P1 Important Fixes

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 4 | Fix `nb_immeubles`/`nb_appartements` count in API | `ResidenceResource.php` or query | Small |
| 5 | Fix QUEUE_CONNECTION mismatch | `syndicpro-api/.env` | Tiny |
| 6 | Fix double "+" button | Frontend cotisations empty state | Tiny |
| 7 | Fix immeubles table residence name | Frontend or backend resource | Small |

### Phase 3 — P2 Performance & UX Fixes

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 8 | Eliminate redundant API calls | Frontend hooks | Medium |
| 9 | Add `per_page` default to unpaginated endpoints | Backend controllers | Small |
| 10 | Cache dashboard + cotisation totals | Backend controllers/services | Medium |
| 11 | Wire up reclamations pagination | Frontend ReclamationsPage | Small |

### Phase 4 — P3 Security & Completeness

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 12 | Create `cotisations:generate-monthly` command | New artisan command | Medium |
| 13 | Apply `EnsureResidenceOwnership` middleware | `routes/api.php` | Small |
| 14 | Add `signed` middleware to receipt download | `routes/api.php` | Tiny |
| 15 | Standardize coproprietaire sidebar icons | Frontend sidebar | Small |
