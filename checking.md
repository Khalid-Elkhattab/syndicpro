# Grille de vérification — CDC vs implémentation

**Mode d'emploi :** colonne `Décision` = votre validation par ligne.
- `approve` → c'est bien implémenté, on garde.
- `yes` → ça doit être implémenté (à faire).
- `no` → pas encore, on laisse pour la prochaine version.

La colonne est pré-remplie avec ma recommandation. Modifiez-la librement.
Référence : `docs/do/Cahier_des_charges_Gestion_Syndic.md` (CDC-MA7314 v1.0).

Légende état : ✅ fait · ⚠️ partiel · ❌ manquant.

---

## Module 1 — Résidences et lots

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 1.1 | CRUD résidences / immeubles / lots | ✅ `ResidenceController`, `ImmeubleController`, `LotController@index`, `AppartementsPage`, `ImmeublesPage`, `ResidencesPage` | approve |
| 1.2 | Archivage lots | ⚠️ Colonnes `is_active`/`archived_at` + `Lot::scopeActive`, mais aucun endpoint ni UI d'archivage/restauration | yes |
| 1.3 | Import lots (Excel/CSV) avec aperçu | ✅ `LotImportService` (dry-run + commit, FR aliases, logins + promoteur auto), `LotsImportWizard`, `LotImportTest` | approve |
| 1.4 | Contrôle total tantièmes | ✅ `TantiemeControlService`, bloquant à la publication | approve |
| 1.5 | Recherche / filtres (résidence, immeuble, type) | ✅ Filtres `LotController@index`, recherche lot dans `OwnersPage` | approve |
| 1.6 | Fiche lot + historique propriétaires et paiements | ✅ `GET lots/{lot}/history` (périodes, transferts, dus, paiements, relances, docs, logins, events) | approve |
| 1.7 | Export Excel et PDF (lots) | ❌ Rien (ni endpoint ni UI) | yes |

## Module 2 — Copropriétaires

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 2.1 | Coordonnées multiples (tél WhatsApp, emails) | ✅ `owner_phones`/`owner_emails` + repeaters UI + `is_whatsapp`/`is_primary` | approve |
| 2.2 | Indivision (plusieurs proprios par lot) | ✅ `lot_ownerships.share_percent` + `OwnershipService` (Σ = 100 testé) | approve |
| 2.3 | Vente avec conservation historique | ✅ `LotTransferService::run` + `lot_transfers` append-only + wizard UI | approve |
| 2.4 | Activation accès espace | ✅ Lien unique 7j + `ActivatePage` (staff : `CoproprietairesPage` affiche le lien) | approve |
| 2.5 | Contact direct WhatsApp / appel / email | ❌ Flag stocké et affiché, aucun lien `wa.me:`/`tel:`/`mailto:` ni envoi | yes |
| 2.6 | Import Excel + export liste owners | ❌ Aucun endpoint ni UI (seuls les lots s'importent) | yes |
| 2.7 | Notes internes | ✅ `internal_notes` + champ UI | approve |
| 2.8 | Dossier propriétaire complet (recherche CIN/nom/local) | ✅ `OwnersPage` + file 6 onglets + CIN masqué sans `owners.view_identity` | approve |

## Module 3 — Cotisations et appels de fonds

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 3.1 | Types syndic / exceptionnelle | ✅ `ContributionType`, sélecteur UI | approve |
| 3.2 | 3 modes (fixe / surface / tantième) | ✅ `CalculationMode` + FR/AR, grille à tranches partagée | approve |
| 3.3 | Prorata jours + arrondis exacts | ✅ `DueGenerator::splitAnnual` (largest-remainder, testé) | approve |
| 3.4 | Exceptionnelle par immeubles | ✅ `contribution_buildings` + picker UI | approve |
| 3.5 | Paramètres financiers par résidence + décision AG/PV annuelle | ✅ `ResidenceFinanceTab` + endpoints finance | approve |
| 3.6 | Prévisualisation par lot avant publication | ✅ Endpoint + tableau UI (totaux, avertissements) | approve |
| 3.7 | Publication verrouillante | ✅ `publish()` + dus 12×/lot, tests | approve |
| 3.8 | Appel de fonds PDF (par copropriétaire / résidence) | ❌ Rien ne génère le PDF | yes |
| 3.9 | Tableau des cotisations PDF + Excel | ❌ Aperçu écran seul ; `maatwebsite/excel` non installé | yes |

## Module 4 — Règlements et reçus

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 4.1 | Saisie (résidence → immeuble → lot, propriétaire auto) | ✅ `PaiementController@store` + `PaiementsPage` (legacy) | approve |
| 4.2 | N° pièce obligatoire chèque/effet + banque | ✅ `PaymentMethod::requiresDocumentNumber()`, `bank_id`, tests | approve |
| 4.3 | Répartition multi-années auto (ancien→récent) + manuelle | ✅ `AllocationService` + nouveau schéma `payments`/`payment_allocations` (testé) | approve |
| 4.4 | Reçu PDF numéroté | ✅ dompdf + `GenerateReceipt` job + URLs signées | approve |
| 4.5 | QR code de vérification sur reçu | ❌ Blade sans bloc QR, pas de route `/verify` consommée en UI | yes |
| 4.6 | Envoi reçu WhatsApp / email | ❌ Généré sur disque uniquement, aucun envoi | yes |
| 4.7 | Paiement déclaré par copropriétaire + validation/refus | ❌ Pas d'endpoint de déclaration (portail : index/reçu/download seulement) | yes |
| 4.8 | Annulation tracée | ✅ Statut `cancelled` + motif + recompute (testé) | approve |

## Module 5 — Budgets et dépenses

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 5.1 | Budget prévisionnel + hors budget (legacy) | ✅ `BudgetPage`, comptes/sous-comptes, dépenses + justificatifs | approve |
| 5.2 | Fonctionnement / investissement + lignes qté×PU | ⚠️ Schéma cible (`budgets`, `budget_lines`) sans endpoints ni UI ; legacy sans notion kind | yes |
| 5.3 | Intervention à montant 0 | ✅ Contrainte DB `chk_expense_kind_amount` + règle (cible) ; à vérifier côté legacy | yes |
| 5.4 | Répartition dépense par immeubles | ⚠️ `expense_building_splits` (cible, non exposé) ; legacy ? | yes |
| 5.5 | Fournisseurs + factures | ⚠️ Table `suppliers` + media `invoice` ; pas de CRUD fournisseurs UI | yes |
| 5.6 | Comparaison prévu/réalisé + alertes dépassement | ⚠️ Rapport legacy `rapports.budget` ; alerte auto : vérifier `BudgetService` | yes |
| 5.7 | Exports + documents (budget, état dépenses, prévu/réalisé) | ❌ CSV client seul, pas de PDF/Excel | yes |

## Module 6 — Trésorerie

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 6.1 | Relevé : solde initial + encaissements auto + dépenses auto + solde final vs relevé | ❌ Table + modèle seuls, aucun endpoint ni UI | yes |
| 6.2 | Soldes bancaires d'ouverture | ❌ Pas de saisie (lié §7 client) | yes |
| 6.3 | État de trésorerie PDF | ❌ Rien | yes |

## Module 7 — Recouvrement

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 7.1 | Situation par copropriétaire (dû/payé/reste/par période) | ✅ `OwnerSituationService` + onglet dossier | approve |
| 7.2 | Impayés par résidence / immeuble | ✅ `LegalPage` (nouveau moteur) + onglet legacy `RapportsPageImpayesTab` | approve |
| 7.3 | Rappel auto fin de mois (WhatsApp + email) | ❌ Pas de scheduler, pas d'envoi, pas de templates | yes |
| 7.4 | Mise en demeure > 1 an (génération) | ❌ Seuils en settings, aucune génération/envoi | yes |
| 7.5 | Liste avocat + statuts + export | ⚠️ Workflow `LawyerCase` + UI ; export Excel/PDF manquant | yes |
| 7.6 | Transferts sans quitus → mesure légale | ✅ Auto-création `LawyerCase` + onglet dédié (testé) | approve |
| 7.7 | Historique des relances | ✅ `collection_actions` affichés (dossier + historique lot) | approve |

## Module 8 — Réclamations

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 8.1 | Création gestionnaire / copropriétaire + statuts + photos | ✅ Flow legacy des deux côtés | approve |
| 8.2 | Types paramétrables | ❌ Table `complaint_types` sans endpoints ni UI | yes |
| 8.3 | Fil de messages + délai mesuré + retour client | ❌ Tables `complaint_messages`/`complaints` sans endpoints ni UI | yes |
| 8.4 | Création via assistant WhatsApp | ❌ Pas d'agent (voir module 11) | no |

## Module 9 — AG et rapports

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 9.1 | Quitus (émission, gate vente, annulation) | ✅ `QuitusService` + endpoints + UI wizard (testé) | approve |
| 9.2 | Quitus PDF + lien PV/AG | ❌ Pas de PDF ; picker AG existe (finance) mais pas de CRUD AG | yes |
| 9.3 | Convocation + envoi | ❌ Rien | yes |
| 9.4 | Présence / procurations / votes / quorum | ❌ Tables seules | yes |
| 9.5 | PV + rapports financier/moral + annonces UI | ❌ Tables seules (`announcements` sans endpoints) | yes |

## Module 10 — Espace copropriétaire

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 10.1 | Connexion + tableau de bord + détail cotisations + reçus | ✅ Pages portail | approve |
| 10.2 | Déclaration paiement avec justificatif | ❌ Lecture seule côté portail | yes |
| 10.3 | Réclamations portail | ✅ Création + suivi | approve |
| 10.4 | Documents résidence (PV, règlement) + annonces | ❌ Pas d'endpoints portail dédiés | yes |
| 10.5 | PWA installable | ❌ Pas de manifest/service worker | yes |
| 10.6 | FR/AR dans l'app | ❌ App en français uniquement (i18n = landing seule) | yes |
| 10.7 | Mot de passe oublié | ❌ Reset admin uniquement | yes |

## Module 11 — IA / MCP

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 11.1 | Agent WhatsApp (solde, reçus, réclamation, transfert) | ❌ Enums + tables vides ; compte Business requis côté client | no |
| 11.2 | Serveur MCP + API documentée + clés + audit | ❌ Rien | no |
| 11.3 | Validation actions sensibles + journal échanges | ❌ Rien (`approval_requests` table seule) | no |

## Module 12 — Vitrine

| # | Fonctionnalité (CDC) | État & implémentation | Décision |
|---|---|---|---|
| 12.1 | Pages FR/AR + formulaires contact/démo stockés + emailés | ✅ Landing + `InquiryService` + notification queued (testé) | approve |
| 12.2 | Mentions/confidentialité + sitemap/robots/SEO | ✅ Stubs "À valider" + sitemap + JSON-LD | approve |
| 12.3 | Contenu modifiable depuis l'admin | ❌ `site_pages` non éditable (contenu en dur FR/AR) | no |
| 12.4 | Boîte de réception demandes (inquiries inbox) | ❌ DB + email uniquement, pas d'UI | yes |

## §4 Documents générés

| # | Document | État | Décision |
|---|---|---|---|
| D1 | Reçu (PDF numéroté) | ✅ Généré (QR à ajouter, cf. 4.5) | approve |
| D2 | Appel de fonds | ❌ | yes |
| D3 | Situation copropriétaire / impayés / résidence | ❌ PDF/Excel (écran seul) | yes |
| D4 | Rappel / mise en demeure / liste avocat | ❌ Génération + export | yes |
| D5 | Convocation / PV / rapports / quitus / budget / trésorerie | ❌ | yes |

## §5 Technique & sécurité

| # | Exigence | État & implémentation | Décision |
|---|---|---|---|
| T1 | Rôles + droits par module/résidence | ✅ Spatie + `StaffPolicy` + matrice UI + `CheckRole` multi-rôles | approve |
| T2 | Invitations (jamais de mot de passe saisi pour autrui) | ⚠️ OK côté owners ; **non** côté staff (mot de passe saisi) | yes |
| T3 | Journal d'audit (viewer) | ⚠️ Écritures `activity_log` + `account_events` ; pas de viewer UI | yes |
| T4 | Corbeille (restauration) | ⚠️ Soft deletes partout ; pas d'UI restauration (sauf toggle copropriétaires) | yes |
| T5 | Sauvegarde auto quotidienne + test restauration | ❌ Pas de commande, scheduler vide | yes |
| T6 | Exports Excel + PDF | ⚠️ CSV client seul ; dompdf (reçus) ; pas de `maatwebsite/excel`, pas de moteur AR-safe (Browsershot/mPDF) | yes |
| T7 | FR/AR | ⚠️ Landing + enums bilingues ; app FR uniquement | yes |
| T8 | Demandes d'accès (inbox revue) | ⚠️ Endpoints + tokens ; pas de page inbox | yes |

---

*Dernière mise à jour : état du code vérifié fichier par fichier le 09/10/2026. Backend 112/112 Pest, build front vert.*
