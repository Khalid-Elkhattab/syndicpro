# OpenCode prompt — Landing page for the SaaS (v2, no client name)

**How to use:** paste everything below the horizontal rule into OpenCode as one prompt. It is self-contained. Section 7 lists every section of the page with its content.

**Assumptions I made (change them in the prompt if wrong):**
1. The page is the **public landing page of the SaaS product** (a syndic / property-management platform). The product name is **not decided**, so the page reads it from `config('site.name')`, which defaults to `APP_NAME`. Set `APP_NAME` in `.env` and it flows everywhere.
2. Two audiences: **managers** (professional syndics, management companies, volunteer syndics, residents' associations) who might adopt the product, and **co-owners** who log in. The main conversion is **"Demander une démo"**. Pricing and trial are unknown, so those sections are hidden behind flags.
3. Blade (server-rendered) + Tailwind + a little Alpine, as in the implementation plan. OpenCode checks the repo first and adapts.
4. The target market is **Morocco** (French and Arabic, MAD, CIN, titre foncier, quitus), because that is what the product is built around.

---

# TASK: Build the public landing page for the syndic management SaaS

## 1. Role and goal

You are a senior Laravel + front-end engineer. Build a production-quality, bilingual (French default, Arabic RTL), mobile-first landing page that replaces the default Laravel `welcome` page at `/`.

The page has two jobs:
1. **Convert managers:** explain what the product does, who it is for, and make it easy to request a demo.
2. **Gateway for existing users:** co-owners (copropriétaires) and the management team must find "log in", "first login / request access" and "forgot password" in seconds, on a phone.

## 2. Read first (before writing any code)

1. Read the repo's agent instructions and workflow files (`AGENTS.md`, `CLAUDE.md`, `config.yaml`, `openspec/` if present) and follow them. If the repo uses OpenSpec, create a change named `landing-page` (proposal, tasks, then implement).
2. Use Laravel Boost (if available) to confirm installed versions and docs for Laravel, Tailwind, Vite and any package you touch. Do not assume versions: check `composer.json` and `package.json`.
3. If these files exist in the repo or are attached, read them: `Syndic_Database_Structure.md`, `Syndic_Implementation_Plan.md`. They define the product. Relevant parts: the showcase-site feature (F12), access and roles (F0), owner portal (F10), tables `inquiries` and `settings`. **Where they mention a named client company, ignore the name** (see section 13). **Where they call the second form type `quote`, use `demo` instead** (section 9).
4. Look at what already exists: routes, layouts, Tailwind config, components, auth scaffolding (Breeze/Jetstream/Fortify or none), and the `lang/` folder. **Reuse and adapt; do not duplicate or break anything that exists.**

## 3. Product context (use this to write accurate copy)

- **What it is:** a web platform for **syndic de copropriété** management that replaces Excel files. It manages residences, buildings and lots (apartments, duplex, shops, offices, houses), co-owners, cotisations and fund calls, payments and receipts, budgets and expenses, treasury, debt collection, complaints, general assemblies, and official documents. Several residences live in one application.
- **Origin:** it was inspired by a real specification from a Moroccan syndic company, but it is a general product. **Never mention that company or any client.**
- **Access model for co-owners:** each *lot* (local) has its own personal login with a fixed identifier that describes the property, for example `JARD1-B-A12` (residence code, building, lot). The owner chooses his own password through a one-time link. An owner with several lots has one login per lot.
- **Getting access:** the manager creates the lot's login; the owner receives an activation link (WhatsApp or email). An owner without access can submit an access request (name, CIN, phone, lot), which the manager verifies before sending the link.
- **Team roles:** super admin, syndic, assistants (who only get the rights the syndic grants). Co-owners are separate.
- **Sales process:** on new residences the buildings belong to the promoteur (developer) until each lot is sold. Unsold lots are billed to the promoteur like any owner. A seller first settles his cotisations and obtains a **quitus (إبراء الذمة)**. The buyer declares himself with his CIN and the sale contract (for a first sale from the promoteur the contract is required). A new owner never sees what previous owners did; the manager sees the full history of each lot.
- **Languages:** French and Arabic. Many end users are on phones.
- **Tone:** respectful, clear, simple words, no unexplained jargon. French uses "vous". Arabic uses clear Modern Standard Arabic.

## 4. Scope

**In scope**
- Home page at `/` (French) and `/ar` (Arabic), all sections in section 7.
- Demo-request form and contact form (working, stored, emailed).
- Two minimal legal pages (mentions légales, confidentialité) with clearly marked placeholder text.
- Config-driven product info, navigation and feature flags.
- Tests and visual verification.

**Out of scope (do not build)**
- The login, activation, access-request and password-reset screens themselves (they belong to the auth feature). The landing page only **links** to them.
- An admin editor for page content (comes later). Keep all copy in lang files, keyed by section, so it can move to a `site_pages` table later.
- Analytics, cookie banners, chat widgets, newsletters, blog, terms of service, data-processing agreements.
- Any database change except the `inquiries` table (section 9).

## 5. Technical and architectural constraints

- **Stack:** Laravel (installed version), Blade server-side rendering, Tailwind CSS (installed version), Alpine.js only for small interactions (mobile menu, tabs, accordion). **No Livewire, no React/Vue** on this page. Keep the page's JavaScript small (target under 50 KB gzipped).
- **Structure** (adapt names to repo conventions):
  - `app/Http/Controllers/Public/HomeController.php` (invokable), `ContactController.php` (store), `DemoRequestController.php` (store), `LegalPageController.php`.
  - `app/Http/Requests/Public/ContactRequest.php`, `DemoRequest.php`.
  - `app/Models/Inquiry.php`, enums `app/Enums/InquiryType.php` (`contact`, `demo`) and `InquiryStatus.php` (`new`, `contacted`, `closed`) as string-backed enums with `label()`.
  - `app/Services/InquiryService.php` (store and notify; no business logic in controllers).
  - `app/Notifications/NewInquiryNotification.php` (queued mail to the team).
  - `resources/views/layouts/public.blade.php` (head, SEO, skip link, header, footer slots).
  - `resources/views/public/home.blade.php` composing one Blade component per section: `resources/views/components/landing/*.blade.php`.
  - `config/site.php` for product info, links and flags (section 12).
  - `lang/fr/landing.php`, `lang/ar/landing.php` (and `lang/*/legal.php`). **Every visible string comes from lang files.**
- **Routing and locale:**
  - `GET /` renders French, `GET /ar` renders Arabic. The URL decides the locale on public routes. If a `SetLocale` middleware exists, make sure it does not override the URL locale here.
  - The language switch links to the other URL. Do not auto-redirect by browser language.
  - Named routes everywhere (`home`, `home.ar`, `contact.store`, `demo.store`, `legal.mentions`, `legal.privacy`). Form POST routes are locale-aware.
- **Links to pages owned by other features** (co-owner login, request access, forgot password, staff login, document verification): use `config('site.links.*')` or named routes guarded with `Route::has(...)`. If a target does not exist yet, render a non-broken fallback ("Bientôt disponible" in a disabled style, or hide it) and list it in your report. **Never ship a link that returns 404.**
- **Assets:** Vite. Self-host fonts through npm (`@fontsource-variable/*` or similar); no calls to Google Fonts or other third parties. Icons as inline SVG from an installed icon set (Heroicons or Lucide). No icon fonts, no emoji as icons.
- **Images:** no photos or logo exist yet. Build visuals with HTML, CSS and SVG (section 6). Provide clearly named slots for real images (`<picture>` with width/height, `loading="lazy"`, meaningful `alt` from lang files).

## 6. Design direction

Make it feel **calm, trustworthy and modern**, like serious business software, not a generic SaaS template and not folkloric. Avoid purple-to-blue gradients, stock-photo heroes and identical three-card rows everywhere.

- **Brand tokens:** the logo and brand colors do not exist yet. Define all colors, radii, shadows and fonts as CSS variables / Tailwind theme tokens in one place so rebranding is a one-file change. Use a text wordmark made from `config('site.name')` until a logo exists.
- **Starting palette (replaceable):** deep teal for primary, warm sand/off-white backgrounds, a warm amber accent, ink-dark neutrals for text. Status colors used by the sale-status motif and chips: amber = unsold, green = sold/paid, red = overdue, blue = info. Light theme only for v1, tokens ready for dark.
- **Typography:** one expressive display face for headings (a refined serif or a distinctive geometric sans) and one highly legible sans for body. Arabic: a matching Arabic face (for example Cairo, IBM Plex Sans Arabic or Noto Naskh Arabic) with more generous line-height.
- **Recurring visual motif:** the **building grid**: a facade drawn as a grid of unit tiles by floor, tinted by status (sold / unsold / paid / overdue). It mirrors the product's "building board" and gives the page a distinct identity. Use it in the hero illustration, large in the sales section, and as a very subtle low-contrast texture in a few sections.
- **Hero visual:** a stylised **laptop + phone mockup** built in HTML/CSS/SVG. Laptop = manager dashboard (collection summary, sales-progress bar, a few lots with status chips). Phone = co-owner portal (Dû / Payé / Reste cards, monthly cotisations with status chips, a receipt with a QR code). Use illustrative sample data and a small caption "Aperçu illustratif" so it cannot be mistaken for real figures.
- **Layout:** container max ~1200 px, generous vertical rhythm, alternating section backgrounds, readable body text (min 16 px), strong primary CTA contrast.
- **Motion:** subtle reveal on scroll (opacity + small translate) via CSS and IntersectionObserver; respect `prefers-reduced-motion`; no autoplay carousels. Tiles in the building grid may highlight on hover or focus.
- **Mobile first:** design at 375 px, then scale to 768 and 1280. Navigation becomes a full-screen drawer on phones. After the hero scrolls out of view, show a slim sticky bottom bar on phones with the primary action "Demander une démo".

## 7. Page sections (in this order)

For every section: build it as its own Blade component, keep copy in lang files, and write the Arabic equivalent. The French copy below gives the required direction; refine wording but keep the meaning. In the copy, `:app` stands for the product name. Anything marked *flag* shows only when its flag in `config/site.php` is on. Only describe capabilities listed in this prompt; do not add features, integrations or guarantees.

### 7.1 Header (sticky)
- Wordmark (`:app`), logo slot.
- Anchor links: Fonctionnalités · Pour qui · Ventes · Sécurité · FAQ · Contact.
- Language switch FR / العربية (keep the section anchor if possible).
- **"Se connecter"** as a small menu with two entries: "Espace copropriétaire" (identifiant du local) and "Espace gestion" (email). Next to it, the primary button **"Demander une démo"** (scrolls to the demo form).
- Compact bar with shadow after scrolling; on phones a hamburger opens a full-screen drawer with focus trap and Escape to close.

### 7.2 Hero
- Eyebrow: "Logiciel de gestion de syndic de copropriété"
- H1: "Gérez vos copropriétés sans Excel, en toute transparence."
- Sub: ":app réunit cotisations, reçus, recouvrement, budgets, assemblées générales et un espace personnel pour chaque copropriétaire, en français et en arabe."
- Primary CTA "Demander une démo". Secondary CTA "Accéder à mon espace". Text link "Copropriétaire ? Première connexion →".
- Micro-line: "Plusieurs résidences dans une seule application · Un accès personnel par local · Français et العربية".
- Visual: the laptop + phone mockup with the building-grid motif behind it.

### 7.3 Already registered? (id `espace`)
A compact band right under the hero, for existing users, three equal cards:
1. **Se connecter** — "Copropriétaire : utilisez l'identifiant de votre local (exemple : JARD1-B-A12). Équipe de gestion : utilisez votre email." Two buttons: "Espace copropriétaire", "Espace gestion".
2. **Première connexion** — "Vous avez reçu un lien d'activation ? Ouvrez-le pour choisir votre mot de passe. Pas de lien ? Demandez votre accès à votre syndic." Button "Demander mon accès".
3. **Mot de passe oublié** — "Saisissez votre identifiant : un lien de réinitialisation est envoyé au contact enregistré pour votre local." Button "Réinitialiser".
Note under the cards: "Un identifiant par local : si vous possédez plusieurs locaux, vous aurez un accès pour chacun."

### 7.4 Who is it for? (id `pour-qui`)
Three cards, each with an icon, 2 to 3 lines and a link:
1. **Syndics professionnels et sociétés de gestion** — plusieurs résidences dans une seule application, équipe avec rôles et droits, comparaison entre résidences. Link: "Voir les fonctionnalités".
2. **Syndics bénévoles et associations de copropriétaires** — fini les fichiers Excel, des rapports prêts pour l'assemblée générale, des comptes clairs pour tous. Link: "Demander une démo".
3. **Copropriétaires et résidents** — suivez vos cotisations, téléchargez vos reçus, signalez un problème, depuis votre téléphone. Link: "Mon espace" (anchors to 7.3).

### 7.5 Before / after — "Fini Excel, WhatsApp et papier"
Two-column contrast (before | with :app). Before: fichiers Excel dispersés, reçus papier, relances faites à la main, questions des résidents par téléphone, historique perdu à chaque changement de gestionnaire. With :app: une seule base partagée, reçus numérotés avec QR, relances automatiques, espace personnel pour chaque copropriétaire, historique complet de chaque local. **No statistics or time-saved claims.**

### 7.6 Features (id `fonctionnalites`)
A bento-style grid (mixed card sizes), twelve items, each with icon, title and one line:
1. **Résidences et locaux** — immeubles, appartements, duplex, magasins, bureaux, tantièmes; import CSV avec aperçu avant validation.
2. **Cotisations et appels de fonds** — calcul fixe ou par tantième, au prorata des jours, avec arrondis exacts.
3. **Règlements et reçus** — chèque, virement, versement, espèces; un règlement peut solder plusieurs périodes; reçu numéroté avec QR.
4. **Budgets et dépenses** — budget prévisionnel, hors budget, fonctionnement ou investissement; comparaison prévu / réalisé et alertes de dépassement.
5. **Trésorerie** — solde initial, encaissements, dépenses, solde final rapproché du relevé bancaire.
6. **Recouvrement** — situation des impayés, rappels automatiques de fin de mois, mises en demeure, liste pour avocat.
7. **Réclamations et interventions** — signalement avec photos, suivi par statut, délai de traitement mesuré.
8. **Assemblées générales** — convocations, listes de présence et procurations, votes pondérés par les tantièmes, PV.
9. **Documents officiels** — générés à l'en-tête de chaque résidence, numérotés, versionnés.
10. **Tableaux de bord** — évolution des charges et des budgets par résidence et par immeuble, comparaison entre résidences.
11. **Ventes et changements de propriétaire** — lots vendus / invendus, quitus, historique complet de chaque local.
12. **Traçabilité** — journal de toutes les opérations, corbeille, annulation plutôt que suppression pour les paiements.

### 7.7 Platform by audience — tabs (id `plateforme`)
Heading: "Une plateforme pour toute la copropriété". Accessible tablist with keyboard arrows:
- **Pour les gestionnaires:** équipe avec rôles (super admin, syndic, assistants) · droits par module et par résidence · validation des suppressions · relances et documents envoyés par WhatsApp ou email · historique de chaque local · tableaux de bord et comparaison entre résidences · exports Excel et PDF.
- **Pour les copropriétaires:** tableau de bord (dû, payé, reste à payer) · détail des cotisations mois par mois · reçus PDF · déclaration d'un paiement avec justificatif · réclamations avec photos et suivi · documents et annonces de la résidence · français et arabe · installable sur le téléphone comme une application.
Each tab pairs the list with a small illustration (manager dashboard view / phone portal view).

### 7.8 Sales and ownership changes (id `ventes`)
The differentiating section. Heading: "Résidences neuves et ventes de lots : tout est suivi."
- Large **building-grid illustration** with a legend Vendu / Invendu / Vente en cours; tiles respond to hover and focus with a small tooltip (type, surface; sample data only). Beside it, three bullets: les lots invendus sont facturés au promoteur comme à tout propriétaire · chaque immeuble affiche « Non vendu », « Partiellement vendu » ou « Entièrement vendu » · l'historique de chaque lot, du promoteur au propriétaire actuel, reste consultable par la gestion.
- Below, two columns:
  - **Vendeur:** 1. Contactez le syndic. 2. Réglez vos cotisations échues. 3. Obtenez votre **quitus (إبراء الذمة)**. 4. Remettez-le lors de la vente.
  - **Acquéreur:** 1. Déclarez-vous auprès du syndic, en ligne ou en personne. 2. Présentez votre CIN et le contrat de vente (pièces exactes à confirmer par votre syndic). 3. Après vérification, vous recevez un lien pour choisir votre mot de passe.
- Reassurance line: "L'accès du local passe au nouveau propriétaire. Les informations des anciens propriétaires restent confidentielles." **Do not state any number of days of validity for the quitus** (it is a per-customer setting).

### 7.9 How a co-owner gets access (id `acces`)
Four numbered steps in a horizontal timeline (vertical on phones):
1. **Votre local est enregistré** — le syndic crée l'accès de votre local, avec un identifiant fixe.
2. **Vous recevez votre lien** — par WhatsApp ou email, ou vous demandez votre accès en ligne.
3. **Vous choisissez votre mot de passe** — vous seul le connaissez; le lien ne fonctionne qu'une fois.
4. **Vous suivez votre situation** — cotisations, reçus, réclamations et documents.
CTA: "Demander mon accès".

### 7.10 Official documents (id `documents`)
Heading: "Tous les documents officiels, générés pour vous." A grid of chips/cards: Reçu de paiement · Appel de fonds · Situation du copropriétaire · Situation des impayés · Rappel de paiement · Mise en demeure · Liste pour avocat · Convocation d'assemblée générale · PV d'assemblée générale · Quitus · Rapport financier · Rapport moral · Budget prévisionnel · État des dépenses · État de trésorerie. Text: "Chaque document est numéroté, daté et porte l'en-tête de la résidence. Les reçus et les quitus portent un QR code qui permet d'en vérifier l'authenticité." Small card "Vérifier un document" with a code input that goes to the public verification route (`/verify/{token}`) **only if that route exists**, otherwise hide the card.

### 7.11 Automation and AI (id `automatisation`, *each item behind its own flag*)
- Always shown: **Relances automatiques** de fin de mois par WhatsApp ou email, **un seul message regroupé par propriétaire** même s'il possède plusieurs lots.
- *Flag `whatsapp_assistant`:* "Un assistant sur WhatsApp" — le résident, reconnu par son numéro, demande son solde, reçoit ses reçus et signale un problème; un gestionnaire prend le relais si besoin. Hidden while the flag is off (it depends on WhatsApp Business approval).
- *Flag `ai_connectivity`:* "Connectez vos outils d'IA" — un serveur MCP et une API documentée pour interroger vos données en langage naturel (« Qui n'a pas payé ce mois-ci ? »); les actions sensibles demandent une validation; chaque échange est journalisé. Hidden while the flag is off.

### 7.12 Team and control (id `equipe`)
Heading: "Chaque personne voit ce qu'elle doit voir." Four role cards: **Super admin** (tout, y compris les paramètres), **Syndic** (ses résidences, ses assistants, la validation des demandes d'accès), **Assistants** (uniquement les tâches que le syndic leur confie, jamais plus que lui), **Copropriétaires** (leur local seulement). Under it, three small facts: les comptes sont créés par invitation, personne ne tape le mot de passe d'un autre · les suppressions demandées par un assistant passent par une validation · toutes les opérations sont journalisées.

### 7.13 Security and confidentiality (id `securite`)
A short statement plus a checklist of **factual points only**: accès personnel par local · chaque copropriétaire ne voit que la situation de son local · mot de passe choisi par l'utilisateur, jamais communiqué · liens d'activation à usage unique · mots de passe chiffrés et connexion HTTPS · sauvegarde automatique quotidienne · journal de toutes les opérations · droits par rôle, par module et par résidence. Add: "Les données personnelles des copropriétaires ne sont visibles que par l'équipe de gestion de leur résidence." **Do not claim** certifications, compliance badges, "bank-grade" security, uptime numbers, or data isolation between different customer organizations (the tenancy model is not confirmed).

### 7.14 Pricing (*flag `pricing`, default off*)
If on, render plans from `config('site.plans')` (name, price text, period, features, CTA). Hidden when the flag is off or the array is empty. **Never invent plans or prices.**

### 7.15 Key figures (*flag `key_figures`, default off*)
If on, show real aggregate counts only (residences, buildings, lots on the platform), computed from the database and cached. No invented numbers.

### 7.16 FAQ (id `faq`)
Accessible accordion (native `<details>` or Alpine with correct ARIA), split into two tabs: **Gestionnaires** and **Copropriétaires**. Emit `FAQPage` JSON-LD from the same data. Short answers (2 to 4 sentences), only stating things true for the product:
- *Gestionnaires:* 1. Faut-il installer un logiciel ? (non, application web, utilisable sur ordinateur, tablette et téléphone) · 2. Puis-je importer mes données Excel ? (import CSV avec aperçu avant validation) · 3. Puis-je gérer plusieurs résidences ? · 4. Comment mes assistants travaillent-ils avec moi ? (droits limités par le syndic) · 5. Comment mes copropriétaires accèdent-ils à leur espace ? · 6. Comment sont gérées la vente d'un lot et les lots du promoteur ? · 7. Les documents existent-ils en français et en arabe ? · 8. Puis-je exporter mes données ? (Excel et PDF) · 9. Mes données sont-elles sauvegardées ? (sauvegarde quotidienne automatique) · 10. Comment demander une démo ?
- *Copropriétaires:* 1. Comment obtenir mon accès ? · 2. Je n'ai pas reçu mon lien, que faire ? · 3. J'ai oublié mon mot de passe · 4. Je possède plusieurs locaux : ai-je plusieurs comptes ? (oui, un identifiant par local) · 5. Je viens d'acheter un bien, que dois-je faire ? · 6. Je vends mon bien, quelles démarches ? (quitus) · 7. Comment déclarer un paiement ? · 8. Où retrouver mes reçus et documents ? · 9. Comment signaler un problème ? · 10. Mes informations sont-elles visibles par les autres copropriétaires ? (non)
- **Do not** add questions about price, free trial, training, support hours, onboarding or migration services (answers unknown).

### 7.17 Demo request and contact (id `demo`)
Heading "Voyons si :app convient à vos résidences." Two columns: left = short reassurance bullets (une démonstration sur vos cas réels; répondez en quelques champs; nous vous recontactons) **without promising response times**, plus the contact card (email, phone, WhatsApp, each shown only if set in config); right = **tabs "Demander une démo" | "Nous contacter"**.
- **Demo form:** full name*, professional email*, phone*, organization name, role* (select: syndic professionnel · syndic bénévole · association de copropriétaires · promoteur · autre), number of residences, approximate number of lots, current tool (Excel · autre logiciel · papier · rien), message, consent checkbox* ("J'accepte que mes informations soient utilisées pour répondre à ma demande." + link to the privacy page).
- **Contact form:** name*, email or phone (at least one)*, message*, consent*.
- Behaviour: inline validation messages tied to fields (`aria-describedby`), success state replaces the form with a clear confirmation and a reference, errors keep typed values, double-submit prevention, works without JavaScript (normal POST with redirect).

### 7.18 Final call to action band
"Prêt à remplacer vos fichiers Excel ?" Buttons: "Demander une démo" and "Accéder à mon espace".

### 7.19 Footer
Wordmark and one-line description; columns: Produit (anchors), Espace copropriétaire (connexion, première connexion, mot de passe oublié), Espace gestion (connexion), Contact (from config), Légal (Mentions légales, Politique de confidentialité); language switch; "© {year} :app. Tous droits réservés." (publisher name from `config('site.legal.publisher')` when set).

### 7.20 Legal pages (stubs)
`/mentions-legales` and `/confidentialite` (and Arabic equivalents) in the public layout. Content: structured placeholders from `config/site.php` (publisher, address, registration numbers if set, host). The privacy text explains which data the website forms collect (name, email, phone, organization, message), why, retention and the person's rights, referring to **Moroccan law 09-08 on personal data protection and the CNDP**. Mark the whole text with a visible "À valider" notice and list it in your report. This is a draft, not legal advice. Do not write terms of service or data-processing agreements.

## 8. Internationalisation and RTL

- All strings in `lang/fr/landing.php` and `lang/ar/landing.php`, grouped by section key (`hero.title`, `access.cards.login.title`, ...). Write complete, natural Arabic, not word-for-word machine output. Keep the product name and the identifier example in Latin script.
- `<html lang="fr" dir="ltr">` / `<html lang="ar" dir="rtl">`. Use Tailwind **logical utilities** (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `border-s`, `start-*`, `end-*`) so RTL works without separate CSS. Mirror directional icons and the timeline in RTL; do not mirror the logo, the QR code, identifiers, numbers or the building-grid illustration's content.
- Arabic typography: suitable font, larger line-height, no letter-spacing on Arabic text.
- Latin digits in both languages.
- Add `hreflang` alternates (fr, ar, x-default) and a visible language switch.

## 9. Data and forms

Create the `inquiries` table only if it does not already exist: `id`, `type` (string, `InquiryType`: `contact` or `demo`), `name`, `email` (nullable), `phone` (nullable), `message` (text, nullable), `details` (json, nullable: organization, role, residences count, lots count, current tool, locale, consent timestamp), `status` (string, `InquiryStatus`, default `new`), `handled_by` (nullable FK to `users`, nullOnDelete), `ip` (string 45, nullable), timestamps. If the table already exists with a `quote` type, keep it working and add `demo`.

Rules:
- Validation in `ContactRequest` and `DemoRequest` (French and Arabic messages), enums via `Rule::enum`. Consent is required and its timestamp is stored. Contact form needs at least one of email or phone.
- **Anti-spam without third parties:** honeypot field, a time-based check (reject submissions faster than about 3 seconds), and `throttle:5,1` per IP. No reCAPTCHA.
- `InquiryService` stores the record and dispatches a **queued** notification to `config('site.demo_recipients')`. Do not put message contents or personal data in logs.
- Controllers stay thin: validate, call the service, redirect with a flash status.

## 10. SEO

- Per-locale `<title>` and meta description (e.g. ":app — Logiciel de gestion de syndic de copropriété"), canonical URL, Open Graph and Twitter cards (OG image: generate a simple branded 1200×630 image or leave a clear slot), favicon slot.
- JSON-LD: `SoftwareApplication` (name, `applicationCategory: BusinessApplication`, `operatingSystem: Web`, `inLanguage`: fr, ar; **no ratings, no reviews, no offers unless `pricing` is on**), `Organization` only if the legal publisher name is configured, and `FAQPage`.
- Add `/`, `/ar` and the legal pages to the sitemap (create `/sitemap.xml` if absent); `robots.txt` disallows `/admin`, `/portal`, `/api`, `/webhooks`. Pages behind login send `noindex`.
- One `<h1>` per page, logical heading order, descriptive link text, meaningful `alt` text.

## 11. Accessibility and performance

- Target WCAG 2.2 AA: contrast, visible focus rings, a "Skip to content" link, landmarks (`header`, `nav`, `main`, `footer`), keyboard-operable menu, tabs and accordion with correct ARIA, form labels and error association, `prefers-reduced-motion` honoured, touch targets at least 44 px. The building-grid illustration needs a text alternative and must not rely on color alone (use pattern or icon plus the legend).
- Performance on mobile: Lighthouse ≥ 90 for Performance, Accessibility, Best Practices and SEO; no layout shift (set image dimensions, reserve space); fonts with `font-display: swap` and only the weights used; no render-blocking third-party requests; images lazy-loaded below the fold.
- No horizontal scroll at any width from 320 px.

## 12. Configuration and placeholders (`config/site.php`)

Read from `.env` where it makes sense, with safe defaults. Values not supplied stay `null` and the UI **hides** the corresponding element (never prints "N/A" or fake data):

- `name` (default `config('app.name')`), `tagline`, `url`
- `contact`: `email`, `phone`, `whatsapp_number`, `address`, `opening_hours`
- `legal`: `publisher`, `registration` (RC/ICE or equivalent), `address`, `host`
- `demo_recipients` (array of emails)
- `links`: `portal_login`, `portal_request_access`, `portal_forgot_password`, `staff_login`, `document_verify` (route names or URLs, resolved safely when routes are missing)
- `features`: `whatsapp_assistant` (false), `ai_connectivity` (false), `pricing` (false), `key_figures` (false)
- `plans` (array, optional)

## 13. Hard rules (do not break)

- **Never write "KHALLOUFI" or "KHALLOUFI NEGOCE" anywhere** (copy, lang files, config, comments, tests, seeders, JSON-LD, meta tags, file names). Do not mention any client company. Before finishing, search the files you created or changed for it; the result must be empty.
- **No invented facts:** no fake statistics, testimonials, customer logos, case studies, awards, certifications, addresses, phone numbers, prices, uptime or time-saved claims. Anything unknown is a config placeholder that hides itself when empty.
- Do not claim multi-company data isolation, per-customer subdomains or custom branding; the tenancy model is not decided.
- No lorem ipsum in the final result.
- No third-party trackers, fonts, scripts or embeds.
- Do not modify authentication, existing migrations or existing routes. Do not delete or rewrite existing welcome-page assets that something else uses.
- Do not commit or push unless asked.
- Keep controllers thin and logic in services; follow the repo's code style (run Pint).

## 14. Tests and verification

Write Pest tests (adapt to the repo's test setup):
- `/` and `/ar` return 200; correct `lang` and `dir`; `hreflang` alternates present; exactly one `<h1>`.
- Every section id from section 7 appears, except flagged or empty sections when their condition is off.
- Demo and contact forms: a valid submission creates an `Inquiry` of the right type and queues the notification; invalid input shows errors and keeps values; honeypot and too-fast submissions are rejected; the 6th request in a minute is throttled; consent is required.
- Links to missing routes do not render a broken `href` (fallback behaviour).
- Legal pages render in both locales.
- Sitemap lists both locales; `robots.txt` blocks the private areas.
- A test that scans the rendered pages and the lang files and fails if "KHALLOUFI" appears.

Then verify visually: run the build and the app, take screenshots at 375, 768 and 1280 px, in French and in Arabic (RTL), and fix every issue found (overflow, mirrored icons, contrast, clipped Arabic text, tooltip behaviour on touch). If Playwright or Lighthouse is available, run them and report the scores. Run `php artisan test`, `npm run build` and Pint; everything must pass.

## 15. Final report (what to send back)

1. Files created or changed (grouped).
2. How to run and preview it (commands, URLs).
3. **Placeholders to fill** (every `config/site.php` key still `null`) and **assets needed** (logo, brand colors, OG image, any photos).
4. Links that point to routes not built yet (so the auth feature can wire them).
5. Texts needing human review: the Arabic translation, the legal pages (law 09-08 / CNDP), the buyer's document list, the seller and buyer steps.
6. Test results, screenshots taken, and Lighthouse scores if run.
7. Anything you decided differently from this prompt, and why.
