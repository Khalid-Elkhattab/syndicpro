# Syndic App — Implementation Plan (Backend + Frontend)

Companion to `Syndic_Database_Structure.md` (the single source of truth for tables, enums and business rules). This file says **what to build, in which layer, and in which order**. Table and enum names below are the ones defined there.

---

## 0. Stack and assumptions

| Area | Choice | Note |
|---|---|---|
| Framework | Laravel (latest), PHP 8.3+ | Pest for tests, Laravel Pint for style |
| Back-office + owner portal UI | **Livewire** (full-page components) + Alpine.js + Tailwind CSS | Same stack as your other projects. Classic controllers + Form Requests are kept for everything that is not a screen (downloads, webhooks, API, public pages). |
| Showcase website | Blade SSR (no Livewire) | SEO, speed, hreflang fr/ar |
| Portal as an app | PWA (manifest + service worker for the app shell) | "Install on phone", no App Store (out of scope) |
| Auth | Single `users` table, single guard, `type = staff \| owner` | Decided. Owners log in with a username, staff with email. |
| Roles / permissions | `spatie/laravel-permission` (staff only) | Residence scope via `residence_user` |
| Audit | `spatie/laravel-activitylog` + `account_events` + `api_audit_logs` | |
| Files | `spatie/laravel-medialibrary` for attachments, `documents` table for official files | |
| Excel / CSV | `maatwebsite/excel` | Import with dry run |
| PDF | **Browsershot (headless Chrome) or mPDF, not dompdf** | Arabic (RTL, shaping) in quitus, convocation, PV must be tested in week 1. dompdf is weak with Arabic. |
| Queues / scheduler | Database or Redis queue, Laravel scheduler | Reminders, PDFs, WhatsApp, imports |
| API docs | Scramble or Scribe | "Documented API" requirement |
| WhatsApp | WhatsApp Business Cloud API | Needs a verified business account and **pre-approved message templates**: start the paperwork in week 1 |

If you prefer an admin-panel kit (Filament) for the back-office, most of section 3 turns into resources and relation managers and you lose controllers and Form Requests on those screens. The plan below assumes the classic layering you asked for.

---

## 1. Architecture conventions

```
app/
  Enums/                      string-backed enums + HasLabel trait (fr/ar)
  Models/                     Eloquent, casts to enums, ResidenceScope trait
  Policies/                   one per model
  Http/
    Controllers/Admin/<Module>/   staff area (thin)
    Controllers/Portal/           owner area (thin)
    Controllers/Public/           showcase site, /verify/{token}
    Controllers/Api/V1/           API for MCP / future tools
    Controllers/Webhooks/         WhatsApp
    Middleware/
    Requests/<Module>/            FormRequests
    Resources/                    API resources
  Livewire/Admin/<Module>/        screens and components (staff)
  Livewire/Portal/                screens (owner)
  Services/<Domain>/              business logic, transactions
  Jobs/  Events/  Listeners/  Notifications/
  Rules/                          custom validation rules
  Support/                        Money, ResidenceContext, Number helpers
resources/views/  (admin, portal, public, pdf, components)
lang/fr  lang/ar
```

**Rules of the house**
1. **Controllers and Livewire components are thin:** validate (FormRequest or Livewire form object that reuses the same rules), authorize (Policy), call **one service method**, return a response.
2. **All business rules live in Services** and run inside `DB::transaction`. A rule never lives in a controller, a Livewire component or a model observer.
3. **FormRequests:** `authorize()` calls the Policy, `rules()` uses enums (`Rule::enum`), `after()` for cross-field checks. Livewire forms reuse the same rule arrays.
4. **Policies** all share one trait, `AuthorizesResidence`:
   - `before()`: super admin passes; owner accounts are denied on every staff policy.
   - Every method checks `can('<module>.<action>')` **and** that `model->residence_id` is in the user's assigned residences.
   - Deletes never run directly for non-admins: the service creates an `approval_requests` row (`action = delete`).
5. **Global scope `ResidenceScope`** on every model with `residence_id`, so a missed `where` can never leak another residence.
6. **Money** is always `decimal` + a `Money` value helper. No floats anywhere.
7. **Naming:** routes `admin.<module>.<action>`, permissions `<module>.<action>`.
8. **Lifecycle events** (`PaymentValidated`, `PaymentCancelled`, `LotHandedOver`, `ContributionPublished`, `ComplaintResolved`, `DocumentGenerated`) trigger listeners and jobs: receipt, notification, due recomputation.

---

## 2. Cross-cutting building blocks

### 2.1 Roles and permissions

Permissions are `<module>.<action>` with actions `view`, `create`, `update`, `delete` (the CDC's four rights per module), plus these special ones:

`staff.manage_assistants`, `owner_accounts.initialize`, `owner_accounts.reset`, `account_requests.review`, `payments.validate`, `payments.cancel`, `contributions.publish`, `budgets.approve`, `collection.send`, `collection.formal_notice`, `assemblies.convene`, `quitus.issue`, `owners.view_identity`, `owners.handover`, `owners.handover_override`, `documents.upload`, `imports.run`, `approvals.review`, `api_keys.manage`, `benchmarks.view`, `trash.restore`, `audit.view`, `settings.manage`.

Roles (staff only): 

| Role | Residences | Default permissions | Account rights |
|---|---|---|---|
| `super_admin` | all | everything | creates syndic, assistant, other super admins; initialises any owner account |
| `syndic` | assigned by super admin | every business module on his residences, `approvals.review`, `audit.view` for his scope; **not** `settings.manage` or `api_keys.manage` | creates and manages **his own assistants**; initialises owner accounts; reviews access requests |
| `assistant` | subset of his syndic's | only what the syndic grants (module × action matrix) | none by default; `owner_accounts.initialize` and `account_requests.review` can be granted |

Owners (`users.type = owner`) have no role and no permissions: portal access is decided by the logged-in lot and its ownership period. **Ceiling rule:** a syndic can grant an assistant only permissions and residences he holds himself (checked in `PermissionDelegationService`, never only in the UI). Defaults are editable by the super admin.

### 2.2 Middleware

| Middleware | Applied to | Does |
|---|---|---|
| `EnsureStaff` | `/admin/*` | `type = staff`, `status = active` |
| `EnsureSupervisorActive` | `/admin/*` | an assistant is blocked while his syndic is suspended |
| `ThrottleAccessRequests` | public request-access routes | per IP and per CIN limits, honeypot check |
| `EnsureOwnerAccount` | `/portal/*` | `type = owner`, `status = active`, password set, lot not archived |
| `SetLocale` | web | user locale > session > cookie > `fr`; sets `dir=rtl` for `ar` |
| `ResidenceContext` | `/admin/*` | residence chosen in the top-bar switcher, validated against assignments; "all residences" allowed only if the user has access to several |
| `ThrottleLogins` + `failed_attempts` / `locked_until` | login routes | lockout, writes `account_events` |
| `EnsurePasswordIsSet` | portal | forces the activation flow |
| `VerifyWhatsAppSignature` | `/webhooks/whatsapp` | HMAC check of Meta signature |
| `AuthenticateApiKey` | `/api/v1/*`, `/mcp` | hashed key lookup, not revoked, not expired |
| `EnsureApiAbility:<ability>` | API routes | per-endpoint ability |
| `ApiRateLimit` | API | per key |
| `LogApiCall` | API, MCP | writes `api_audit_logs` (every exchange) |
| `ResponseCache` | public site | cache of the showcase pages |

Route groups: `/admin` (staff), `/portal` (owner), `/portal/request-access` and `/activate/{token}` (public, throttled), `/api/v1` and `/mcp` (keys), `/webhooks/whatsapp`, `/` (public site), `/verify/{token}` (public receipt/quitus check).

### 2.3 Shared services

| Service | Role |
|---|---|
| `DueSettlementService` | The only code allowed to write `dues.amount_paid` / `status` |
| `DocumentGenerator` | Renders a template to PDF, numbers it (`number_sequences`), stores the `documents` row (version, checksum, QR token, lock) |
| `DocumentDeliveryService` | WhatsApp / email sending, writes `document_deliveries` |
| `NotificationService` | One interface over WhatsApp, email, in-app bell |
| `ApprovalService` | Creates, approves, rejects `approval_requests`; the reviewer can never approve their own request |
| `ExportService` | Excel + PDF exports with the residence header |
| `NumberSequenceService` | Gap-free numbers with `lockForUpdate()` |
| `OwnerAccountService` | Creates the lot login, generates the username, issues the activation link, reset, suspend |
| `AccountEventLogger` | Appends to `account_events` |

### 2.4 Shared frontend system (build once, week 1)

- **Layout:** sidebar by module (items hidden when the permission is missing), top bar with **residence switcher**, **global search (CIN first)**, notification bell, language switch FR / AR, user menu.
- **Components (`<x-…>`):** `data-table` (sort, filters, pagination, column toggle, export buttons), `filter-bar`, `money` (display) and `money-input`, `status-badge` (one colour map per enum), **`sale-badge`** (unsold / sold, always icon + text + colour so colour is never the only signal, with a "transfer pending" tag), `sales-progress-bar` (sold / unsold / pending), **`building-board`** (floor-by-floor grid of unit tiles coloured by sale status, hover shows owner, type and surface, click opens the lot), `confirm-dialog`, `file-upload` (drag, camera on mobile), `pdf-preview` (modal), `date-range`, `searchable-select` (residence → building → lot chain), `stat-card`, `chart` (line/bar), `empty-state`, `toast`, `form-section`, `repeater` (phones, annexes, split rows).
- **RTL / i18n:** Tailwind logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `text-start`), `dir` set by middleware, Arabic font (Cairo or Noto Naskh Arabic), enum labels through `HasLabel`, every string in `lang/fr` and `lang/ar`. Decide with the client whether numbers show Latin or Arabic-Indic digits (default: Latin).
- **Responsive:** tables collapse to cards on phones; forms are single-column below `md`.
- **PWA:** manifest, icons, service worker caching only the shell (no offline data), install prompt in the portal.

### 2.5 Scheduler and queues

| Job / command | Schedule | Notes |
|---|---|---|
| `SendMonthEndReminders` | last day of each month | one `collection_actions` row per owner and channel, idempotent (owner + month + type) |
| `ExpireActivationLinks` | daily | sets expired links to be re-issued |
| `ExpireApprovalRequests` | daily | `approval_requests.expires_at` |
| `BackupDatabase` | daily | automatic backup + retention + a restore test documented |
| `PruneApiLogs` | weekly | retention policy |
| Queued: `GenerateDocumentJob`, `SendWhatsAppMessage`, `SendEmail`, `ProcessIncomingWhatsAppMessage`, `RunImportBatch`, `GenerateDuesJob` | on demand | retries with backoff, failures visible in `document_deliveries` |

---

## 3. Feature-by-feature plan

Each feature lists: **Routes / Controllers**, **FormRequests**, **Policies / permissions**, **Services**, **Jobs / events**, **Frontend**, **Key tests**.

### F0. Authentication, roles, account creation, access requests

- **Controllers:**
  - Login and password: `Auth\StaffLoginController` (email), `Auth\OwnerLoginController` (username), `Auth\ActivationController` (link → choose password, staff and owners), `Auth\ForgotPasswordController`, `Auth\PasswordController` (change), `Auth\LogoutController`.
  - Staff accounts: `Admin\StaffAccountController` (list, invite, edit, suspend; scoped to "my assistants" for a syndic), `Admin\StaffInvitationController` (resend, revoke), `Admin\PermissionMatrixController`, `Admin\ResidenceAssignmentController`.
  - Owner accounts: `Admin\OwnerAccountController` (initialise one, resend link, reset, suspend), `Admin\BulkInitializeController` (per residence).
  - Access requests: `Portal\AccessRequestController` (public form), `Portal\PhoneVerificationController` (send and check the code), `Admin\AccessRequestController` (inbox, review screen, approve, needs info, reject).
- **FormRequests:** `StaffLoginRequest`, `OwnerLoginRequest`, `SetPasswordRequest` (token valid and unused, strong password), `ForgotPasswordRequest`, `ChangePasswordRequest`, `InviteStaffRequest` (role allowed for the creator, residences and permissions within the creator's own, supervisor rules), `UpdateStaffRequest` (cannot demote or suspend the last super admin; cannot suspend a syndic who still has assistants), `InitializeOwnerAccountRequest`, `BulkInitializeRequest`, `SendPhoneCodeRequest`, `VerifyPhoneCodeRequest`, `SubmitAccessRequestRequest` (residence, building and lot text, CIN normalised, phone E.164, verified code present, proof file limits, honeypot), `ReviewAccessRequestRequest` (action approve / needs_info / reject; reject needs a reason; `owned_by_promoter`, `no_owner_on_record` and `different_owner` requests can only be approved through the transfer wizard; `documents_checked` and `contact_confirmed` required for any non-exact match).
- **Policies:** `UserPolicy` (super admin: all staff; syndic: only assistants with `supervisor_id` = him; assistant: none), `OwnerAccountPolicy` (initialise and reset need the permission and the lot's residence), `AccessRequestPolicy` (`account_requests.review` + residence scope).
- **Services:** `StaffAccountService` (invite, role and supervisor rules, reassign assistants), `PermissionDelegationService` (ceiling rule), `OwnerAccountService` (`issueActivation`, `bulkIssue`, reset, suspend), `AccessRequestService` (submit, match, approve, needs info, reject), `PhoneVerificationService` (code hash, expiry, attempts), `AccountEventLogger`, `PermissionMatrixService`.
- **Jobs / events:** `SendActivationLinkJob` (WhatsApp template with email fallback), `SendStaffInvitationJob`, `ExpireAccessRequests` (daily), `ExpireActivationLinks` (daily). Events `AccessRequestSubmitted` (notifies the residence's syndic), `AccountActivated`.
- **Frontend:**
  - Two login pages (back-office and portal) in FR/AR, forgot-password page, activation page (choose password), password change.
  - Staff screen: list (syndic sees only his assistants), **invite form** with role, residence multi-select and the permission matrix limited to what the creator holds, status chips (invited, active, suspended), resend invitation.
  - **Public "Request access" page**, mobile first, 4 steps: lot → identity → phone code → confirmation (generic message); "add another lot" button.
  - **Access-request inbox** with a badge counter, filters by residence, status and match result; **review screen** showing the submitted data and the record on file side by side, proof preview, match result banner, actions *Approve and send link*, *Needs info*, *Reject*, *Create owner from this request* when no owner is on record, and *Start transfer* when the lot belongs to the promoteur or to another owner.
  - **Owners tab per residence** for bulk initialisation: status chips (`no owner on record`, `no contact`, `ready`, `link sent`, `active`), select `ready`, "Send activation links", result report.
- **Key tests:**
  - Hierarchy: super admin creates all roles; syndic creates only his own assistants and cannot create a syndic; assistant creates nothing by default; ceiling rule blocks granting a permission the syndic lacks; suspending a syndic with assistants is refused.
  - Owner cannot reach `/admin`, staff cannot use the portal; a pending-activation account cannot log in; lockout after N failures; activation link is single-use, expires, and is stored hashed.
  - Access requests: wrong or expired phone code blocks submission; the public response is identical for existing and unknown lots or CINs; `owned_by_promoter` and `different_owner` requests can only be approved through the transfer wizard; a submitted contact that is not on file cannot receive the link until confirmed; throttles work; approving sends exactly one link and logs `account_events`.
  - Staff screen never lists owner accounts.

### F1. Residences, buildings, lots (Module 1)

- **Controllers:** `ResidenceController`, `BuildingController`, `LotController`, `LotAnnexController`, `LotImportController` (upload → preview → commit), `LotExportController`, `TantiemeCheckController`.
- **FormRequests:** `StoreResidenceRequest` / `UpdateResidenceRequest` (unique `code`, calculation mode, fiscal start month, `arrears_on_sale`), `StoreBuildingRequest`, `StoreLotRequest` / `UpdateLotRequest` (type enum, surface ≥ 0, tantième ≥ 0, unique building + number, parking/box arrays), `ImportLotsRequest` (csv/xlsx, size limit), `ArchiveLotRequest`.
- **Policies:** `ResidencePolicy`, `BuildingPolicy`, `LotPolicy` (archive = `lots.update`; delete goes through approval).
- **Services:** `ResidenceService`, `LotService` (create lot + annexes + **owner login** via `OwnerAccountService`), `TantiemeControlService`, `LotImportService` (dry run, upsert, one transaction), `LotExportService`, `SaleStatusService` (computed unsold / sold per lot, pending tag, counts and tantième share per building and residence).
- **Events:** `LotCreated` → create the lot's owner login; `LotArchived` → close the login.
- **Frontend:** residence list + detail with tabs (overview with a **sales-progress card**: sold / unsold / pending by lots and by tantièmes; buildings as cards with a mini progress bar and a label *Not sold* / *Partially sold x/y* / *Fully sold*, plus filter chips; lots; **building board**; tantième control; settings); lots table (filters residence / building / type, search); lot form with annex repeaters; lot detail (owners history, payments history); **import wizard** (upload → preview with warnings → commit, error table with row numbers); tantième banner (OK / mismatch).
- **Key tests:** import dry run changes nothing; re-import updates and never duplicates; invalid row rolls back the file; tantième total check; owner login created per lot with the right username.

### F2. Co-owners, ownership, owner file (Module 2)

- **Controllers:** `OwnerController` (index, show = **owner file**, create, edit), `OwnerSearchController` (CIN / name / phone / email / lot reference), `LotOwnershipController` (assign, indivision), `LotTransferController` (wizard, started from a lot or from an access request), `LotHistoryController` (staff-only timeline), `QuitusController` (issue, cancel, PDF), `OwnerAccountController` (reset, suspend, reactivate, resend activation), `OwnerImportController`, `OwnerExportController`, `OwnerContactController` (WhatsApp / call / email links, logged).
- **FormRequests:** `StoreOwnerRequest` / `UpdateOwnerRequest` (type, CIN/RC normalised, phones with one primary and WhatsApp flag, emails), `AssignOwnerRequest` (shares sum to 100), `TransferLotRequest` (new or existing owner, effective date not before the current ownership start, `quitus_id` required unless an `override_reason` is given by a user holding `owners.handover_override`, proof-of-sale file; sale contract required when the reason is `promoter_sale`), `IssueSaleQuitusRequest` (lot and outgoing owner, overdue balance must be 0), `ResetAccountRequest`, `ImportOwnersRequest`. Custom rules: `UniqueIdentityNumber` (links instead of duplicating), `E164Phone`.
- **Policies:** `OwnerPolicy` (view needs access to at least one of the owner's residences; `owners.view_identity` for the full CIN), `LotOwnershipPolicy`, `OwnerAccountPolicy`, `LotTransferPolicy` (`owners.handover`; the override needs `owners.handover_override`), `QuitusPolicy`.
- **Services:** `OwnerService` (find-or-create by CIN, merge duplicates), `OwnershipService`, **`LotTransferService`** (gate, then `HandOverLot`; full flow in the DB file), `QuitusService` (issue, expire, consume), `LotHistoryService`, `OwnerAccountService`, `OwnerSituationService` (summary for owner file, portal and WhatsApp), `OwnerImportService`.
- **Frontend:** **global CIN search**; owner file page (identity, properties, situation summary, cotisations with the payment that settled each, payments, reminders, complaints, documents, account panel); owner form with phone/email repeaters; **transfer wizard** (1. lot and outgoing owner, with balance and quitus status; 2. quitus: pick a valid one or issue it now, blocked while the balance is above 0; 3. incoming owner: from the access request, an existing owner, or create one; 4. effective date (first day of next month suggested), proof of sale, and the **sale contract** (mandatory when the seller is the promoteur); 5. summary, and an override section only for users who hold the permission; 6. confirm and see the activation link status); **lot history timeline** (staff only, every ownership period with its dues, payments, documents, complaints, quitus and transfer record); "Generate statement" button.
- **Key tests:** no duplicate owner for the same CIN; transfer closes ownership, resets the login, revokes sessions, writes events and a `lot_transfers` row; transfer blocked without a valid quitus, with an expired or already used quitus, or when the balance is above 0 at transfer time; override needs the permission and a reason and is logged; first sale from the promoteur works with reason `promoter_sale` but is blocked without the sale contract or the lot's quitus; dues from the effective date move to the buyer and the month in progress stays with the seller; new owner never sees previous owner's receipts, payments, complaints or contacts; the seller's login stops working immediately; lot history is visible to staff only; indivision shares must total 100; CIN masked without permission; opening a file is logged.

### F3. Cotisations and fund calls (Module 3)

- **Controllers:** `ContributionController`, `ContributionPreviewController` (simulation), `ContributionPublishController`, `FundCallController` (per owner / per residence PDF), `ContributionTableExportController`.
- **FormRequests:** `StoreContributionRequest` / `UpdateContributionRequest` (period, type, mode; annual budget required in tantième mode; fixed-rate rows without overlaps; buildings required when exceptional is partial), `PublishContributionRequest` (tantième control OK; **every lot matches exactly one fixed rate**).
- **Policies:** `ContributionPolicy` (`contributions.publish`; a published contribution with payments can only be cancelled, not edited).
- **Services:** `ContributionCalculator` (fixed grid by lot type + surface range; tantième coefficient), `DueGenerator` (day-based prorata, largest-remainder rounding so the total is exact), `ContributionPublisher` (snapshots tantième and coefficient into `contribution_lots`, generates `dues`), `FundCallGenerator`, `DueSettlementService`.
- **Jobs:** `GenerateDuesJob` for big residences.
- **Frontend:** contribution form with a **mode switch** (fixed: grid editor by lot type and surface range; tantième: budget → coefficient preview); **live preview table per lot** with the total check; publish confirmation; contribution detail (per-lot table with paid / partial / unpaid chips and % collected); buttons for fund-call PDFs and Excel table.
- **Key tests:** prorata rounding sums exactly; fixed mode blocks publish on unmatched lots; exceptional contribution only hits the chosen buildings; tantième change later does not rewrite published calls.

### F4. Payments and receipts (Module 4)

- **Controllers:** `PaymentController`, `PaymentAllocationController` (manual), `PaymentValidationController` (approve / reject declared), `PaymentCancelController`, `ReceiptController` (download, resend), `Public\ReceiptVerifyController` (`/verify/{token}`).
- **FormRequests:** `StorePaymentRequest` (residence → building → lot → owner automatic; method enum; **document number required when `method->requiresDocumentNumber()`**; bank required for cheque / effet; amount > 0; allocation mode; manual allocations total ≤ amount), `CancelPaymentRequest` (reason required), `ValidateDeclaredPaymentRequest`, `RejectPaymentRequest` (reason), portal `DeclarePaymentRequest` (proof file, amount, date, method).
- **Policies:** `PaymentPolicy` (`payments.validate`, `payments.cancel`; a validated payment is immutable except notes: correct it by cancel + new payment).
- **Services:** `PaymentService` (record, validate, cancel), `AllocationService` (oldest first, or manual), `DueSettlementService`, `ReceiptService` (number from `number_sequences`, PDF with QR token, only when status becomes `validated`).
- **Events / jobs:** `PaymentValidated` → `GenerateDocumentJob` (receipt) → `SendWhatsAppMessage` / email; `PaymentCancelled` → recompute dues.
- **Frontend:** payment entry form (residence → building → lot, owner and **current balance shown automatically**, conditional document-number / bank fields, **editable allocation preview**), payments list with filters, payment detail (allocations, receipt button, cancel dialog with reason), **inbox of declared payments** (proof preview, approve / reject), public receipt verification page.
- **Key tests:** one payment settles 2024 + 2025 + 2026; leftover becomes credit and is applied to later dues; cancelling restores dues; cheque without number is rejected; receipt number is gap-free and issued once.

### F5. Budgets and expenses (Module 5)

- **Controllers:** `BudgetController`, `BudgetApproveController`, `BudgetLineController`, `BudgetAccountController` (accounts / sub-accounts tree, standard codes), `ExpenseController`, `SupplierController`, `BudgetVsActualController`, `ExpenseExportController`.
- **FormRequests:** `StoreBudgetRequest` / `UpdateBudgetRequest` (type forecast / off-budget, kind operating / investment, fiscal year), `BudgetLineRequest` (quantity > 0, unit price ≥ 0), `StoreExpenseRequest` (**intervention ⇒ amount 0 and payment fields hidden; expense ⇒ amount > 0**; `budget_kind` required when off-budget; building splits total = amount; document number rule; account belongs to the residence or the shared template), `SupplierRequest`, `AccountRequest`.
- **Policies:** `BudgetPolicy` (`budgets.approve`; approved budget locked), `ExpensePolicy`, `SupplierPolicy`, `BudgetAccountPolicy`.
- **Services:** `BudgetService` (monthly / annual totals), `ExpenseService` (record, split, status), `BudgetComparisonService` (planned vs actual), `OverBudgetAlertService` (notifies when an account passes its budget), `ExpenseExportService`.
- **Frontend:** **budget editor** (account tree with lines, quantity × unit price, live monthly / annual totals); expense form with conditional fields and a **building split repeater** (equal split or manual); invoice upload; supplier CRUD; **planned vs actual** table with progress bars and red overrun alerts; Excel / PDF export.
- **Key tests:** intervention with amount ≠ 0 rejected (form and DB constraint); split total mismatch rejected; over-budget alert fires once per crossing; off-budget expense keeps its kind in reports.

### F6. Treasury (Module 6)

- **Controllers:** `TreasuryStatementController`, `BankAccountController`.
- **FormRequests:** `StoreTreasuryStatementRequest` (period does not overlap another for the same account), `ReconcileTreasuryRequest` (bank closing balance).
- **Policies:** `TreasuryStatementPolicy` (`treasury.validate`; validated statements locked).
- **Services:** `TreasuryService` (opening balance from previous closing, total contributions = validated payments, total expenses, computed closing, difference), `TreasuryPdfService`.
- **Frontend:** statement builder (residence + period → automatic totals → enter bank balance → **difference indicator** → validate → PDF); history list; bank accounts management.
- **Key tests:** cancelled payments and cancelled expenses excluded; difference = computed − bank; overlapping periods refused.

### F7. Debt collection (Module 7)

- **Controllers:** `UnpaidController` (by residence / building), `CollectionController` (owners in arrears, bulk actions), `ReminderController`, `FormalNoticeController`, `LawyerListController`, `CollectionHistoryController`.
- **FormRequests:** `SendRemindersRequest` (selection, channel, preview confirmed), `GenerateFormalNoticesRequest` (only eligible dues), `ExportLawyerListRequest`, `UpdateLawyerCaseRequest`.
- **Policies:** `CollectionPolicy` (`collection.send`, `collection.formal_notice`; approval can be required through settings), `LawyerCasePolicy`.
- **Services:** `DebtService` (unpaid queries), `ReminderService`, `FormalNoticeService` (dues unpaid for more than a year), `LawyerListService`, `DocumentGenerator`, `DocumentDeliveryService`.
- **Jobs:** `SendMonthEndReminders` (idempotent), `SendReminderJob` per owner (WhatsApp rate limits, template message, email fallback).
- **Frontend:** unpaid dashboard (filters, totals, by building); owners-in-arrears table with **select all + "Send reminder"** dialog (message preview, channel); formal-notice list with generate button; lawyer-list view with case status workflow and export; per-owner reminder history timeline.
- **Promoteur:** his arrears are shown in their own section and never mixed into the owners' collection rate; reminders and statements are **one consolidated message per owner** listing all his lots; formal notices and lawyer cases against him are never automatic (bulk selection excludes him by default).
- **Key tests:** month-end run twice sends once; formal notice only after 12 months; paid owner never reminded; failed WhatsApp falls back to email and is logged.

### F8. Complaints (Module 8)

- **Controllers:** `ComplaintController`, `ComplaintStatusController`, `ComplaintMessageController`, `ComplaintTypeController` (settings), portal `Portal\ComplaintController`.
- **FormRequests:** `StoreComplaintRequest` (location chain, type, description, photos: count, size, mimes), `UpdateComplaintStatusRequest` (resolved requires handling date and client feedback), `StoreComplaintMessageRequest` (`is_internal` staff only), `PortalStoreComplaintRequest` (lot taken from the logged-in account, never from input).
- **Policies:** `ComplaintPolicy` (an owner sees only complaints of their lot raised during their ownership), `ComplaintMessagePolicy`.
- **Services:** `ComplaintService` (create from staff / portal / WhatsApp, assign, resolve and compute `resolution_minutes`), `ComplaintNotificationService`.
- **Frontend:** complaints list / board (new, in progress, resolved) with filters; detail page with chat thread, photo gallery, internal-notes toggle, status transitions, feedback to the client; portal: new complaint form (type, description, **camera upload from phone**), my complaints with thread.
- **Key tests:** handling time computed on resolve; internal notes never reach the portal; owner cannot open another lot's complaint.

### F9. General assemblies, quitus, reports, announcements (Module 9)

- **Controllers:** `AssemblyController`, `ResolutionController`, `AttendanceController` (with proxies), `VoteController`, `AssemblyNoticeController`, `MinutesController` (generate + upload signed scan), `QuitusController`, `ReportController` (financial, moral), `AnnouncementController` (note / information).
- **FormRequests:** `StoreAssemblyRequest`, `ResolutionRequest` (majority rule), `AttendanceRequest` (one row per lot, proxy cannot be the owner themselves), `VoteRequest`, `IssueQuitusRequest` (**overdue balance must be 0**; `lot_id` required when `purpose = sale`), `GenerateReportRequest` (fiscal year), `StoreAnnouncementRequest` (kind, building or whole residence, channels, fr + ar texts).
- **Policies:** `AssemblyPolicy` (`assemblies.convene`), `QuitusPolicy` (`quitus.issue`), `AnnouncementPolicy`.
- **Services:** `AssemblyService` (convene → documents + one delivery per owner), `QuorumService` (present tantièmes), `VoteTallyService` (simple, two-thirds, unanimity), `MinutesGenerator`, `QuitusService` (built in week 2 with the transfer gate and reused here), `FinancialReportService`, `MoralReportService`, `AnnouncementService` (publish + notify).
- **Frontend:** **assembly wizard** (details → agenda and resolutions → convene → **attendance sheet** lot by lot present / represented / absent with proxy picker and live quorum meter (plus a bulk action to mark all lots of one owner at once, used for the promoteur's unsold lots) → **voting table** per resolution with live tally → minutes preview and generation → upload the signed scan as a new locked version); quitus screen (shows balance, blocked if above 0); report generator; bilingual announcement editor with preview and channel choice.
- **Key tests:** vote weight = lot tantième; majority rules; quorum meter; quitus refused with a balance; convocation creates one delivery per owner; signed upload locks the minutes.

### F10. Owner portal (Module 10)

- **Controllers (Portal):** `DashboardController`, `DuesController`, `ReceiptsController`, `PaymentDeclarationController`, `ComplaintController`, `DocumentsController`, `AnnouncementsController`, `ProfileController` (password, language).
- **FormRequests:** `DeclarePaymentRequest`, `PortalStoreComplaintRequest`, `ChangePasswordRequest`.
- **Policies / scoping:** payments `owner_id = users.current_owner_id`; dues from the ownership start (older arrears only if `arrears_on_sale = buyer_pays`); documents by `owner_id` or `visibility = residence`.
- **Services:** `OwnerSituationService`, `PortalDocumentService`.
- **Frontend:** mobile-first shell with bottom navigation; dashboard cards (due, paid, remaining); dues list with status chips; receipts download; **declare a payment** (camera, amount, method); complaints; documents; announcements; FR / AR switch; install prompt.
- **Key tests:** after a handover the new owner sees none of the previous owner's receipts; an owner cannot read another lot by changing an id; declared payment stays pending until validated.

### F11. AI connectivity: WhatsApp agent, MCP, API (Module 11)

- **Controllers:** `Webhooks\WhatsAppWebhookController` (verify + receive + status updates), `Admin\WhatsAppInboxController` (staff takeover), `Admin\ApiKeyController`, `Admin\ApprovalController`, `Admin\ApiAuditController`, `Api\V1\*` (residences, owners, dues, payments, unpaid), MCP server endpoint.
- **FormRequests:** `ApiKeyRequest` (name, abilities, residence scope, expiry), `WhatsAppWebhookRequest`, `ApprovalDecisionRequest`, tool-input validation per MCP tool.
- **Policies:** `ApiKeyPolicy` (super admin), `ApprovalPolicy` (reviewer ≠ requester).
- **Services:** `ApprovalService`, `ApiKeyService` (hashed, shown once, revocable), `WhatsAppClient`, `AgentToolRegistry` (read tools query views only; write tools such as "send reminders" create `approval_requests`), `ConversationService` (identify owner by phone, ask "which lot?", handoff to staff).
- **Jobs:** `ProcessIncomingWhatsAppMessage`, `SendWhatsAppMessage` (retry with backoff).
- **Frontend:** WhatsApp inbox (conversation list, thread, **take over** button, handoff badge); API keys screen (abilities checklist, residence scope, key shown once, revoke); **approvals inbox** (what will happen, approve / reject); API audit log table with filters.
- **Key tests:** unknown phone number gets a safe answer; an agent tool cannot read another owner's data; write tool creates a pending approval, never executes; revoked key fails immediately; signature check rejects forged webhooks; every call is logged.

### F12. Showcase website (Module 12)

- **Public controllers:** `HomeController`, `ServicesController`, `ReferencesController`, `AboutController`, `ContactController`, `QuoteRequestController`, `SitemapController`.
- **Admin controllers:** `SitePageController` (editable content), `SiteReferenceController`, `InquiryController`, `SiteSettingsController`.
- **FormRequests:** `ContactRequest` (honeypot + throttle), `QuoteRequest` (details), `SitePageRequest` (fr + ar), `ReferenceRequest`.
- **Services:** `InquiryService` (store + email the team), `SeoService`, `SitemapService`.
- **Frontend:** Blade SSR pages with hreflang fr / ar, RTL, mobile-first, link to the owner login; admin CMS with FR / AR tabs, rich-text editor and image upload; inquiries inbox with status.
- **Key tests:** sitemap lists both languages; honeypot blocks bots; quote request reaches the inbox and email.

### F13. Documents (shared)

- **Controllers:** `DocumentController` (list, filter, download, upload, version history), `DocumentTemplateController` (edit templates per type and language), `DocumentVerifyController` (public).
- **FormRequests:** `UploadDocumentRequest` (type, owner or lot or residence, file mimes and size), `StoreTemplateRequest` (required placeholders present).
- **Policies:** `DocumentPolicy` (locked documents cannot be edited or deleted; owner documents scoped by `owner_id`).
- **Services:** `DocumentGenerator` (versioning, supersede, checksum, lock), `DocumentDeliveryService`, `TemplateRenderer`.
- **Frontend:** documents library (filters type, residence, owner, period), version history drawer, upload dialog, delivery status (sent, opened, failed), template editor with placeholder helper and preview in FR / AR.
- **Key tests:** regeneration creates version + 1 and supersedes the old row; locked document refuses edit; owner-bound document invisible to another owner.

### F14. Dashboards and comparisons

- **Controllers:** `DashboardController` (home), `ResidenceDashboardController`, `BenchmarkController`.
- **FormRequests:** `DashboardFilterRequest` (residence, building, period, account codes).
- **Policies:** `DashboardPolicy`; `benchmarks.view` returns **aggregates only** for residences the user is not assigned to.
- **Services:** `ChargeTrendService` (spending by month, account, building), `BudgetComparisonService`, `ComplaintStatsService`, `CollectionStatsService`, `BenchmarkService` (cost per lot / per m² / per tantième, grouped by standard account code).
- **Frontend:** home dashboard (collection rate for owners and for the promoteur shown separately, sales progress, unpaid total, open complaints, pending approvals, pending declared payments); residence dashboard with period picker and building filter; trend line charts; **comparison view** (choose residences, account code, period, normalisation); CSV export of the chart data.
- **Key tests:** building view uses splits only, common expenses appear as "common"; benchmark never returns detail rows of other residences.

### F15. Audit, trash, approvals, settings, imports

- **Controllers:** `AuditLogController`, `TrashController` (list by model, restore), `ApprovalController`, `SettingsController` (company info, banks, complaint types, deletion-approval toggle, WhatsApp, templates), `ImportBatchController`, `NotificationController`.
- **FormRequests:** `RestoreRequest`, `SettingsRequest`, `ApprovalDecisionRequest`.
- **Policies:** `AuditPolicy` (`audit.view`), `TrashPolicy` (`trash.restore`; permanent delete super admin only), `SettingsPolicy`.
- **Services:** `TrashService`, `ApprovalService`, `DeletionService` (decides direct delete vs approval request), `SettingsService`.
- **Frontend:** audit log table (who, what, when, old → new, filter by model / user / date); trash screen with restore; approvals inbox; settings tabs; import history with errors; notification bell.
- **Key tests:** an assistant's delete creates an approval for his syndic, approval deletes (soft), restore brings back; approval cannot be self-approved; audit row for every update.

---

## 4. Build order and calendar

The CDC promises **5 weeks** (frontend → backend → test → delivery). Building in **vertical slices** (screen + logic together) is safer than a separate frontend phase. Honest note: 12 modules + WhatsApp agent + MCP + showcase site in 5 weeks is tight for one developer, so the order below puts the money-critical core first and the integrations last.

| Week | Scope | Exit criteria |
|---|---|---|
| **1** | Foundation: design system, RTL, PDF engine proof (Arabic quitus), F0 auth + roles + staff invitations + owner activation (single and bulk) + middleware, F1 residences / lots + CSV import, F2 owners + owner logins + basic handover (the quitus gate comes in week 2). **Start WhatsApp Business verification and template approval.** | Create a residence, import lots and owners, an owner can activate a login |
| **2** | F3 contributions + dues, F4 payments + allocation + receipts, portal skeleton (F10 dashboard, dues, receipts), public access-request form + syndic inbox, lot transfers + sale quitus gate (they need dues and payments), sale-status badge and building board | A payment settles several dues and a receipt reaches the owner |
| **3** | F5 budgets + expenses, F6 treasury, F7 collection + month-end reminders, F13 documents + deliveries | Unpaid report, reminder run, formal notice, lawyer list |
| **4** | F8 complaints, F9 assemblies / quitus / reports / announcements, rest of F10 portal, F14 dashboards, F15 audit / trash / approvals | Full back-office usable end to end |
| **5** | F11 WhatsApp agent + MCP + API, F12 showcase site, hardening, data migration rehearsal, training, go-live | All CDC documents generated, demo accepted |

If time slips, **defer in this order:** MCP tools beyond read-only, benchmarks, WhatsApp inbox takeover UI, showcase CMS (ship static content first). Never defer: allocation, receipts, audit, backups.

---

## 5. Testing strategy (Pest)

| Layer | What |
|---|---|
| Unit | `DueGenerator` rounding, `ContributionCalculator` (fixed / tantième), `AllocationService`, `VoteTallyService`, `Money`, enum helpers |
| Feature | Every FormRequest (valid / invalid), every Policy (super admin, syndic in scope, syndic out of scope, assistant with and without a grant, owner), HandOverLot, payment cancel recompute, imports with dry run, document versioning and lock, approval workflow, API key abilities, WhatsApp signature |
| Security | Owner account vs staff routes, ID tampering in the portal, residence scope leaks, CIN masking, rate limits |
| Browser (Pest + Playwright or Dusk) | Payment entry, import wizard, handover wizard, portal on a phone viewport, FR and AR (RTL) smoke tests |
| Data | Seeders: 2 residences, 3 buildings, 60 lots, 50 owners, a year of dues and payments, for demos and dashboards |

Definition of done per feature: routes + FormRequest + Policy + Service + screen + tests + FR/AR strings + audit entries.

---

## 6. OpenSpec change list (one change per item, in order)

1. `foundation-design-system-i18n-rtl`
2. `auth-roles-middleware-permission-matrix`
3. `residences-buildings-lots-csv-import`
4. `owners-ownership-owner-logins-handover`
5. `access-requests-and-account-initialization`
6. `lot-transfers-and-sale-quitus-gate`
7. `sale-status-and-building-board`
8. `owner-file-and-cin-search`
9. `contributions-dues-fund-calls`
10. `payments-allocation-receipts`
11. `owner-portal-core`
12. `budgets-accounts-expenses`
13. `treasury-statements`
14. `documents-templates-deliveries`
15. `collection-reminders-formal-notices-lawyer-list`
16. `complaints-and-portal-complaints`
17. `assemblies-votes-quitus-reports-announcements`
18. `dashboards-and-benchmarks`
19. `audit-trash-approvals-settings`
20. `whatsapp-agent`
21. `mcp-server-and-api-keys`
22. `showcase-website-and-cms`
23. `hardening-backup-migration-go-live`

---

## 7. Risks to settle early

| Risk | Why it matters | Action |
|---|---|---|
| Account takeover through the request form | A CIN is not secret and lot numbers are guessable | Activation link only to a contact on file or one verified by code and confirmed by the syndic; throttles; a new owner is never approved without the transfer wizard |
| First-sale rules not final | The sale contract content and requirements are still to come | Requirements live in one `TransferRequirements` config; the contract is a document plus three nullable fields (open decision 7) |
| Promoter-held unsold lots | Without an owner they have no one to bill or remind | `residences.promoter_owner_id`, excluded from activation, billing confirmed with the client (open decision 6) |
| Arabic PDF rendering | Quitus, convocation and PV must be correct in Arabic | Prove Browsershot or mPDF with a real Arabic template in week 1 |
| WhatsApp templates | Reminders outside the 24h window need approved templates; approval takes time | Submit templates in week 1 (reminder, receipt, convocation, announcement) |
| Open business decisions | Arrears on sale, indivision billing, opening balances, optional per-m² mode, what assistants may be delegated | Close with the client before weeks 2 and 3 (see section 9 of the database file) |
| Scope vs 5 weeks | Integrations are the least critical part for daily operations | Follow the deferral order in section 4 |
| Data quality at import | Bad CSVs create bad dues | Dry run + preview + one transaction per file, rehearse the migration in week 5 |
