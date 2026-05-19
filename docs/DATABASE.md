# DATABASE.md — SyndicPro
## Schéma MySQL Complet

Engine : InnoDB | Charset : utf8mb4 | Collation : utf8mb4_unicode_ci
Tous les montants : DECIMAL(12,2) | Soft deletes : users, appartements uniquement

---

## Ordre de Création des Migrations (dépendances)

```
1.  users
2.  residences
3.  immeubles
4.  appartements
5.  comptes_charges
6.  sous_charges
7.  depenses
8.  hors_budgets
9.  periodes
10. budgets_previsionnels
11. cotisations
12. cotisation_details
13. paiements
14. reclamations
```

---

## 1. Table `users`

```sql
CREATE TABLE users (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100)    NOT NULL COMMENT 'Nom complet',
  email           VARCHAR(150)    NOT NULL UNIQUE COMMENT 'Email (optionnel pour copropriétaire)',
  phone           VARCHAR(20)     NULL     COMMENT 'Téléphone',
  role            ENUM('syndic','coproprietaire')
                                  NOT NULL COMMENT 'Rôle utilisateur',
  username        VARCHAR(50)     NOT NULL UNIQUE COMMENT 'Identifiant de connexion',
  password        VARCHAR(255)    NOT NULL,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1=actif, 0=désactivé',
  remember_token  VARCHAR(100)    NULL,
  deleted_at      TIMESTAMP       NULL,   -- soft delete
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_role     (role),
  INDEX idx_users_is_active(is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 2. Table `residences`

```sql
CREATE TABLE residences (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  syndic_id   BIGINT UNSIGNED NOT NULL COMMENT 'FK → users (syndic)',
  nom         VARCHAR(150)    NOT NULL COMMENT 'Nom de la résidence',
  ville       VARCHAR(100)    NOT NULL COMMENT 'Ville',
  adresse     TEXT            NOT NULL COMMENT 'Adresse complète',
  nb_immeubles INT UNSIGNED   NOT NULL DEFAULT 0 COMMENT 'Nombre d\'immeubles (calculé)',
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_residences_syndic
    FOREIGN KEY (syndic_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_residences_syndic_id (syndic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Table `immeubles`

```sql
CREATE TABLE immeubles (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  residence_id BIGINT UNSIGNED NOT NULL COMMENT 'FK → residences',
  nom          VARCHAR(100)    NOT NULL COMMENT 'Nom ou lettre de l\'immeuble (ex: Bâtiment A)',
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_immeubles_residence
    FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE CASCADE,
  INDEX idx_immeubles_residence_id (residence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Table `appartements`

```sql
CREATE TABLE appartements (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero            VARCHAR(20)     NOT NULL COMMENT 'Numéro d\'appartement',
  etage             TINYINT         NOT NULL DEFAULT 0 COMMENT 'Étage (0=RDC)',
  immeuble_id       BIGINT UNSIGNED NOT NULL COMMENT 'FK → immeubles',
  residence_id      BIGINT UNSIGNED NOT NULL COMMENT 'FK → residences (dénormalisé pour perf)',
  coproprietaire_id BIGINT UNSIGNED NULL     COMMENT 'FK → users (copropriétaire), nullable si non assigné',
  tantieme          DECIMAL(10,4)   NOT NULL DEFAULT 0 COMMENT 'Quote-part en tantièmes',
  deleted_at        TIMESTAMP       NULL,   -- soft delete
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_appartements_immeuble
    FOREIGN KEY (immeuble_id) REFERENCES immeubles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_appartements_residence
    FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE RESTRICT,
  CONSTRAINT fk_appartements_coproprietaire
    FOREIGN KEY (coproprietaire_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_appartement_numero_immeuble (numero, immeuble_id),
  INDEX idx_appartements_residence_id      (residence_id),
  INDEX idx_appartements_coproprietaire_id (coproprietaire_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. Table `comptes_charges`

```sql
CREATE TABLE comptes_charges (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  residence_id BIGINT UNSIGNED NOT NULL COMMENT 'FK → residences',
  nom          VARCHAR(150)    NOT NULL COMMENT 'Ex: Entretien & Réparation, Jardinage',
  description  TEXT            NULL,
  is_active    TINYINT(1)      NOT NULL DEFAULT 1,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_comptes_charges_residence
    FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE RESTRICT,
  INDEX idx_comptes_charges_residence_id (residence_id),
  INDEX idx_comptes_charges_is_active    (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 6. Table `sous_charges`

```sql
CREATE TABLE sous_charges (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  compte_charge_id BIGINT UNSIGNED NOT NULL COMMENT 'FK → comptes_charges',
  residence_id     BIGINT UNSIGNED NOT NULL COMMENT 'FK → residences (dénormalisé)',
  nom              VARCHAR(150)    NOT NULL COMMENT 'Ex: Entretien électricité, Réparation plomberie',
  description      TEXT            NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_sous_charges_compte
    FOREIGN KEY (compte_charge_id) REFERENCES comptes_charges(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sous_charges_residence
    FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE RESTRICT,
  INDEX idx_sous_charges_compte_charge_id (compte_charge_id),
  INDEX idx_sous_charges_residence_id     (residence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 7. Table `depenses`

```sql
CREATE TABLE depenses (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sous_charge_id   BIGINT UNSIGNED NOT NULL COMMENT 'FK → sous_charges',
  residence_id     BIGINT UNSIGNED NOT NULL COMMENT 'FK → residences (dénormalisé)',
  date             DATE            NOT NULL COMMENT 'Date de la dépense',
  montant          DECIMAL(12,2)   NOT NULL COMMENT 'Montant en DH',
  description      TEXT            NOT NULL COMMENT 'Description de la dépense',
  justificatif_path VARCHAR(500)   NULL     COMMENT 'Chemin Spatie Media Library',
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_depenses_sous_charge
    FOREIGN KEY (sous_charge_id) REFERENCES sous_charges(id) ON DELETE RESTRICT,
  CONSTRAINT fk_depenses_residence
    FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE RESTRICT,
  INDEX idx_depenses_sous_charge_id (sous_charge_id),
  INDEX idx_depenses_residence_id   (residence_id),
  INDEX idx_depenses_date           (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 8. Table `hors_budgets`

```sql
CREATE TABLE hors_budgets (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  residence_id      BIGINT UNSIGNED NOT NULL COMMENT 'FK → residences',
  date              DATE            NOT NULL,
  montant           DECIMAL(12,2)   NOT NULL,
  description       TEXT            NOT NULL COMMENT 'Nature de l\'incident ou urgence',
  justificatif_path VARCHAR(500)    NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_hors_budgets_residence
    FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE RESTRICT,
  INDEX idx_hors_budgets_residence_id (residence_id),
  INDEX idx_hors_budgets_date         (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 9. Table `periodes`

```sql
CREATE TABLE periodes (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  residence_id BIGINT UNSIGNED NOT NULL COMMENT 'FK → residences',
  annee        YEAR            NOT NULL COMMENT 'Exercice annuel (ex: 2026)',
  is_active    TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1=période courante',
  date_debut   DATE            NOT NULL COMMENT 'Date de début de la période',
  date_fin     DATE            NOT NULL COMMENT 'Date de fin de la période',
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_periodes_residence
    FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_periode_residence_annee (residence_id, annee),
  INDEX idx_periodes_residence_id (residence_id),
  INDEX idx_periodes_annee        (annee),
  INDEX idx_periodes_is_active    (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 10. Table `budgets_previsionnels`

```sql
CREATE TABLE budgets_previsionnels (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  periode_id       BIGINT UNSIGNED NOT NULL COMMENT 'FK → periodes',
  compte_charge_id BIGINT UNSIGNED NOT NULL COMMENT 'FK → comptes_charges',
  montant_prevu    DECIMAL(12,2)   NOT NULL COMMENT 'Budget alloué en DH',
  montant_consomme DECIMAL(12,2)   NOT NULL DEFAULT 0
                   COMMENT 'Total dépenses réelles (mis à jour par observer)',
  -- montant_restant = montant_prevu - montant_consomme (calculé en PHP, pas GENERATED pour compatibilité)
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_budgets_prev_periode
    FOREIGN KEY (periode_id) REFERENCES periodes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_budgets_prev_compte
    FOREIGN KEY (compte_charge_id) REFERENCES comptes_charges(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_budget_periode_compte (periode_id, compte_charge_id),
  INDEX idx_budgets_prev_periode_id       (periode_id),
  INDEX idx_budgets_prev_compte_charge_id (compte_charge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: montant_restant est calculé en PHP (montant_prevu - montant_consomme)
-- et exposé via Resource. La colonne GENERATED ALWAYS AS est évitée pour
-- compatibilité maximale avec les versions MySQL et meilleure flexibilité.
```

---

## 11. Table `cotisations`

```sql
CREATE TABLE cotisations (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  residence_id     BIGINT UNSIGNED NOT NULL COMMENT 'FK → residences',
  periode_id       BIGINT UNSIGNED NOT NULL COMMENT 'FK → periodes',
  type             ENUM('fixe','exceptionnelle')
                                   NOT NULL COMMENT 'Type de cotisation',
  label            VARCHAR(200)    NOT NULL COMMENT 'Ex: Charges mensuelles, Réfection ascenseur',
  montant_total    DECIMAL(12,2)   NOT NULL COMMENT 'Montant total de la cotisation',
  montant_mensuel  DECIMAL(12,2)   NULL COMMENT 'Montant mensuel par appartement (fixe uniquement)',
  mode_repartition ENUM('egale','par_appartement','par_tantieme')
                                   NULL COMMENT 'Mode répartition (exceptionnelle uniquement)',
  mois             TINYINT         NULL COMMENT 'Mois ciblé (1-12, fixe uniquement)',
  annee            YEAR            NULL COMMENT 'Année ciblée (fixe uniquement)',
  description      TEXT            NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_cotisations_residence
    FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE RESTRICT,
  CONSTRAINT fk_cotisations_periode
    FOREIGN KEY (periode_id) REFERENCES periodes(id) ON DELETE RESTRICT,
  INDEX idx_cotisations_residence_id (residence_id),
  INDEX idx_cotisations_periode_id   (periode_id),
  INDEX idx_cotisations_type         (type),
  INDEX idx_cotisations_mois_annee   (mois, annee)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 12. Table `cotisation_details`

```sql
CREATE TABLE cotisation_details (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cotisation_id     BIGINT UNSIGNED NOT NULL COMMENT 'FK → cotisations',
  appartement_id    BIGINT UNSIGNED NOT NULL COMMENT 'FK → appartements',
  coproprietaire_id BIGINT UNSIGNED NOT NULL COMMENT 'FK → users (copropriétaire)',
  montant           DECIMAL(12,2)   NOT NULL COMMENT 'Montant dû par cet appartement',
  statut            ENUM('non_paye','partiellement_paye','paye')
                                    NOT NULL DEFAULT 'non_paye'
                    COMMENT 'Calculé automatiquement par PaiementObserver — ne jamais définir manuellement',
  montant_paye      DECIMAL(12,2)   NOT NULL DEFAULT 0
                    COMMENT 'Somme des paiements reçus — mis à jour par PaiementObserver',
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_cotisation_details_cotisation
    FOREIGN KEY (cotisation_id) REFERENCES cotisations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_cotisation_details_appartement
    FOREIGN KEY (appartement_id) REFERENCES appartements(id) ON DELETE RESTRICT,
  CONSTRAINT fk_cotisation_details_coproprietaire
    FOREIGN KEY (coproprietaire_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_cotisation_detail (cotisation_id, appartement_id),
  INDEX idx_cotisation_details_cotisation_id     (cotisation_id),
  INDEX idx_cotisation_details_appartement_id    (appartement_id),
  INDEX idx_cotisation_details_coproprietaire_id (coproprietaire_id),
  INDEX idx_cotisation_details_statut            (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 13. Table `paiements`

```sql
CREATE TABLE paiements (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cotisation_detail_id BIGINT UNSIGNED NOT NULL COMMENT 'FK → cotisation_details',
  coproprietaire_id    BIGINT UNSIGNED NOT NULL COMMENT 'FK → users (copropriétaire)',
  date_paiement        DATE            NOT NULL COMMENT 'Date d\'encaissement',
  montant              DECIMAL(12,2)   NOT NULL COMMENT 'Montant encaissé',
  mode_paiement        ENUM('especes','virement','cheque','carte')
                                       NOT NULL DEFAULT 'especes',
  reference            VARCHAR(100)    NULL COMMENT 'Numéro de chèque, référence virement, etc.',
  recu_path            VARCHAR(500)    NULL COMMENT 'Chemin PDF reçu (généré en async)',
  created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_paiements_cotisation_detail
    FOREIGN KEY (cotisation_detail_id) REFERENCES cotisation_details(id) ON DELETE RESTRICT,
  CONSTRAINT fk_paiements_coproprietaire
    FOREIGN KEY (coproprietaire_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_paiements_cotisation_detail_id (cotisation_detail_id),
  INDEX idx_paiements_coproprietaire_id    (coproprietaire_id),
  INDEX idx_paiements_date_paiement        (date_paiement)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 14. Table `reclamations`

```sql
CREATE TABLE reclamations (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  coproprietaire_id BIGINT UNSIGNED NOT NULL COMMENT 'FK → users (copropriétaire)',
  residence_id      BIGINT UNSIGNED NOT NULL COMMENT 'FK → residences',
  appartement_id    BIGINT UNSIGNED NOT NULL COMMENT 'FK → appartements',
  titre             VARCHAR(200)    NOT NULL COMMENT 'Titre court de la réclamation',
  description       TEXT            NOT NULL COMMENT 'Description détaillée',
  statut            ENUM('nouveau','en_cours','traite','rejete')
                                    NOT NULL DEFAULT 'nouveau',
  priorite          ENUM('normale','urgente')
                                    NOT NULL DEFAULT 'normale',
  reponse_syndic    TEXT            NULL COMMENT 'Réponse ou commentaire du syndic',
  date_reponse      TIMESTAMP       NULL COMMENT 'Date de la dernière réponse syndic',
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_reclamations_coproprietaire
    FOREIGN KEY (coproprietaire_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_reclamations_residence
    FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE RESTRICT,
  CONSTRAINT fk_reclamations_appartement
    FOREIGN KEY (appartement_id) REFERENCES appartements(id) ON DELETE RESTRICT,
  INDEX idx_reclamations_coproprietaire_id (coproprietaire_id),
  INDEX idx_reclamations_residence_id      (residence_id),
  INDEX idx_reclamations_statut            (statut),
  INDEX idx_reclamations_priorite          (priorite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Résumé des Clés Étrangères et Règles ON DELETE

| Table | FK | Référence | ON DELETE |
|-------|----|-----------|-----------|
| residences | syndic_id | users.id | RESTRICT |
| immeubles | residence_id | residences.id | CASCADE |
| appartements | immeuble_id | immeubles.id | RESTRICT |
| appartements | residence_id | residences.id | RESTRICT |
| appartements | coproprietaire_id | users.id | RESTRICT |
| comptes_charges | residence_id | residences.id | RESTRICT |
| sous_charges | compte_charge_id | comptes_charges.id | RESTRICT |
| sous_charges | residence_id | residences.id | RESTRICT |
| depenses | sous_charge_id | sous_charges.id | RESTRICT |
| depenses | residence_id | residences.id | RESTRICT |
| hors_budgets | residence_id | residences.id | RESTRICT |
| periodes | residence_id | residences.id | RESTRICT |
| budgets_previsionnels | periode_id | periodes.id | RESTRICT |
| budgets_previsionnels | compte_charge_id | comptes_charges.id | RESTRICT |
| cotisations | residence_id | residences.id | RESTRICT |
| cotisations | periode_id | periodes.id | RESTRICT |
| cotisation_details | cotisation_id | cotisations.id | RESTRICT |
| cotisation_details | appartement_id | appartements.id | RESTRICT |
| cotisation_details | coproprietaire_id | users.id | RESTRICT |
| paiements | cotisation_detail_id | cotisation_details.id | RESTRICT |
| paiements | coproprietaire_id | users.id | RESTRICT |
| reclamations | coproprietaire_id | users.id | RESTRICT |
| reclamations | residence_id | residences.id | RESTRICT |
| reclamations | appartement_id | appartements.id | RESTRICT |

**Règle** : RESTRICT sur toutes les données financières (jamais de suppression en cascade de données monétaires).
CASCADE uniquement pour immeubles → residences (structure de bâtiment).
