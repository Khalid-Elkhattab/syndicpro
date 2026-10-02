# Project Status — SyndicPro vs Functional Specification

**Spec:** `docs/Functional_Specification_Property_Management_EN.md` (v1.0, 01/10/2026)
**Client:** KHALLOUFI NEGOCE — Ref. CDC-MA7314
**Date:** 2026-10-01
**Stack:** Laravel 13 (PHP 8.3) + Sanctum · React 19 + Vite + Tailwind 4 · MySQL · Pest tests

**Overall verdict:** The back-office MVP core (portfolio → co-owners → charges → cotisations → paiements → réclamations → reports) is structurally sound, with clean Service/Repository/Policy layering and a passing test suite. However, **roughly half the specified scope is absent** (treasury, debt-collection automation, AG/quitus, AI/WhatsApp, showcase site, FR/AR, admin roles, audit log, PWA, Excel/PDF docs), and several built features are **broken in practice**.

---

## Summary Matrix

| # | Module | Status | ~Complete |
|---|---|---|---|
| 1 | Residences & Units | Partial | 40% |
| 2 | Co-owners | Partial | 30% |
| 3 | Contributions & Fund Calls | Partial | 50% |
| 4 | Payments & Receipts | Partial / Broken | 45% |
| 5 | Budgets & Expenses | Partial | 60% |
| 6 | Cash Management / Treasury | **Missing** | 0% |
| 7 | Debt Collection | Partial | 20% |
| 8 | Complaints | Partial | 50% |
| 9 | General Assemblies & Reports | **Missing** | 0% |
| 10 | Co-owner Portal | Partial | 40% |
| 11 | AI Connectivity (WhatsApp / MCP) | **Missing** | 0% |
| 12 | Showcase Website | **Missing** | 0% |

| Cross-cutting | Status |
|---|---|
| FR / AR i18n | Missing |
| Super-admin / manager roles & permissions | Missing (only syndic + coproprietaire) |
| Audit log | Missing |
| Recycle bin (restore UI) | Missing (soft-delete on users & appartements only) |
| Excel export | Missing (client-side CSV on reports only) |
| PDF generation | **Broken** (receipt only; DomPDF not installed) |
| QR codes on receipts | Missing |
| WhatsApp integration | Missing |
| PWA installability | Missing |
| Responsive design | **Implemented** |
| Automatic daily backup | Missing |
| Backend tests (Pest) | **Implemented** (38 tests) |

---

## 1. What Is Done

### Portfolio & Core Data
- Residence, building, unit (appartement) CRUD with API + React pages
- Unit ↔ co-owner assignment (`PUT appartements/{id}/assigner`)
- Soft deletes on users & appartements
- Dashboard KPIs per residence
- Reports page with budget, impayés, paiements tabs (client-side CSV download)
- Performance indexes migration
- Spatie Media Library for expense justificatifs

### Co-owners
- CRUD, search/filter, reset-password, toggle active/inactive
- Coproprietaires page + drawer UI

### Contributions (Cotisations)
- Fixed vs exceptional cotisation creation (3-step wizard for exceptional)
- 3 repartition modes: `egale`, `par_appartement`, `par_tantieme`
- Per-unit cotisation details with status (NonPaye / PartiellementPaye / Paye)
- Monthly auto-generation command (`cotisations:generate-monthly`, scheduled)
- Impayés endpoint + frontend tab
- Copro portal: "Mes cotisations" (fixe / exceptionnelle tabs)
- Preview (prévisualisation) before generation
- Feature + unit tests

### Payments
- Payment recording with autocomplete, live remaining calculation
- Mode-dependent reference field (cheque → document no. hint)
- Automatic cotisation-detail status update via observer
- Signed download URLs for receipts
- Copro portal: "Mes paiements" + receipt download
- Feature + unit tests

### Budgets & Expenses
- Chart of accounts (`compte_charges`) + sub-accounts (`sous_charges`)
- Expense CRUD with justificatif upload (Spatie media)
- Off-budget expenses (`hors_budgets`) as separate table
- Budget periods (`periodes`) with active fiscal year
- Forecast budget lines (`budget_previsionnels`) with `montant_consomme`, % consumed, overrun flag
- Auto-recalculation of consumed amounts on expense create/update/delete
- Budget summary endpoint + cached resource + frontend alert banner + charts (bar/pie)
- Feature + unit tests

### Complaints (Réclamations)
- Model + status enum (new / in-progress / handled) + priority
- Syndic API: list, detail, update status
- Copro API: list, create, view
- Email notifications (NouvelleReclamation, ReclamationUpdated)
- Syndic + copro UI pages
- Isolation tests (copro cannot access other owners' data)

### Co-owner Portal (partial)
- Secure login (username + password, Sanctum session, throttle 5/min)
- Coproprietaires layout with tabs: Dashboard, Mes cotisations, Mes paiements, Mes réclamations
- Dashboard with KPIs, apartment cards, quick navigation
- Copro API group under `role:coproprietaire` middleware
- Isolation test suite

### Technical Foundations
- Layered architecture: Controller → Service → Repository → Model
- FormRequests, API Resources, Policies, Enums, Events/Listeners, Observers, Jobs, Notifications
- Laravel Sanctum SPA auth (cookie + XSRF interceptor on frontend)
- React Query + Zustand + react-hook-form/zod on frontend
- Responsive Tailwind UI with mobile sidebar toggle
- 38 Pest tests (Feature + Unit), reportedly passing
- nginx + supervisor deploy configs (queue worker for receipts)

---

## 2. What Is Missing (not built at all)

### Entire Modules
| Module | What's missing |
|---|---|
| **6 — Treasury / Cash Management** | Opening/closing balances, period statements, bank reconciliation, treasury statement document |
| **9 — General Assemblies** | AG notice, attendance list, proxies, AG minutes, quitus, financial report, moral report, announcements |
| **11 — AI Connectivity** | WhatsApp assistant, MCP server, API keys, natural-language queries, approval workflow, exchange logging |
| **12 — Showcase Website** | Public pages (home, services, references, about, contact), contact/quote forms, admin-editable content, SEO/sitemap |

### Module-Level Gaps
| Module | Missing features |
|---|---|
| **1 — Residences & Units** | Unit type (apt/duplex/shop/office/house), surface area (m²), land title no., parking spaces (model + numbers), storage boxes, syndicate name field, Excel import, share-total validation per residence, unit owner/payment history, Excel/PDF export |
| **2 — Co-owners** | CIN/RC field, multiple phones/emails with WhatsApp flag, joint ownership (multi co-owner per unit), owner-change history, internal notes, company vs individual, Excel import/export, WhatsApp/call/email quick actions |
| **3 — Contributions** | Fixed-mode grid by unit category (shop/apt-by-surface/duplex/house), residence-level calculation method, monthly pro-rata by days with rounding, exceptional cotisation scoped to specific buildings, fund-call PDF per co-owner, contribution table PDF/Excel |
| **4 — Payments** | Multi-contribution / multi-year allocation (single payment across several cotisations), oldest-first auto-allocation, manual split, QR code on receipt, bank field + bank list, mandatory document no. for cheque, portal payment declaration with document + manager approval, payment cancellation with history, receipt sent by WhatsApp/email, numbered receipt with KHALLOUFI NEGOCE / syndicate letterhead |
| **5 — Budgets & Expenses** | Budget type (forecast vs off-budget, operating vs investment), quantity × unit price lines, expense allocation by building, expense payment method/doc no./bank, supplier list, intervention type with 0 amount, Excel/PDF exports, forecast budget PDF |
| **7 — Debt Collection** | Co-owner situation by period, unpaid by residence/building, automatic monthly reminder (WhatsApp + email), formal notice (mise en demeure) for debts > 1 year, lawyer list export, reminder history, all collection documents |
| **8 — Complaints** | Configurable complaint type list, photo attachments, message exchange thread with resident, handling datetime + measured handling time, building-level location, creation via WhatsApp assistant |
| **10 — Co-owner Portal** | Payment declaration with document upload + approval, residence documents section (minutes, regulations), announcements, PWA install (manifest + service worker), French + Arabic |

### Cross-Cutting Gaps
- **i18n (FR/AR):** No react-i18next / Laravel lang files; all UI strings hardcoded French; Laravel locale still `en`
- **Roles:** `UserRole` enum only `syndic` + `coproprietaire`; no super-admin, no manager/assistant; Spatie permission tables migrated but unused in practice (custom `CheckRole` middleware uses the enum instead)
- **Audit log:** No table, no package, no code (only a placeholder comment in `OnCotisationCreated.php`)
- **Recycle bin:** No restore endpoints, no recycle-bin UI; soft deletes only on users & appartements; other entities hard-delete
- **Excel export:** No maatwebsite/excel or phpoffice; only client-side CSV in RapportsPage
- **PDF documents:** Only receipt template exists (and is broken); no fund call, quitus, AG, formal notice, treasury, budget templates
- **QR codes:** No package, no QR on receipt blade
- **WhatsApp:** No integration anywhere
- **PWA:** No manifest.json, no service worker, no vite-plugin-pwa
- **Backup:** No spatie/laravel-backup, no backup command
- **`EnsureResidenceOwnership` middleware:** Defined but never applied to any route
- **404 page / NotFoundPage:** Described in `docs/ROUTES.md` but not implemented

---

## 3. What Needs Updating (built but wrong / incomplete / broken)

### Critical Bugs (must fix)
| # | Issue | Location |
|---|---|---|
| 1 | **DomPDF not installed** — `Pdf::loadView` will fatal; all receipt generation broken. Package missing from composer.json/lock; `vendor/` absent in workspace | `app/Services/PaiementService.php:11,97` |
| 2 | **Blade typo** `$imieme->nom` (undefined variable) in receipt template | `resources/views/recus/recu.blade.php:162` |
| 3 | **Queue connection mismatch** — `.env` says `database`, supervisor runs `queue:work redis`; receipts stuck "En cours" | `.env` vs `deploy/supervisor/syndicpro.conf` |
| 4 | **Copro reclamation detail → 500** — controller calls `findByIdForCoproprietaires` (plural); service defines `findByIdForCoproprietaire` (singular) | `Coproprietaires/ReclamationController.php:63` vs `ReclamationService.php` |
| 5 | **Widespread French-character encoding corruption** — `é` → `Ac`, `"` → `A\"` etc. Visible in sidebar labels ("RAcsidences", "CopropriActaires", "DAcpenses", "RAcclamations"), auth messages, reclamation messages, AppServiceProvider logs | `SyndicLayout.tsx`, `CoproprietairesLayout.tsx`, `AuthController.php`, `Coproprietaires/ReclamationController.php`, `AppServiceProvider.php`, likely more |
| 6 | **`nb_immeubles` / `nb_appartements` always 0** — denormalized columns never updated; API resource returns 0 | `ResidenceResource.php` / residences queries |
| 7 | **CotisationService operator-precedence bug** — `(float)$data['montant_total'] ?? …` — cast binds tighter than `??`, fallbacks never work | `CotisationService.php:58` |
| 8 | **`vendor/` missing** — `composer install` not run in this workspace; app cannot execute as-is here | `syndicpro-api/vendor/` |

### Incomplete Implementations (update to match spec)
| Area | Current | Spec requires |
|---|---|---|
| Residence `nb_immeubles` | Static column, always 0 | Computed count (or derived from immeubles table) |
| Cotisation fixed mode | Single `montant_mensuel` for all units | Grid by unit category (surface, type…) |
| Cotisation tantième mode | Only on exceptional cotisations | Selectable as residence's standing calculation method |
| Monthly cotisations | Flat monthly amounts | Pro-rata by days in month with rounding adjustment |
| Payment allocation | 1 payment → 1 cotisation_detail | Multi-contribution allocation (auto oldest-first + manual) |
| Receipt template | Generic "SyndicPro" branding | Numbered + QR code + KHALLOUFI NEGOCE & syndicate letterhead |
| Expense model | montant, date, description, justificatif | + payment method, doc no., bank, building allocation, supplier, intervention type |
| Complaint model | priorite free string, single reponse_syndic | Configurable type list, photo attachments, message thread, handling-time tracking |
| Copro payment flow | Read-only | Declare payment with supporting document → manager approve/reject |
| Role system | Enum check (`CheckRole`) on 2 roles | Spatie permissions: per-module view/create/edit/delete, residence scoping, deletion approval |
| `EnsureResidenceOwnership` | Defined, never used | Applied to residence-scoped routes |
| Immeubles UI | Shows "—" for residence name | Should display residence |
| Reclamations pagination | Handlers reportedly not wired | Working pagination |
| Cotisations empty state | Double "+" | Fix display |
| `docs/TASKS.md` | All 22 phases unchecked | Stale — phases implemented are still marked `[ ]` |
| `docs/ROUTES.md` | Describes `createBrowserRouter` + NotFoundPage | Doesn't match implemented App.tsx `<Routes>` structure |

### Performance Issues (update)
- Excessive API calls per page (Rapports 10, Paiements 7, Cotisations 7) — duplicate queries with/without `periode_id`
- Invalid `coproprietaires?residence_id=0` request fired
- Missing caching on dashboard / cotisation totals / impayés (only budget summary is cached)
- Heavy `RapportController` queries (cloned base query 3–4×)

---

## 4. What Needs to Be Deleted

Nothing functional needs removal — the codebase is a clean MVP without dead feature modules. However, the following should be **removed or replaced** during cleanup:

| Item | Reason |
|---|---|
| **`nb_immeubles` / `nb_appartements` denormalized columns** | Always 0, never updated — delete columns and compute counts from related tables (or fix the resource to aggregate) |
| **Stale `docs/TASKS.md` phase checkboxes** | Misleading — all unchecked despite phases 1–4 being done; delete or rewrite to reflect reality |
| **`docs/ROUTES.md` router description** | Describes `createBrowserRouter` / `NotFoundPage` structure that doesn't exist; delete or rewrite to match `App.tsx` |
| **`PROJECT_STATUS.md` fix-plan items already resolved** | Several items (signed URLs, `GenerateMonthlyCotisations` command, some reclamation methods) are done but still listed as open — prune resolved entries or replace the file with this `projstat.md` |
| **Encoding-corrupted French strings** | Not deletable as code, but all corrupted literals must be replaced with correct UTF-8 (sidebar labels, auth messages, reclamation messages, logs) |
| **`// For now: … log audit` placeholder comment** | `OnCotisationCreated.php:12` — replace with real audit logging or remove |
| **Duplicate/unused Spatie permission seed data if roles stay enum-based** | Either fully adopt Spatie permissions or drop the unused permission tables — currently half-integrated |
| **Client-side CSV download in RapportsPage (once Excel export exists)** | Temporary workaround; replace with proper server-side Excel export |
| **Generic "SyndicPro" branding in receipt blade** | Replace with KHALLOUFI NEGOCE / syndicate letterhead per spec |

---

## 5. Recommended Priority

### P0 — Fix what's broken
1. Run `composer install` (vendor missing); install `barryvdh/laravel-dompdf` (+ `simplesoftwareio/simple-qrcode` for QR)
2. Fix `$imieme` typo in receipt blade
3. Align queue driver (env vs supervisor)
4. Fix `findByIdForCoproprietaires` → `findByIdForCoproprietaire`
5. Fix French encoding corruption across UI strings
6. Fix `CotisationService` precedence bug
7. Fix `nb_immeubles`/`nb_appartements` (compute, don't store)
8. Wire reclamation pagination handlers

### P1 — Core spec gaps (back-office)
1. Co-owners: CIN, multi-phone/email + WhatsApp flag, joint ownership, owner-change history
2. Units: type, surface, land title, parking, storage, syndicate name
3. Contributions: fixed grid by unit category, pro-rata monthly, exceptional by building
4. Payments: multi-contribution allocation, bank list, cheque doc-no. validation, cancellation history
5. Expenses: building allocation, supplier list, payment details, budget types
6. Treasury module (Module 6)
7. Debt collection automation (Module 7): reminders, formal notices, lawyer list
8. Complaints: types, photos, message thread, handling time
9. Roles: super-admin + manager with per-module/residence permissions (use Spatie properly)
10. Audit log + recycle bin UI
11. Server-side Excel + PDF export for all specified documents

### P2 — Portal & documents
1. Portal payment declaration + approval workflow
2. Portal residence documents + announcements
3. PWA manifest + service worker
4. Document generation: fund call, quitus, AG notice/minutes, formal notice, treasury statement, budget PDFs
5. FR/AR i18n (react-i18next + Laravel lang)

### P3 — New modules
1. Module 9 — General Assemblies & Reports
2. Module 11 — AI Connectivity (WhatsApp agent + MCP server)
3. Module 12 — Showcase website
4. Automatic daily DB backup
5. 404 page + route cleanup
6. Performance: caching, reduce duplicate API calls

---

*Generated from codebase exploration on 2026-10-01. Source: `syndicpro-api/` (Laravel), `syndicpro-front/` (React), `docs/`, `PROJECT_STATUS.md`.*
