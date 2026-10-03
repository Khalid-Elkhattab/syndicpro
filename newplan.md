# SyndicPro — Convergence Plan (current → docs/do target)

## Build log — Paramètres + Juridique + Transfert sans quitus (2026-10-03, vérifié par exécution)

Backend **90/90 Pest green** (327 assertions), frontend `tsc + vite build` green, eslint clean, pint clean.
* Migration `000013` : table `document_types` + `lawyer_cases.case_kind/motif/transfer_id` + élargissement legacy `role` (MySQL ENUM + rebuild sqlite).
* Paramètres syndic : réglages typés (`SettingService`), types de documents personnalisés, téléversement par résidence (`DocumentService` : numérotation, checksum), assistants + matrice de privilèges spatie avec périmètre (résidences + permissions détenues).
* Transfert sans quitus : option « Sans quitus » + motif obligatoire → `LawyerCase` auto (`no_quitus_transfer`, affiché « Aucun »), permission `owners.handover_override` exigée pour tout contournement.
* Juridique : impayés avec motifs auto (seuils réglables), transferts sans quitus, dossiers avocat (nature + motif + workflow), escalade manuelle.
* Groupe `syndic` ouvert aux rôles `syndic,assistant,super_admin` (CheckRole multi-rôles) ; nav filtrée par permissions ; `UserResource` expose rôles + permissions.
* Durcissement restant (phase 2) : gating par permission des endpoints historiques (ils restent accessibles à tout staff authentifié).

## État de conformité docs/do (2026-10-03, vérifié par exécution)

Backend **71/71 Pest green** (194 assertions), frontend `tsc + vite build` green,
`migrate:fresh --seed` green. Schéma cible §§4.1–4.13 appliqué ; legacy FR conservé
en miroir jusqu’au cutover.

| Spec | État |
|---|---|
| §1 décisions (dues cache, allocations, ownerships, 1 login/lot, residence_id partout, decimal, snapshots, soft-delete/annulation, approval unique, JSON fr/ar) | ✅ schéma + services ; §6 règles 1–3, 9–11, 13–15, 18–19, 21–22, 25 testées |
| §2 ER | ✅ tables + relations Eloquent |
| §3 enums + HasLabel | ✅ ~50 enums, labels FR natifs + AR, `PaymentMethod::requiresDocumentNumber()` |
| §4.1 users/scope/lookups | ✅ (email/password nullable reportés — requiert doctrine/dbal) |
| §4.2 residences/buildings/lots/annexes | ✅ + CSV import (dry-run/commit, logins, promoteur) |
| §4.3 owners/ownerships/promoteur + §4.3b logins/assignments/account_events (append-only) | ✅ |
| §4.3c access requests + matching (exact/promoteur/no-owner/resale/not-found) | ✅ schéma + service (endpoints publics/inbox : prochaine étape) |
| §4.4 contributions/dues + prorata + plus-fort-reste + snapshots | ✅ + `lot_balances` view |
| §4.5 banks/payments/allocations + oldest-first + crédit | ✅ (flux legacy `paiements` intact) |
| §4.6 budgets/expenses (+contrainte intervention=0 hors sqlite)/splits + §4.7 treasury | ✅ schéma |
| §4.8 documents/templates/deliveries | ✅ schéma (générateur PDF : prochaine étape) |
| §4.9 collection + §4.10 complaints cibles + §4.11 assemblies/votes/quitus/transferts/annonces | ✅ schéma + `LotTransferService` + `QuitusService` |
| §4.12 approvals/api_keys/audit/whatsapp/imports + §4.13 site/settings + §4.14 activitylog | ✅ schéma + package installé et migré |
| §5 modèles/relations/casts + §7 ordre | ✅ |
| Prochaines étapes (couches F) | endpoints/écrans : publish contributions, wizard transfert, inbox access-requests, documents, WhatsApp/MCP, vitrine ; invitations staff ; init en masse |

> Source of truth for schema/rules: `docs/do/Syndic_Database_Structure.md` (v2).
> Build order reference: `docs/do/Syndic_Implementation_Plan.md` (adapted here from Livewire to React+API).
> Current stack (kept): Laravel 13 API (`syndicpro-api/`) + React 19 SPA (`syndicpro-front/`).
> Frontend language: French (later FR/AR). DB + Eloquent: English target names.

## 0. Locked decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Keep React + API. No Livewire rewrite.** | ~15 pages already work (dashboard, résidences, cotisations, paiements, réclamations both roles). React 19 + Vite + TS + react-query/zustand/router/hook-form/zod/recharts already wired with Sanctum SPA auth. The DB spec is stack-agnostic; the Implementation Plan only *assumes* Livewire. Module 11 (WhatsApp agent + MCP + API keys) requires a stateless API anyway — Livewire cannot serve it. Rewrite cost >> benefit; lose SPA cache/skeletons/code-splitting, PWA shell, mobile reuse. |
| D2 | **DB + models = English target names. UI = French.** | `buildings/lots/owners/contributions/dues/payments/complaints/expenses` in DB; UI shows Immeubles / Appartements-Lots / Copropriétaires / Cotisations / Paiements / Réclamations via enum `HasLabel` + `lang/fr` + `lang/ar`. API Resources return `value + label`. React routes/text stay French. |
| D3 | **Foundation first, then fix pass, then slices.** | No money logic before the `dues + allocations` contract and `ResidenceScope` exist. Fix `PROJECT_STATUS.md` P0–P3 only after foundation is green. |
| D4 | **`lots` = single unit table for ALL property types.** Not just appartements. Current `appartements` (numero/etage/immeuble/residence/coproprietaire/tantieme, no type/surface) becomes legacy; every row ports to `lots(type=apartment)`. New types created directly in `lots`. |
| D5 | **Money = decimal, never float. Balance never stored.** Balance = Σ dues − Σ validated allocations via `lot_balances` view; `dues.amount_paid/status` is a cache written only by `DueSettlementService`. |

### FR → EN map (DB renames, UI unchanged)

| Old (FR) | New (EN target) | UI still shows |
|---|---|---|
| `immeubles` | `buildings` | Immeubles |
| `appartements` | `lots` + `lot_annexes` | Appartements / Lots (label by type) |
| `users` where `role=coproprietaire` | `owners` + `owner_phones`/`owner_emails` + `lot_ownerships` | Copropriétaires |
| `users` where `role=syndic` | `users` `type=staff` + Spatie roles | Syndic / Assistants |
| `cotisations` + `cotisation_details` | `contributions` + `contribution_lots` + `dues` | Cotisations |
| `paiements` | `payments` + `payment_allocations` | Paiements |
| `reclamations` | `complaints` + `complaint_messages` | Réclamations |
| `depenses` / `hors_budgets` / `comptes_charges` / `sous_charges` | `expenses` / `budgets` + `budget_lines` / `budget_accounts` | Charges & Dépenses / Budget |
| `periodes` / `budgets` | `fiscal_years` / `budgets` | Périodes / Budget prévisionnel |
| receipts `recu_path`, invoices `justificatif_path` | `documents` + `document_deliveries` + medialibrary | Reçus / Justificatifs |
| — (missing) | `treasury_statements`, `bank_accounts`, `collection_actions`, `lawyer_cases`, `assemblies/*`, `quitus_certificates`, `lot_transfers`, `announcements`, `approval_requests`, `api_keys`, `api_audit_logs`, `whatsapp_*`, `import_batches`, `account_requests`, `lot_account_assignments`, `account_events` | New screens |

---

## 1. Phase 0 — Foundation (migrations + models + enums + scope)

Goal: `php artisan migrate:fresh --seed` green on target base. Old FR tables untouched (read-only) until §10 cutover.
Conventions: `$t->audit()` = `created_by/updated_by → users nullOnDelete`; `ST` = timestamps + softDeletes; money `decimal(12,2)`, tantième `decimal(14,4)`; status/type columns = `string` + PHP enum cast (never DB enum).

### 1.1 Enums — `app/Enums/` string-backed + `HasLabel`

```php
trait HasLabel {
  public function label(): string { return __('enums.'.static::class.'.'.$this->value); }
  public static function options(): array { ... }
}
```

Port all of DB spec §3: `LotType, ParkingStatus, AnnexType, FiscalYearStatus, OwnerType, OwnershipChangeReason, ContributionType, CalculationMode, ContributionStatus, DueStatus, PaymentMethod(+requiresDocumentNumber), PaymentStatus, PaymentSource, AllocationMode, BudgetType, BudgetKind, BudgetStatus, ExpenseKind, ExpenseStatus, TreasuryStatus, CollectionActionType, NotificationChannel, DeliveryStatus, LawyerCaseStatus, ComplaintStatus/Source/Priority, AuthorType, AssemblyType/Status, AttendanceType, MajorityRule, ResolutionResult, VoteChoice, DocumentType/Source/Status, AnnouncementKind, DocumentVisibility, ArrearsOnSale, UserType, StaffRole, AccountRequestStatus, AccountMatchResult, SaleStatus(computed), QuitusPurpose/Status, AccountStatus, AccountEventType, ActorType, ApprovalAction/Status, ApiChannel, ConversationStatus, MessageDirection, InquiryType/Status, SequenceType`. Replaces the 6 current enums. Labels in `lang/fr/enums.php` + `lang/ar/enums.php`. Requests use `Rule::enum()`.

`LotType` (critical — lots are NOT just appartements):

```php
enum LotType: string { use HasLabel;
  case Apartment='apartment'; case Duplex='duplex'; case Shop='shop';
  case Office='office'; case House='house'; case LargeSurface='large_surface'; case Other='other'; }
```

FR labels: apartment→Appartement, duplex→Duplex, shop→Magasin/Commerce, office→Bureau, house→Villa/Maison, large_surface→Grande surface, other→Autre. Import aliases: `appartement→apartment, magasin/commerce→shop, bureau→office, villa/maison/pavillon→house, grande surface→large_surface`.

### 1.2 Users delta — `users` becomes single auth table (`type=staff|owner`)

Current (`000001_create_users_table` + `Models/User.php`): `role ENUM(syndic,coproprietaire)`, `username unique`, no `type/lot_id`. Alter in this order (after lots+owners exist for FKs; code must tolerate both columns during transition):

Add: `type default 'staff'` (UserType), `username nullable unique` (owner login e.g. `JARD1-B-A12`; staff keep email login), `email nullable`, `password nullable` (null until activation), `status default 'active'` (AccountStatus), `phone nullable`, `locale(2) default 'fr'`, `is_active bool`, `can_access_all_residences bool false` (super_admin only), `supervisor_id→users nullOnDelete` (assistant→syndic), `created_by_id→users`, `last_login_at`, `lot_id nullable unique → lots` (owner account→lot, staff null), `current_owner_id nullable → owners`, `activation_token_hash nullable`, `activation_expires_at`, `password_set_at`, `failed_attempts tiny default 0`, `locked_until nullable`, softDeletes (already). Keep legacy `role` until Auth cutover (§3), then drop.

Rules (service/form-request, §6 rules 18–19): `type=owner` requires `lot_id+username`, has NO Spatie role; `type=staff` requires email + exactly one `StaffRole`; assistant requires `supervisor_id` → active syndic. Model rule rejects role assignment to owner accounts. Staff list screens always `where type=staff`.

### 1.3 Scope + policy + shared base

* `ResidenceScope` global scope on every `residence_id` model (limits to `auth()->user()->residences` unless `can_access_all_residences`; owner accounts scoped by `lot_id` + ownership period — §6 portal visibility).
* `AuthorizesResidence` policy trait: `before()` super_admin pass / owner deny staff policies; every method checks `can('<module>.<action>')` + `model->residence_id` in assignments. Deletes for non-admins → `approval_requests(action=delete)`, never direct.
* Middleware: `EnsureStaff (/admin/*)`, `EnsureSupervisorActive`, `ThrottleAccessRequests`, `EnsureOwnerAccount (/portal/*)`, `SetLocale (dir=rtl for ar)`, `ResidenceContext` (top-bar switcher), `ThrottleLogins`, `EnsurePasswordIsSet`, `VerifyWhatsAppSignature`, `AuthenticateApiKey`, `EnsureApiAbility`, `ApiRateLimit`, `LogApiCall`, `ResponseCache` (public site).
* Support: `Money` helper (no floats), `NumberSequenceService` (`lockForUpdate` gap-free), `AccountEventLogger`, `DocumentGenerator`, `DocumentDeliveryService`, `NotificationService`, `ApprovalService`, `ExportService`, `OwnerAccountService`.
* Packages to add: `spatie/laravel-activitylog` (audit), `maatwebsite/excel` (import/export), Browsershot or mPDF for PDF (**not dompdf** — Arabic RTL/shaping must be proven week 1 with a real quitus template), Scramble/Scribe (API docs). Already present: `spatie/permission`, `spatie/medialibrary`, Sanctum.

### 1.4 Residences / buildings / lots (+ annexes, fiscal years, lookups)

```php
residences: code(12) unique, name, syndicate_name, city, address, calculation_mode, arrears_on_sale default seller_pays, quitus_validity_days default 30, total_tantiemes nullable, fiscal_start_month default 9, currency MAD, letterhead/logo paths, legal_info json, is_active + audit/ST
residence_user: residence_id + user_id unique
fiscal_years: residence_id, name (2026/2027), starts_on, ends_on, status + unique(residence,starts_on)
banks: name unique, short_code, is_active
suppliers: name, category, phone, email, ice, address, notes, is_active + ST
number_sequences: residence_id nullable, type (SequenceType), year, last_number + unique(residence,type,year)
buildings: residence_id, number (A,B,12...), label nullable, floors nullable + unique(residence,number) + ST
lots: residence_id, building_id, number (N° local), type (LotType), surface nullable, tantieme default 0, land_title_no nullable indexed (warn on dup, not unique), parking_status default no, has_box false, floor nullable, notes, is_active, archived_at + audit/ST + unique(building,number) + index(residence,type)
lot_annexes: lot_id, type (AnnexType parking|box), number + unique(lot,type,number)
```

**Lot model — casts / accessors / mutators (mandatory, all lot types):**

```php
// casts()
'type' => LotType::class, 'surface' => 'decimal:2', 'tantieme' => 'decimal:4', 'is_active' => 'boolean'
// accessors (appended in API Resource, never stored)
getDisplayLabelAttribute(): "Magasin M3 — Bât. B (42 m²)" / "Appt A12 — Bât. B"
getTypeLabelAttribute(): LotType->label() // FR/AR via HasLabel
getSaleStatusAttribute(): 'unsold'|'sold' // computed: currentOwnership owner == residences.promoter_owner_id ? unsold : sold
getIsUnsoldAttribute(): bool
getTransferPendingAttribute(): bool // open account_requests (submitted/needs_info) OR valid sale quitus
getQuorumWeightAttribute(): tantieme // assembly vote weight
// mutators
setNumberAttribute($v): trim($v)
setLandTitleNoAttribute($v): strtoupper(trim(preg_replace('/\s+/', '', $v ?? '')))
// scopes: active(), byResidence(), byBuilding(), byType(LotType), sold(), unsold(), search()
// relations: residence, building, annexes, ownerships, currentOwnerships()->whereNull('ended_on'),
//   ownerLogin()->hasOne(User::class,'lot_id')->where('type','owner'),
//   dues, payments(via lot_id), complaints, transfers
```

Fixed-mode grid matches on `lot_type + surface range` — every type must be classifiable (§6 rule 15: zero-or-multiple matches block publish and list lots in error). Status badges always icon+text+colour (`sale-badge`, `building-board` floor grid coloured by `sale_status`, hover owner/type/surface, click→lot).

### 1.5 Owners + ownership + promoter

```php
owners: type individual|company, first_name/last_name/company_name, identity_number nullable indexed (CIN/RC, normalised upper no-spaces; NOT DB-unique — service find-or-create links duplicates), preferred_locale fr, internal_notes + audit/ST
owner_phones: owner_id, number(20) E.164 indexed, is_whatsapp, is_primary + unique(owner,number)
owner_emails: owner_id, email, is_primary + unique(owner,email)
lot_ownerships: lot_id, owner_id, share_percent default 100, is_billing_contact true, started_on, ended_on nullable (null=current), change_reason + audit + unique(lot,owner,started_on) + index(owner,ended_on). Service rule: Σ current shares per lot = 100.
residences.promoter_owner_id → owners nullOnDelete (company promoteur; at import every ownerless lot assigned to him reason initial; first sale = transfer reason promoter_sale → full chain promoteur→buyer→resales).
```

### 1.6 Account history + access requests

```php
lot_account_assignments: user_id (owner login), lot_id, owner_id, lot_ownership_id nullable, started_at, ended_at nullable (null=current), end_reason, initialised_by→users + index(user,ended_at),(owner,ended_at)
account_events: APPEND-ONLY — user_id, owner_id nullable, event, actor_type, actor_user_id nullable, ip(45), user_agent, meta json, created_at only (no updated_at/softDeletes; model throws on update/delete or DB trigger) + index(user,created_at),(event,created_at)
phone_verifications: phone E.164 indexed, purpose='access_request', code_hash, attempts default 0 (lock at 5), expires_at 10min, verified_at, ip
account_requests: reference unique (sequence request), residence_id, building_input, lot_input (verbatim), lot_id nullable, matched_owner_id nullable, match_result (AccountMatchResult), full_name, identity_number indexed normalised, phone E.164, email nullable, locale, message, phone_verified_at, status default submitted, review_note, rejection_reason, contact_confirmed false, documents_checked false, reviewed_by/at, approved_user_id→users, activation_channel, activation_sent_at, ip, ua, expires_at 30d (no softDeletes — audit) + index(residence,status),(lot,status). Media collection "proof" (ID/acte/attestation).
```

Exit criteria §1: fresh migrate + seed (2 residences, 3 buildings, 60 lots mixed types incl. shops/offices/duplex, promoteur + 50 owners + year of dues/payments) green; Pest `foundation` suite green; Arabic PDF proof printed.

---

## 2. Phase 1 — Fix pass (after §1 green, before features)

Apply `PROJECT_STATUS.md` backlog against the new base (old code paths unless already ported):

* P0: `ReclamationRepository::findByCoproprietaires()` missing → 500 copro reclamations; `RapportController` GROUP BY (`paiements.*` vs `mode_paiement` — use `selectRaw(mode, SUM)` + `->get()->pluck`); `Coproprietaires/ReclamationController:63` `coproprietaires`→`coproprietaire`.
* P1: `nb_immeubles/nb_appartements` 0 (use `withCount` or compute from eager load); queue mismatch (`QUEUE_CONNECTION=database` vs supervisor `redis` — align + restart; receipts stuck "En cours"); double `+` empty state; immeubles table residence name.
* P2: redundant calls (Rapports 10, Paiements 7 incl. `residence_id=0`, Cotisations 7, dedup `residences` fetch, React Query key unification, `per_page` defaults, cache dashboard/totals, wire reclamation pagination).
* P3: create `cotisations:generate-monthly` (or new `dues:generate-monthly` post-cutover), apply `EnsureResidenceOwnership` (`residence.owned`) in `api.php`, signed middleware audit (syndic `download-recu` already signed — verify copro too), lucide icons in copro sidebar.

---

## 3. F0 — Auth, roles, staff, owner activation, access requests

* API: `POST /auth/staff/login (email)`, `POST /auth/owner/login (username)`, `POST /auth/activate/{token} → set password`, `POST /auth/password/*`; `/admin/staff (invite/edit/suspend, syndic scoped to supervisor_id=him)`, `/admin/permissions-matrix`, `/admin/owner-accounts/initialize|bulk|suspend|reset`, public `POST /portal/request-access`, `POST /portal/phone/send|verify`; `/admin/access-requests (inbox/review/approve|needs_info|reject)`.
* Requests: `StaffLoginRequest, OwnerLoginRequest, SetPasswordRequest (single-use hashed token, strong pw), InviteStaffRequest (role/residences/permissions ≤ creator, ceiling), UpdateStaffRequest (no last-super-admin demote; no suspend syndic with assistants), InitializeOwnerAccountRequest, SendPhoneCodeRequest, VerifyPhoneCodeRequest, SubmitAccessRequestRequest (CIN normalised, E.164, verified code, proof limits, honeypot), ReviewAccessRequestRequest (non-exact matches only via transfer wizard; needs documents_checked+contact_confirmed)`.
* Policies: `UserPolicy` (super_admin all; syndic only assistants he supervises; assistant none), `OwnerAccountPolicy`, `AccessRequestPolicy (account_requests.review + residence scope)`.
* Services: `StaffAccountService, PermissionDelegationService (ceiling), OwnerAccountService (issueActivation/bulkIssue/reset/suspend, username CODE-B-NUM), AccessRequestService (submit/match/approve), PhoneVerificationService, AccountEventLogger`.
* Jobs/events: `SendActivationLinkJob` (WhatsApp template + email fallback), `SendStaffInvitationJob`, `ExpireAccessRequests/ActivationLinks` daily; `AccessRequestSubmitted → notify syndic`, `AccountActivated`.
* React: 2 logins FR/AR + forgot + activation; staff list (chips invited/active/suspended, resend); public request page mobile-first 4 steps (lot→identity→phone code→generic confirm) + "add another lot"; inbox (badge, filters residence/status/match, side-by-side record vs filing + proof preview + match banner + Approve-and-send-link / Needs info / Reject / Create-owner / Start-transfer); bulk-init tab per residence (`owned by promoter` excluded, `no owner/no contact/ready/link sent/active`, select ready → queued send + report).
* Tests: hierarchy/ceiling, owner↔admin isolation, pending cannot login, lockout N fails, single-use expiring hashed link, generic public responses, promoter/different-owner only via wizard, throttle, one link + event logged, staff screen never lists owners.

## 4. F1 — Residences / buildings / lots + CSV import + sale board

* API: `ResidenceController, BuildingController, LotController, LotAnnexController, LotImportController (upload→preview→commit), LotExportController, TantiemeCheckController`.
* Requests: `Store/UpdateResidence (code unique, modes), StoreBuilding, Store/UpdateLot (LotType enum, surface≥0, tantieme≥0, unique building+number, annex arrays), ImportLotsRequest (csv/xlsx size), ArchiveLotRequest`.
* Policies `Residence/Building/LotPolicy` (archive=`lots.update`; delete via approval). Services `ResidenceService, LotService (lot+annexes+owner login), TantiemeControlService (Σ lots == residences.total_tantiemes), LotImportService (dry-run+upsert+1 tx), LotExportService, SaleStatusService (computed + pending tag + counts + tantième share)`. Events `LotCreated→login; LotArchived→close login`.
* Import columns (§6): `building, lot_number, type (+FR aliases), surface, tantieme (required tantieme mode), land_title_no (dup=warning), parking (yes|no|common), parking_numbers (P1|P2), box/box_numbers`. Per row: find/create building → upsert lot (building+number, re-import updates) → annexes → create `users(type=owner, username=CODE-B-NUM, pending_activation)` → assign promoteur if no owner (`initial`). Dry-run preview → commit 1 tx/file; invalid row rolls back; unknown type/negative/reject; post-commit tantième check; never hard-delete (missing lot flagged only).
* React: residence list + detail tabs (overview **sales-progress card** lots+tantièmes, buildings cards + mini bar + Not sold/Partial x/y/Fully sold + chips, lots, building-board, tantième banner OK/mismatch, settings); lots table (filters residence/building/type incl. shop/office/duplex, search); lot form (type select with FR labels, surface/tantieme/title/parking/box repeaters); lot detail (ownership + payment history); import wizard (upload→preview warnings→commit + row-error table).
* Tests: dry-run no-op, re-import upsert no dup, invalid rolls back, tantième gate, login per lot with correct username + correct `type` label.

## 5. F2 — Owners, ownership, owner file, transfers, sale quitus

* API: `OwnerController (index/show=file/create/edit), OwnerSearchController (CIN/name/phone/email/lot ref), LotOwnershipController (assign/indivision), LotTransferController (wizard from lot or request), LotHistoryController (staff timeline), QuitusController (issue/cancel/PDF), OwnerAccountController (reset/suspend/reactivate/resend), OwnerImport/Export, OwnerContactController (logged WA/call/mail links)`.
* Requests: `Store/UpdateOwner (CIN/RC normalised, one primary phone + WA flag), AssignOwner (shares=100), TransferLotRequest (new|existing owner, effective_on ≥ current start, quitus_id required unless override_reason + permission owners.handover_override, proof file; sale_contract required if promoter_sale), IssueSaleQuitusRequest (lot+outgoing owner, overdue 0), ResetAccountRequest, ImportOwnersRequest`. Rules `UniqueIdentityNumber (link not dup), E164Phone`.
* Policies: `OwnerPolicy (≥1 residence access; owners.view_identity for full CIN), LotOwnership/OwnerAccount/LotTransferPolicy (owners.handover; override owners.handover_override), QuitusPolicy`.
* Services: `OwnerService (find-or-create by CIN, merge), OwnershipService, LotTransferService::run(lot,newOwner,effectiveOn,reason,quitus,override,request)` → `HandOverLot` 8-step tx (close ownership `ended_on=effective−1d` + open new; close/open assignment; login `password=null, pending_activation, current_owner_id=new`, new hashed token 7d; revoke sessions/remember/Sanctum tokens; events reset/sessions_revoked/handed_over/link_issued; send link to confirmed contact; reassign `dues.owner_id where period_start ≥ effective_on` (month in progress stays seller); insert `lot_transfers` + quitus `used` + request `approved`), `QuitusService (issue/expire/consume)`, `LotHistoryService`, `OwnerSituationService`, `OwnerImportService`.
* `lot_transfers`: residence, lot, from/to owners (promoteur for first sale), effective_on, reason, quitus_id, balance_at_transfer, quitus_overridden + reason, account_request_id, closed/opened_ownership_id, performed_by, contract_document_id (`documents sale_contract`, mandatory promoter_sale) + contract_reference/signed_on placeholders (open decision 7), notes. Never updated/deleted. Sale contract doc `documentable=LotTransfer, owner=buyer`.
* React: global CIN search; owner file (identity/contacts/notes, props current+past with type badges for shop/office/…, situation per lot + total due/paid/remaining/overdue/credit/oldest/last-pay, dues month-by-month + settling payment, payments, reminders, complaints, docs, account panel, Generate statement); owner form repeaters; 6-step transfer wizard (1 lot+outgoing+balance/quitus state; 2 quitus pick-or-issue now, blocked if >0 — promoteur shortcut "record payment for this lot" preselects overdue; 3 incoming from request|existing|create; 4 effective date default 1st next month + proof + sale contract mandatory if promoteur; 5 summary + override section (permission only); 6 confirm + link status); lot history timeline (ownerships, quitus/balance/override/proof, period dues/payments, reminders/lawyer, complaints, docs, login+security events).
* Privacy: staff only lot residence; CIN masked `AB•••45` without permission; every file/history view logged; new owner never sees prior owner's receipts/payments/complaints/contacts; seller login dies at transfer; other lots unaffected.
* Tests: no CIN dup; transfer closes/opens/resets/revokes/events/row; blocked without valid (expired/used) quitus or balance>0 at transfer; override needs perm+reason logged; promoter_sale blocked without contract/quitus; dues split rule 25; isolation; staff-only history; indivision 100.

## 6. F3 — Contributions/dues/fund calls + F4 payments/receipts

* F3 API: `ContributionController, ContributionPreviewController (simulation), ContributionPublishController, FundCallController (per owner/residence PDF), ContributionTableExportController`. Requests `Store/UpdateContribution (period, type, mode; annual_budget if tantieme; fixed rows no overlap; buildings if exceptional partial), PublishContribution (tantième OK; every lot matches exactly one fixed rate)`. Policy `ContributionPolicy (contributions.publish; published+payments → cancel only)`. Services `ContributionCalculator (fixed lot_type×surface / tantieme coeff=budget/Σtantiemes), DueGenerator (day prorata + largest-remainder exact), ContributionPublisher (snapshot tantieme+coeff → contribution_lots annual+monthly display → dues 1/lot/month amount/owner/due_date/status cache), FundCallGenerator, DueSettlementService`. Job `GenerateDuesJob` (big residences). React: mode switch (fixed grid editor / tantieme budget→coeff preview), live per-lot preview + total check, publish confirm, detail per-lot paid/partial/unpaid chips + % collected, fund-call PDF + Excel.
* F4 API: `PaymentController, PaymentAllocationController (manual), PaymentValidationController (approve/reject declared), PaymentCancelController, ReceiptController (dl/resend), Public ReceiptVerifyController (/verify/{token})`. Requests `StorePayment (chain residence→building→lot→owner auto; method enum; document_number if method->requiresDocumentNumber(); bank if cheque/effet; amount>0; manual Σ ≤ amount), CancelPayment (reason), Validate/RejectDeclared, DeclarePayment (portal: proof/amount/date/method)`. Policy `PaymentPolicy (payments.validate/cancel; validated immutable except notes — fix via cancel+new)`. Services `PaymentService (record/validate/cancel), AllocationService (auto oldest period_start ASC across owner's lots, leftover=credit; manual), DueSettlementService, ReceiptService (number_sequences receipt on validated + QR)`. Events `PaymentValidated→GenerateDocumentJob→WA/email; PaymentCancelled→recompute`. React: entry form (chain, auto owner+balance, conditional doc/bank, allocation preview editable), list filters, detail (allocations, receipt btn, cancel reason dialog), declared inbox (proof preview approve/reject), verify page. Tests: 1 payment across 24+25+26; credit applied to later dues; cancel restores; cheque-no-number rejected; gap-free single numbering. Example: 3600/yr → 12×300; pay 700 → m1 paid, m2 paid, m3 partial 100, m4-12 unpaid.
* Tables: `contributions (residence, fiscal_year, type, name, starts_on/ends_on, calculation_mode copy, annual_budget, coefficient 18,8, monthly/annual totals, applies_to_all_buildings, status, published_at + ST + index)`, `contribution_buildings`, `contribution_fixed_rates (contribution, lot_type, min/max surface, monthly_amount)`, `contribution_lots (contribution, residence, lot, tantieme/surface snapshots, annual/monthly + unique(contribution,lot))`, `dues (residence, contribution_lot_id cascade, lot_id, owner_id billing-at-generation, period_start/end, days, amount exact, amount_paid cache, due_date, status cache unpaid default + unique(contribution_lot,period_start) + indexes)`, `payments (residence, owner, lot nullable multi-lot, bank_account/bank, paid_on, method, document_number, amount, allocation_mode auto, status default validated, source, receipt_number unique on validation, verification_token uuid, receipt_sent_at cache, validated_by/at, rejection, cancelled_by/at/reason, notes + audit no-softDelete + indexes; media proof)`, `payment_allocations (payment cascade, due, amount + unique(payment,due) + index due; rule Σpayment ≤ amount; cancel keeps rows, queries count only validated)`.

## 7. F5 — Budgets/expenses + F6 treasury + F13 documents

* F5 API: `BudgetController, BudgetApproveController, BudgetLineController, BudgetAccountController (tree + standard codes ELEC/WATER/GUARD...), ExpenseController, SupplierController, BudgetVsActualController, ExpenseExportController`. Requests `Store/UpdateBudget (type forecast|off_budget, kind operating|investment, FY), BudgetLineRequest (qty>0, price≥0), StoreExpenseRequest (intervention⇒amount 0 + hide pay fields; expense⇒>0; budget_kind required if off-budget; splits Σ=amount; doc rule; account ∈ residence|template), Supplier/AccountRequest`. Policies `BudgetPolicy (budgets.approve; approved locked), Expense/Supplier/AccountPolicy`. Services `BudgetService (monthly/annual caches), ExpenseService (record/split/status), BudgetComparisonService, OverBudgetAlertService (once per crossing), ExpenseExportService`. Tables `budget_accounts (residence nullable=template, parent self-cascade, code 20, name json fr/ar + ST)`, `budgets (residence, FY, type, kind, name display, status, total_monthly/annual cache, approved_at + audit/ST)`, `budget_lines (budget cascade, account, sub_account, label, qty, unit_price, monthly=qty×price, annual=monthly×12)`, `expenses (residence, budget nullable null=off-budget, account/sub, supplier, bank_account/bank, spent_on, kind default expense, budget_type default forecast, budget_kind nullable required off-budget, description, amount default 0, payment_method, document_number, invoice_number, status default paid (intervention→recorded), notes + audit/ST + indexes)` + DB CHECK `kind<>'intervention' OR amount=0` + media `invoice`, `expense_building_splits (expense cascade, building, amount + unique)`. React: budget tree editor live totals; expense form conditional + split repeater (equal/manual); supplier CRUD; planned-vs-actual bars + red overrun; Excel/PDF. Tests: intervention≠0 rejected (form+DB), split mismatch rejected, alert once, off-budget kind in reports.
* F6: `TreasuryStatementController, BankAccountController`; `StoreTreasuryStatement (no overlap same account), ReconcileTreasury (bank balance)`; Policy `treasury.validate (validated locked)`; `TreasuryService (opening=prev closing, contributions=validated payments period, expenses period, computed closing, difference=computed−bank), TreasuryPdfService`. Table `treasury_statements (residence, bank_account, period_start/end, opening, total_contributions/expenses snapshots, computed_closing, bank_closing, difference + unique(residence,bank,period) + ST)`. React: builder (auto totals → bank balance → difference indicator → validate → PDF), history, bank accounts. Tests: cancelled excluded, difference formula, overlap refused. `bank_accounts (residence cascade, bank, label, RIB masked UI, opening_balance/date, is_active + ST)`.
* F13: `DocumentController (list/filter/dl/upload/versions), DocumentTemplateController (per type+locale), DocumentVerifyController (public)`; `UploadDocumentRequest (type+owner|lot|residence, mimes/size), StoreTemplateRequest (placeholders)`; `DocumentPolicy (locked never edit/delete; owner-scoped)`; `DocumentGenerator (version+1, supersede, checksum sha256, lock, number, QR, template), DocumentDeliveryService, TemplateRenderer`. Tables `document_templates (residence nullable=default, type, locale, name, body Blade {{}}, is_active + ST)`, `documents (residence/building/owner/lot/FY nullable, period_start/end, documentable morph Payment|Contribution|Assembly|Announcement|Quitus..., type, source default generated, status default final, version default 1, supersedes_id, is_locked, number indexed, title, locale, visibility default staff, disk private, path, mime pdf, size, checksum, verification_token uuid unique, template_id, meta, created_by, generated_at + ST + indexes)` — regen never overwrites; receipts/quitus/formal/signed-PV locked; `document_deliveries (document cascade, owner/lot, channel, status queued, sent_by, sent_at, opened_at portal view/dl, provider_msg_id, error + indexes)` — 1 convocation to 80 owners = 1 doc + 80 rows. Coverage table (§4.8): receipt/fund_call/owner_statement/unpaid/residence/reminder/formal_notice/lawyer_list/assembly_notice/minutes/note/information/quitus/financial/moral + budget_vs_actual/treasury_statement. React: library (filters type/residence/owner/period), version drawer, upload dialog, delivery states, template editor + FR/AR preview. Tests: version+1+supersede, locked refuse, cross-owner invisible.

## 8. F7 — Collection + F8 complaints + F9 assemblies/quitus/reports/announcements

* F7 API: `UnpaidController (residence/building), CollectionController (arrears+bulk), ReminderController, FormalNoticeController, LawyerListController, CollectionHistoryController`. Requests `SendReminders (selection+channel+preview), GenerateFormalNotices (eligible only), ExportLawyerList, UpdateLawyerCase`. Policy `CollectionPolicy (collection.send/formal_notice; settings-gated approval), LawyerCasePolicy`. Services `DebtService, ReminderService, FormalNoticeService (>1yr dues), LawyerListService` + Doc services. Job `SendMonthEndReminders` last-day idempotent (owner+month+type) + per-owner `SendReminderJob` (WA rate-limit, template, email fallback). Tables `collection_actions (residence, owner, lot, type, channel, status queued, amount_due snapshot, oldest_due_date, document_id, sent_by null=scheduler, sent_at, provider_id, error + indexes)`, `lawyer_cases (residence, owner, lot, amount_claimed, status default to_transmit, formal_notice_action_id, exported_at, notes + audit/ST)`. React: unpaid dashboard (filters+totals+by building), arrears table select-all + reminder dialog (preview+channel), formal list + generate, lawyer view + status + export, per-owner timeline. Promoteur: own section, never in owner rate; one consolidated msg/statement listing all his lots; formal/lawyer never auto (bulk excludes him). Tests: double month-end sends once; formal only 12mo+; paid never reminded; WA fail→email logged.
* F8: `ComplaintController, ComplaintStatusController, ComplaintMessageController, ComplaintTypeController (settings)`, portal `Portal\ComplaintController`. Requests `StoreComplaint (chain, type, desc, photos count/size/mimes), UpdateComplaintStatus (resolved needs handled_at+feedback), StoreComplaintMessage (is_internal staff-only), PortalStore (lot from login, never input)`. Policy owner sees only own-lot-during-ownership. Service `ComplaintService (staff/portal/WA create, assign, resolve → resolution_minutes), ComplaintNotificationService`. Tables `complaint_types (residence nullable, name json, target_hours, is_active)`, `complaints (reference unique, residence, building/lot/owner, type, description, status new, source staff, priority normal, assigned_to→users, opened_at auto, resolved_at, resolution_minutes cache, client_feedback, feedback_sent_at + audit/ST + index)`, `complaint_messages (complaint cascade, author_type, user/owner, body, is_internal false)`. Media `photos`. React: list/board (new/in_progress/resolved) filters; detail thread + gallery + internal toggle + transitions + feedback; portal new (camera) + mine. Tests: time computed, internal never portal, cross-lot blocked.
* F9: `AssemblyController, ResolutionController, AttendanceController (+proxies), VoteController, AssemblyNoticeController, MinutesController (generate+upload signed), QuitusController, ReportController (financial/moral), AnnouncementController (note/information)`. Requests `StoreAssembly, ResolutionRequest (majority), AttendanceRequest (1 row/lot, proxy≠self), VoteRequest, IssueQuitusRequest (overdue 0; lot_id if purpose=sale), GenerateReportRequest (FY), StoreAnnouncementRequest (kind, building|null=all, channels, fr+ar)`. Policy `AssemblyPolicy (assemblies.convene), QuitusPolicy (quitus.issue), AnnouncementPolicy`. Services `AssemblyService (convene→docs+1 delivery/owner), QuorumService (present tantièmes), VoteTallyService (simple/two_thirds/unanimity), MinutesGenerator, QuitusService (wk2 gate reused), FinancialReportService, MoralReportService, AnnouncementService (publish+notify)`. Tables `assemblies (residence, FY, type ordinary, status draft, title, scheduled_at, location, agenda, convened_at, quorum/present_tantiemes cache, minutes_notes + audit/ST)`, `assembly_resolutions (assembly cascade, position, title, desc, majority_rule simple, result pending, votes_for/against/abstain tantième cache)`, `assembly_attendances (assembly cascade, lot, owner, attendance absent, proxy_owner_id→owners, tantieme_counted, signed + unique(assembly,lot))`, `resolution_votes (resolution cascade, lot, choice, weight tantième + unique)`, `quitus_certificates (residence, owner, lot nullable required sale, FY, purpose sale, status valid, number unique sequence quitus, balance_at_issue 0, issued_on, valid_until=issued+quitus_validity_days, issued_by, document_id, cancel_reason + index)`, `lot_transfers` (see §5), `announcements (residence, building nullable=all, kind information, document_id, title/body json, published/expires_at, notify_channels json + audit/ST)`. React: assembly wizard (details→agenda/resolutions→convene→attendance lot-by-lot present/represented/absent + proxy picker + live quorum + bulk-mark owner's lots incl. promoteur unsold→voting table live tally→minutes preview→generate→upload signed locked version); quitus screen (balance, blocked if >0); reports generator; bilingual announcement editor + preview + channels. Tests: weight=tantieme, majorities, quorum, quitus refused if balance, 1 delivery/owner, signed locks.

## 9. F10 — Owner portal + F14 dashboards + F15 audit/trash/approvals/settings/imports

* F10 API (Portal): `DashboardController, DuesController, ReceiptsController, PaymentDeclarationController, ComplaintController, DocumentsController, AnnouncementsController, ProfileController (pw/lang)`. Requests `DeclarePayment, PortalStoreComplaint, ChangePassword`. Scoping: `payments.owner_id = users.current_owner_id`; dues from `lot_ownerships.started_on` (+old only if `arrears_on_sale=buyer_pays`); docs by `owner_id` or `visibility=residence`; complaints own + residence announcements. Services `OwnerSituationService, PortalDocumentService`. React mobile-first bottom-nav shell: cards due/paid/remaining, dues chips, receipts dl, declare (camera/amount/method), complaints, docs, announcements, FR/AR switch, install prompt. Tests: post-handover new owner sees zero prior receipts; id tampering blocked; declared stays pending.
* F14: `DashboardController (home), ResidenceDashboardController, BenchmarkController`; `DashboardFilterRequest (residence/building/period/codes)`; `DashboardPolicy; benchmarks.view → aggregates only for unassigned residences`. Services `ChargeTrendService (month/account/building via expenses+splits), BudgetComparisonService, ComplaintStatsService, CollectionStatsService, BenchmarkService (per lot/m²/tantième grouped by standard code)`. React: home (owner vs promoteur rates separate, sales progress, unpaid, open complaints, pending approvals/declared), residence dashboard picker + building filter (splits only; no-split="common"), trend lines, comparison (residences×code×period×normalisation), CSV export. Tests: building uses splits only; benchmark never leaks detail rows.
* F15: `AuditLogController, TrashController (onlyTrashed restore), ApprovalController, SettingsController (company/banks/complaint types/deletion-toggle/WA/templates), ImportBatchController, NotificationController`. Requests `RestoreRequest, SettingsRequest, ApprovalDecisionRequest`. Policies `AuditPolicy (audit.view), TrashPolicy (trash.restore; permanent super_admin), SettingsPolicy`. Services `TrashService, ApprovalService (reviewer≠requester), DeletionService (direct vs request), SettingsService`. Tables `approval_requests (residence, action, subject morph, payload json, status pending, requested_by, requested_via_api_key_id→api_keys, reason, reviewed_by/at, review_note, expires_at + index)`, `import_batches (residence, type lots|owners|opening_balances..., file_path, status pending, rows_total/imported, dry_run true, summary/errors json, created_by)`, `settings (key pk, value json)`, `activity_log` (spatie). React: audit table (who/what/when/old→new, filters), trash restore, approvals inbox (what-will-happen + approve/reject), settings tabs, import history + errors, bell. Tests: assistant delete→approval→syndic approves→soft delete→restore; no self-approve; audit row per update.

## 10. F11 — WhatsApp agent / MCP / API + F12 showcase + cutover

* F11 API: `Webhooks\WhatsAppWebhookController (verify+receive+status)`, `Admin\WhatsAppInboxController (takeover)`, `Admin\ApiKeyController`, `Admin\ApprovalController`, `Admin\ApiAuditController`, `Api\V1\* (residences/owners/dues/payments/unpaid)`, MCP endpoint. Requests `ApiKeyRequest (name/abilities/scope/expiry), WhatsAppWebhookRequest, ApprovalDecisionRequest`, per-tool validation. Policies `ApiKeyPolicy (super_admin), ApprovalPolicy (reviewer≠requester)`. Services `ApiKeyService (hash, once, revocable), WhatsAppClient, AgentToolRegistry (reads→views only; writes e.g. send-reminders→approval_requests), ConversationService (phone→owner→"which lot?"→handoff)`. Jobs `ProcessIncomingWhatsAppMessage, SendWhatsAppMessage (backoff)`. Tables `api_keys (name, prefix indexed, key_hash, abilities json, residence_ids json null=all, requires_approval_for_writes true, last_used/expires/revoked_at, created_by)` (+FK `approval_requests.requested_via_api_key_id`), `api_audit_logs (api_key, channel, tool/endpoint, request/response_status/summary json, ip, duration_ms, created_at only + index)`, `whatsapp_conversations (phone E.164 indexed→owner_phones, owner, status bot, assigned_to handoff, last_message_at)`, `whatsapp_messages (conversation cascade, direction, wa_message_id unique, body, payload json media/tool calls, status, sent_at)`. React: inbox (list/thread/takeover/handoff badge), keys (abilities checklist, scope, show-once, revoke), approvals inbox, audit table + filters. Tests: unknown phone safe reply; tool cannot cross-owner; write→pending approval never executes; revoked fails; forged webhook rejected; every call logged. Start Business verification + templates (reminder/receipt/convocation/announcement) week 1.
* F12: public `Home/Services/References/About/Contact/QuoteRequest/SitemapController` (Blade SSR, hreflang fr/ar, RTL, mobile-first, owner-login link); admin `SitePage/Reference/Inquiry/SettingsController`; `ContactRequest (honeypot+throttle), QuoteRequest, SitePageRequest (fr+ar), ReferenceRequest`; `InquiryService (store+email team), SeoService, SitemapService`. Tables `site_pages (slug unique, title/content json, seo json, is_published, position)`, `site_references (name/desc json, city, position, published)`, `inquiries (type, name, email/phone, message, details json, status new, handled_by, ip)`. Tests: sitemap both langs, honeypot blocks, quote→inbox+email.
* Cutover (old FR → new EN): dual-write/port script `appartements→lots(type=apartment)`, `immeubles→buildings`, `cotisations→contributions/dues`, `paiements→payments`, `reclamations→complaints`, `users.coproprietaire→owners+ownerships+logins`; opening balances as `opening` contribution type (see §12.4) preserving original due dates; rehearse in week 5; drop legacy only after portal+reports pass.

## 11. Calendar (adapted to React+API vertical slices)

| Week | Scope | Exit |
|---|---|---|
| 1 | Design tokens + RTL shell, PDF Arabic proof, F0 auth/roles/invitations/activation middleware, F1 residences/lots + CSV dry-run, F2 owners + logins + basic handover (quitus gate wk2). Start WA verification/templates. | Create residence, import lots+owners (mixed types), owner activates login |
| 2 | F3 contributions/dues, F4 payments/allocation/receipts, portal skeleton (dashboard/dues/receipts), public request form + inbox, transfers + sale quitus gate, sale badge + board | Payment settles N dues, receipt reaches owner |
| 3 | F5 budgets/expenses, F6 treasury, F7 collection + month-end, F13 documents/deliveries | Unpaid report, reminder run, formal notice, lawyer list |
| 4 | F8 complaints, F9 assemblies/quitus/reports/announcements, rest of F10, F14 dashboards, F15 audit/trash/approvals | Back-office end-to-end usable |
| 5 | F11 WA+MCP+API, F12 showcase, hardening, migration rehearsal, training, go-live | All CDC docs generatable, demo accepted |

Defer if slip (in order): MCP write tools (keep read-only), benchmarks, WA takeover UI, showcase CMS (static first). Never defer: allocation, receipts, audit, backups (`BackupDatabase` daily + restore test, `ExpireActivationLinks/ApprovalRequests/AccessRequests`, `PruneApiLogs` weekly, queued `GenerateDocumentJob/SendWhatsApp/Email/ProcessIncoming/RunImportBatch/GenerateDuesJob` with backoff + visible failures).

## 12. Open decisions (to close with client before weeks 2–3)

1. **Arrears on sale:** default `seller_pays` + mandatory valid sale quitus + balance 0 rechecked at transfer (quitus `used`). Confirm quitus validity (default 30d via `residences.quitus_validity_days`) and who may bypass (default syndic + super_admin with written reason → `quitus_overridden` flagged).
2. **Indivision:** `dues.owner_id` = billing contact at generation. If each co-owner must be billed their share, split `dues` per owner (schema change — decide now).
3. **Multi-lot owners:** one login per lot (several usernames/passwords per owner) per spec. Optional "link my lots" switcher later without schema change — confirm acceptable.
4. **Opening balances:** no clean slot today (`contribution_type` syndic|exceptional; modes fixed|tantieme). Proposal: third type `opening` ("reprise de solde") per-lot CSV amount keeping **original due date** so >1yr formal rule works. Confirm before building.
5. **Assistant delegation:** confirm assistants may be granted `owner_accounts.initialize` + `account_requests.review` (default opt-in per assistant) and whether syndic's own deletes need super-admin approval (default no; assistant deletes → syndic/super_admin approval, never self-approved).
6. **Promoteur:** unsold lots billed to promoteur like any owner (`dues.owner_id`=promoteur, no activation link, excluded bulk-init). Confirm reminders consolidated to one message/statement for all his lots (default yes) and formal/lawyer against him manual only (default yes); owner vs promoteur rates always separate.
7. **Sale contract details:** content still to come (parties/price/date/ref/notary? standard template for promoteur? resale required or warning?). Today: one required `sale_contract` doc + 3 nullable `lot_transfers` fields + `TransferRequirements` config — answer changes one file, not flow.

## 13. Testing strategy (Pest) + Definition of Done

* Unit: `DueGenerator` rounding Σ exact, `ContributionCalculator` fixed/tantieme, `AllocationService`, `VoteTallyService`, `Money`, enum helpers.
* Feature: every FormRequest valid/invalid, every Policy (super_admin / syndic in/out scope / assistant ±grant / owner), HandOverLot, cancel recompute, dry-run imports, version+lock, approvals, key abilities, WA signature.
* Security: owner vs `/admin`, portal id tampering, residence leaks, CIN masking, rate limits.
* Browser (Pest + Playwright/Dusk): payment entry, import wizard, transfer wizard, portal phone viewport, FR + AR RTL smoke.
* Data: seeders 2 residences / 3 buildings / 60 lots (mixed types) / 50 owners / year dues+payments.
* Done per feature: routes + Request + Policy + Service + React screen + tests + FR/AR strings + audit entries.

## 14. Risks (settle early)

Account takeover via request form (CIN + lot guessable) → link only to on-file or code-verified + syndic-confirmed contact; throttles; new owner never without wizard. First-sale rules open → `TransferRequirements` config. Promoter unsold without billing → `promoter_owner_id`. Arabic PDF → prove wk1. WA templates → submit wk1. Scope vs 5 weeks → defer list §11. CSV quality → dry-run + 1 tx/file + rehearsal.
