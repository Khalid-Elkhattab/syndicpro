# PROJECT.md — SyndicPro
## Système de Gestion de Copropriété

---

## 1. Vision

SyndicPro digitalise intégralement la gestion de copropriété pour les syndics marocains.
L'objectif est de remplacer les tableurs Excel, les cahiers papier et les processus manuels
par une plateforme web centralisée, sécurisée et intuitive — accessible depuis n'importe quel
appareil par le syndic et les copropriétaires.

**Problème résolu** : Les syndics marocains gèrent aujourd'hui leurs résidences avec des outils
inadaptés (Excel, WhatsApp, reçus papier), ce qui génère des erreurs comptables, des impayés
non suivis, des conflits avec les copropriétaires et une perte de confiance.

**Solution** : Une plateforme SaaS complète qui automatise la comptabilité des charges, le suivi
des budgets, la génération des cotisations, l'encaissement des paiements, et la communication
avec les copropriétaires — le tout en français, avec la devise MAD (DH).

---

## 2. Acteurs

### Admin Syndic
Gestionnaire principal de la résidence. Peut gérer une ou plusieurs résidences.
Contrôle total sur toutes les entités du système.

### Copropriétaire
Propriétaire d'un ou plusieurs appartements. Accès en lecture seule à ses données financières.
Peut soumettre des réclamations et suivre leur traitement.

---

## 3. Fonctionnalités par Acteur

### 3.1 Admin Syndic — Fonctionnalités Complètes

#### Gestion du Bâtiment
- Créer, modifier, désactiver des **Résidences** (nom, ville, adresse)
- Créer, modifier des **Immeubles** au sein d'une résidence
- Créer, modifier des **Appartements** (numéro, étage, tantième)
- Assigner un copropriétaire à un appartement (ou le réassigner)

#### Gestion des Copropriétaires
- Créer un compte copropriétaire (nom, prénom, email, téléphone, username, mot de passe)
- Modifier les informations d'un copropriétaire
- Désactiver un copropriétaire (soft delete — audit trail conservé)
- Réinitialiser le mot de passe d'un copropriétaire
- Voir la fiche complète : appartements, cotisations, historique paiements, réclamations

#### Gestion des Charges
- Créer des **Comptes Charges** (ex. Entretien & Réparation, Jardinage, Sécurité)
- Créer des **Sous-Charges** par compte (ex. Entretien électricité, Réparation plomberie)
- Enregistrer des **Dépenses Réelles** contre une sous-charge (avec justificatif PDF/image)
- Enregistrer des **Dépenses Hors Budget** (incidents, urgences non prévues)

#### Gestion du Budget Prévisionnel
- Créer une **Période Annuelle** (ex. 2026, avec date début/fin)
- Définir un **Budget Prévisionnel** par compte charge pour la période
- Visualiser en temps réel : Budget Prévu / Total Consommé / Budget Restant
- Recevoir des alertes automatiques si le budget d'un compte est dépassé
- Consulter le détail de consommation par sous-charge

#### Gestion des Cotisations
- Créer des **Cotisations Fixes** (montant mensuel par appartement, auto-générées chaque mois)
- Créer des **Cotisations Exceptionnelles** (montant total unique, ex. réfection ascenseur)
- Choisir le mode de répartition pour les cotisations exceptionnelles :
  - **Égale** : même montant pour tous les appartements
  - **Par Appartement** : montant défini manuellement par appartement
  - **Par Tantième** : montant proportionnel aux tantièmes de chaque appartement
- Visualiser la prévisualisation de répartition avant génération
- Suivre les impayés (par copropriétaire, par période, par résidence)

#### Gestion des Paiements
- Enregistrer un paiement complet ou partiel pour une cotisation
- Sélectionner le mode de paiement (espèces, virement, chèque, carte)
- Saisir une référence de paiement
- Générer un **reçu PDF** automatiquement après enregistrement
- Consulter l'historique complet des paiements

#### Gestion des Réclamations
- Voir toutes les réclamations de toutes les résidences gérées
- Filtrer par statut, priorité, résidence, date
- Répondre à une réclamation (texte de réponse syndic)
- Mettre à jour le statut (nouveau → en_cours → traité / rejeté)
- Recevoir une notification email lors d'une nouvelle réclamation

#### Rapports
- Rapport de budget : prévu vs consommé par charge et par période
- Rapport des impayés : liste des cotisations non payées avec ancienneté
- Rapport des paiements : historique trié par date / copropriétaire / type
- Statistiques tableau de bord : KPIs financiers en temps réel

---

### 3.2 Copropriétaire — Fonctionnalités (Portail Self-Service)

- Se connecter avec les identifiants fournis par le syndic
- Voir ses appartements (numéro, étage, résidence, tantième)
- Consulter ses cotisations fixes (par mois) et exceptionnelles
- Voir le statut de chaque cotisation (payé / partiel / non payé)
- Consulter l'historique de ses paiements
- Télécharger ses reçus de paiement (PDF)
- Consulter les charges de la résidence (lecture seule)
- Soumettre une réclamation (titre, description, priorité, appartement concerné)
- Suivre le statut de ses réclamations et lire la réponse du syndic

---

## 4. Règles Métier Clés

### 4.1 Budget Prévisionnel
```
budget_restant = budget_prevu - SUM(depenses.montant)
                 WHERE depense.sous_charge.compte_charge_id = compte_charge.id
                 AND sous_charge.residence_id = residence.id
```
- Recalculé automatiquement à chaque ajout / modification / suppression de dépense (via Observer)
- Résultat mis en cache par `budget_previsionnel_id` — invalidé à chaque mutation de dépense
- Alerte déclenchée si `montant_consomme > montant_prevu`

### 4.2 Répartition des Cotisations Exceptionnelles

**Mode A — Répartition Égale**
```
montant_detail = cotisation.montant_total / COUNT(appartements_actifs)
```

**Mode B — Répartition par Appartement**
```
montant_detail = montant défini manuellement par le syndic pour chaque appartement
SUM(montants_details) doit = cotisation.montant_total
```

**Mode C — Répartition par Tantième**
```
montant_detail = (tantieme_appartement / SUM(tantièmes_actifs)) × montant_total
Exemple : tantième=80, total_tantièmes=1000, cotisation=12 000 DH
          → 80/1000 × 12 000 = 960,00 DH
```
Note : SUM(tantièmes_actifs) est calculé au moment de la création de la cotisation
sur les appartements actifs de la résidence — jamais stocké.

### 4.3 Statut Automatique des Cotisation Details
```
'non_paye'          → aucun paiement enregistré
'partiellement_paye' → SUM(paiements.montant) < cotisation_detail.montant
'paye'              → SUM(paiements.montant) >= cotisation_detail.montant
```
**Jamais défini manuellement.** Toujours calculé par le `PaiementObserver`.

### 4.4 Génération Automatique des Cotisations Fixes Mensuelles
- Commande Laravel planifiée : exécutée le 1er de chaque mois à 00:00
- Pour chaque `cotisation_fixe` active dans chaque résidence :
  - Génère un `cotisation_detail` par appartement pour le mois courant
  - **Idempotente** : vérifie l'existence avant création (unicité mois+année+cotisation+appartement)

### 4.5 Paiement Partiel
```
Règle : montant_paiement ≤ (cotisation_detail.montant - cotisation_detail.montant_paye)
```
Validation stricte côté backend (FormRequest) ET côté frontend (Zod).

### 4.6 Réclamations — Cycle de Vie
```
nouveau → en_cours → traité
                   → rejeté
```
- Seul le syndic peut changer le statut
- Le copropriétaire peut uniquement créer et consulter

---

## 5. Exigences Non Fonctionnelles

### Langue
- Interface utilisateur : **Français intégral** (labels, messages d'erreur, notifications, reçus)
- Code source : **Anglais** (variables, méthodes, classes, commentaires de code)
- Devise : **MAD — Dirham Marocain (DH)**
- Format monétaire : `1 200,00 DH` (séparateur de milliers = espace, virgule décimale)
- Format date : `DD/MM/YYYY` dans toute l'interface

### Sécurité
- Un syndic ne peut accéder qu'aux résidences dont il est propriétaire
- Un copropriétaire ne peut accéder qu'à ses propres appartements, cotisations et paiements
- Aucune donnée financière d'un autre copropriétaire ne doit apparaître dans une réponse API
- Authentification via Laravel Sanctum (SPA, cookies httpOnly)
- Rate limiting : login (5/min), mutations financières (20/min)
- Uploads : PDF/JPG/PNG uniquement, max 5 MB, stockés hors de `public/`
- Soft delete uniquement pour les utilisateurs (audit trail financier obligatoire)
- Réinitialisation des mots de passe copropriétaires : uniquement par le syndic (pas d'auto-reset)

### Performance
- Cache du résumé budget par `(periode_id)` — invalidation sur mutation de dépense
- Eager loading systématique (`appartements.coproprietaire`) sur toutes les requêtes résidence
- Pagination sur tous les endpoints de liste (dépenses, paiements, réclamations, impayés)
- Génération PDF des reçus en file d'attente (queue) — jamais dans le cycle HTTP
- Agrégation des données Recharts côté backend — jamais de lignes brutes envoyées au frontend

### Accessibilité & UX
- Support du responsive design (mobile, tablette, desktop)
- Réduction de mouvement respectée (`prefers-reduced-motion`)
- États vides avec illustration + message en français + bouton d'action
- Skeleton loaders sur toutes les sections de données asynchrones

---

## 6. Hors Scope (v1)

- Application mobile native (iOS / Android)
- Paiement en ligne (CMI, PayPal, Stripe)
- Comptabilité générale (plan comptable ONCF/marocain complet)
- Multi-syndics par résidence (un seul syndic admin par résidence en v1)
- Module AG (Assemblée Générale) / vote en ligne
- Importation de données (CSV, Excel)
- API publique / intégrations tierces
- Notifications SMS
- Réinitialisation de mot de passe par email pour copropriétaires (uniquement par syndic)
- Archivage automatique des périodes expirées

---

## 7. KPIs de Succès

| KPI | Cible |
|-----|-------|
| Précision du budget restant | 100 % (recalcul automatique) |
| Taux de suivi des paiements | 100 % des cotisations générées ont un statut |
| Délai de réponse aux réclamations | Mesurable (date création → date réponse syndic) |
| Génération mensuelle des cotisations | Idempotente, 0 doublons |
| Temps de génération d'un reçu PDF | < 10 secondes (via queue) |
| Disponibilité | 99,5 % |
| Temps de chargement du tableau de bord | < 2 secondes (données mises en cache) |
