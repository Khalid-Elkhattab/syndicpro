# Cahier des charges fonctionnel

**DIREKTDOTCOM — Web Development & Digital Marketing Division**

**Application de gestion de syndic : plateforme web et mobile, espace copropriétaire, connectivité IA et site web vitrine**

| | |
|---|---|
| **Client** | KHALLOUFI NEGOCE |
| **Référence** | CDC-MA7314 |
| **Version** | 1.0 |
| **Date** | 01/10/2026 |

---

## Sommaire

1. Présentation du projet
2. Utilisateurs et rôles
3. Modules fonctionnels (1 à 12)
4. Documents générés
5. Exigences techniques et sécurité
6. Planning et livraison
7. Éléments à fournir par le client
8. Hors périmètre
9. Validation

---

## 1. Présentation du projet

KHALLOUFI NEGOCE assure la gestion de syndic de plusieurs résidences. Le projet consiste à mettre en place une application unique qui remplace les fichiers Excel et centralise toute la gestion : patrimoine, copropriétaires, cotisations, règlements, budgets, dépenses, trésorerie, recouvrement, réclamations et assemblées générales.

| Composant | Description |
|---|---|
| **Back-office de gestion** | Application web pour l'équipe KHALLOUFI NEGOCE, utilisable sur ordinateur, tablette et téléphone. |
| **Espace copropriétaire** | Accès personnel pour chaque copropriétaire, installable sur téléphone comme une application. |
| **Connectivité IA** | Assistant WhatsApp pour les résidents et serveur MCP pour connecter des outils d'intelligence artificielle. |
| **Site web vitrine** | Site public de présentation de la société, avec contact et demande de devis. |

**Multi-résidences :** une seule application gère toutes les résidences, chacune avec ses immeubles, son budget, son mode de calcul et sa période d'exercice.

**Langues :** français et arabe.

---

## 2. Utilisateurs et rôles

| Rôle | Accès |
|---|---|
| **Super administrateur** | Accès complet, gestion des utilisateurs et des droits, paramètres, journal d'audit, corbeille. |
| **Gestionnaire / assistante** | Droits définis par module (consulter, créer, modifier, supprimer) et limités à certaines résidences si besoin. Les suppressions peuvent être soumises à validation. |
| **Copropriétaire** | Espace personnel : sa situation, ses reçus, ses documents, ses réclamations. |
| **Visiteur** | Site web vitrine, formulaire de contact et de demande de devis. |

---

## 3. Modules fonctionnels

### Module 1 — Résidences et lots

Décrire tout le patrimoine géré : résidences, immeubles et locaux.

**Données gérées**

| Donnée | Détail |
|---|---|
| Nom de la résidence | Exemple : Résidence Les Jardins 1 |
| Nom du syndicat | Exemple : Syndicat des copropriétaires Les Jardins 1 |
| Ville, adresse | Localisation de la résidence |
| N° immeuble | Un ou plusieurs immeubles par résidence |
| Type de local | Appartement, duplex, magasin, bureau, pavillon, autre |
| N° local | Numéro du lot |
| Superficie | En m² |
| Tantième (quote-part) | Utilisé pour le calcul des cotisations par tantième |
| N° titre foncier | Référence foncière du lot |
| Place de parking | Oui, non ou partie commune ; N° de place (une ou plusieurs) |
| Box | Oui ou non ; N° de box (un ou plusieurs) |

**Fonctionnalités**

- Création, modification, archivage
- Import des lots depuis un fichier Excel
- Contrôle du total des tantièmes par résidence
- Recherche et filtres (résidence, immeuble, type)
- Fiche lot avec historique des propriétaires et des paiements
- Export Excel et PDF

---

### Module 2 — Copropriétaires

Centraliser les coordonnées et les lots de chaque copropriétaire.

**Données gérées**

| Donnée | Détail |
|---|---|
| Nom et prénom | Personne physique ou société |
| CIN | N° de carte d'identité (ou RC pour une société) |
| N° de téléphone | Un ou plusieurs, avec indication du numéro WhatsApp |
| Email | Un ou plusieurs |
| Lots | Un copropriétaire peut détenir plusieurs lots, dans une ou plusieurs résidences |

**Fonctionnalités**

- Plusieurs copropriétaires pour un même lot (indivision)
- Changement de propriétaire (vente) avec conservation de l'historique
- Activation de l'accès à l'espace copropriétaire
- Contact direct par WhatsApp, appel ou email
- Import depuis Excel, export de la liste
- Notes internes par copropriétaire

---

### Module 3 — Cotisations et appels de fonds

Définir les cotisations de chaque résidence et calculer automatiquement la part de chaque lot.

**Données gérées**

| Donnée | Détail |
|---|---|
| Résidence | Résidence concernée |
| Type de cotisation | Cotisation syndic ou cotisation exceptionnelle |
| Nom de la cotisation | Exemple : Cotisation syndic année 2026 |
| Période | Du ... au ... (exemple : du 01/09/2026 au 31/08/2027) |
| Mode de calcul | Fixe ou par tantième, au choix pour chaque résidence |
| Montant | Par mois et par an |

**Règles de calcul**

- **Mode fixe :** grille de montants par catégorie de local (magasin, appartement selon superficie, duplex, pavillon, grande surface...).
- **Mode tantième :** coefficient = budget annuel ÷ total des tantièmes ; cotisation annuelle du lot = tantième × coefficient.
- Répartition mensuelle au prorata du nombre de jours de chaque mois, avec ajustement automatique des arrondis pour que le total soit exact.
- Cotisation exceptionnelle applicable à toute la résidence ou à certains immeubles.

**Documents**

- Appel de fonds par copropriétaire
- Tableau des cotisations par résidence (PDF, Excel)

---

### Module 4 — Règlements et reçus

Enregistrer chaque paiement et remettre un reçu au copropriétaire.

**Données gérées**

| Donnée | Détail |
|---|---|
| Date | Date du règlement |
| Résidence, N° immeuble, N° local | Le nom du copropriétaire s'affiche automatiquement |
| Type de cotisation | Cotisation concernée |
| Mode de règlement | Chèque, virement, versement, espèces (liste) |
| N° de pièce | Obligatoire pour un chèque ou un effet |
| Banque | Liste des banques |
| Montant du règlement | Montant total reçu |

**Fonctionnalités**

- Un règlement réparti sur plusieurs cotisations ou années. Exemple : un seul règlement peut solder les cotisations 2024, 2025 et 2026.
- Répartition automatique (de la plus ancienne à la plus récente) ou manuelle.
- Reçu de paiement PDF numéroté, avec QR code de vérification, envoyé par WhatsApp ou email.
- Paiement déclaré par le copropriétaire depuis son espace (avec justificatif), validé ou refusé par le gestionnaire.
- Annulation d'un règlement tracée dans l'historique.

---

### Module 5 — Budgets et dépenses

Préparer le budget de chaque résidence et suivre les dépenses réelles.

**Budget**

| Donnée | Détail |
|---|---|
| Type de budget | Budget prévisionnel ou hors budget |
| Nom du budget | Budget de fonctionnement ou budget d'investissement |
| Compte | Exemple : Prestation de gardiennage et nettoyage |
| Sous-compte | Exemple : Prestation gardiennage |
| Ligne budgétaire | Nombre × prix unitaire, montant mensuel et annuel calculés |

**Dépenses**

| Donnée | Détail |
|---|---|
| Date, résidence | Date et résidence concernée |
| Type de charge | Dépense ou intervention (une intervention peut avoir un montant de 0) |
| Type de budget, compte, sous-compte | Rattachement au budget |
| Montant, mode de règlement, N° pièce, banque | Détail du paiement |
| Répartition par immeuble | Exemple : une même dépense partagée entre les immeubles A, B et C |
| Fournisseur, justificatif | Facture ou photo jointe |

**Fonctionnalités**

- Comparaison budget prévu et réalisé
- Alerte en cas de dépassement d'un compte
- Liste des fournisseurs
- Export Excel et PDF

**Documents**

- Budget prévisionnel
- État des dépenses
- Budget prévu et réalisé

---

### Module 6 — Trésorerie

Suivre l'argent de chaque résidence sur une période.

| Donnée | Détail |
|---|---|
| Période | Du ... au ... |
| Solde initial | Solde de la banque en début de période |
| Total cotisations | Encaissements de la période (calcul automatique) |
| Total dépenses | Décaissements de la période (calcul automatique) |
| Solde final | Solde de la banque en fin de période, comparé au relevé bancaire |

**Documents**

- État de trésorerie

---

### Module 7 — Recouvrement

Suivre les impayés et automatiser les relances.

- Situation de chaque copropriétaire : dû, payé, reste à payer, détail par période.
- Situation des impayés, par résidence et par immeuble.
- Rappel de paiement automatique chaque fin de mois par WhatsApp et email.
- Mise en demeure pour les impayés de plus d'une année.
- Liste pour avocat : export des dossiers à transmettre.
- Historique de toutes les relances envoyées.

**Documents**

- Situation copropriétaire
- État des impayés
- Situation par résidence
- Lettre de rappel
- Mise en demeure
- Liste pour avocat

---

### Module 8 — Réclamations

Recevoir, traiter et suivre les réclamations des résidents.

| Donnée | Détail |
|---|---|
| Date et heure | Enregistrement automatique |
| Type de réclamation | Liste paramétrable (ascenseur, nettoyage, sécurité, fuite...) |
| Résidence, N° immeuble, N° local | Localisation |
| Description, photos | Détail du problème |
| Date et heure de traitement | Saisie à la clôture |
| Retour au client | Réponse envoyée au résident |

**Fonctionnalités**

- Réclamation créée par le gestionnaire, le copropriétaire ou l'assistant WhatsApp
- Statuts : nouvelle, en cours, traitée
- Échange de messages avec le résident
- Délai de traitement mesuré

---

### Module 9 — Assemblées générales et rapports

Préparer les assemblées générales et produire les documents officiels.

- Convocation AG : date, lieu, ordre du jour, envoi aux copropriétaires.
- Liste de présence et procurations.
- PV AG : modèle pré-rempli, résolutions et résultats des votes.
- Quitus (إبراء الذمة) : attestation pour un copropriétaire à jour de ses paiements.
- Rapport financier et rapport moral de l'exercice.
- Notes et informations : annonces aux résidents d'une résidence ou d'un immeuble.

**Documents**

- Convocation AG
- Liste de présence
- PV AG
- Quitus
- Rapport financier
- Rapport moral
- Appel de fonds

---

### Module 10 — Espace copropriétaire

Donner à chaque copropriétaire un accès personnel, sur ordinateur ou téléphone.

- Connexion sécurisée
- Tableau de bord : dû, payé, reste à payer
- Détail des cotisations
- Téléchargement des reçus
- Déclaration d'un paiement avec justificatif
- Envoi et suivi des réclamations
- Documents de la résidence (PV, règlement...)
- Annonces et informations
- Installation sur téléphone comme une application
- Français et arabe

---

### Module 11 — Connectivité IA : agent et MCP

Relier l'application à l'intelligence artificielle, de façon sécurisée.

**Assistant IA sur WhatsApp**

- Le résident est reconnu par son numéro de téléphone.
- Il peut demander son solde, recevoir ses reçus et déposer une réclamation.
- Transfert vers un gestionnaire quand l'assistant ne peut pas répondre.

**Serveur MCP et API**

- Serveur MCP pour connecter Claude, ChatGPT ou d'autres outils IA aux données de l'application.
- Questions en langage naturel : « Qui n'a pas payé ce mois-ci ? », « Quel est le solde de la résidence ? ».
- Actions sensibles (envoi de rappels, modifications) soumises à validation.
- Accès par clés sécurisées et révocables, chaque échange est journalisé.
- API documentée pour connecter de futurs outils.

---

### Module 12 — Site web vitrine

Présenter KHALLOUFI NEGOCE et attirer de nouvelles résidences.

- Pages : accueil, services, références, à propos, contact
- Formulaire de contact et demande de devis
- Accès direct à l'espace copropriétaire
- Contenu modifiable depuis l'administration
- Référencement Google (SEO de base, plan du site)
- Français et arabe, adapté au mobile

---

## 4. Documents générés

| Document | Format et utilisation |
|---|---|
| Reçu de paiement | PDF numéroté avec QR code, envoi WhatsApp ou email |
| Appel de fonds | PDF par copropriétaire ou par résidence |
| Situation de chaque copropriétaire | PDF, relevé détaillé par période |
| Situation des impayés | PDF et Excel, par résidence et immeuble |
| Situation des copropriétaires par résidence | PDF et Excel |
| Rappel de paiement | Message automatique chaque fin de mois |
| Mise en demeure | PDF, impayés de plus d'une année |
| Liste pour avocat | Excel et PDF |
| Convocation AG et PV AG | PDF |
| Quitus (إبراء الذمة) | PDF |
| Rapport financier et rapport moral | PDF |
| Budget prévisionnel, état des dépenses | PDF et Excel |
| État de trésorerie | PDF |

Tous les documents portent l'en-tête de KHALLOUFI NEGOCE et du syndicat de la résidence concernée.

---

## 5. Exigences techniques et sécurité

- Application web hébergée, accessible par internet (HTTPS)
- Compatible ordinateur, tablette et téléphone
- Mots de passe chiffrés, sessions sécurisées
- Droits par module et par résidence
- Journal d'audit : qui a fait quoi et quand
- Corbeille : restauration des éléments supprimés
- Sauvegarde automatique quotidienne de la base de données
- Exports Excel et PDF
- Interface en français et arabe
- Données hébergées sur un serveur dédié au client

---

## 6. Planning et livraison

| Étape | Contenu |
|---|---|
| **1. Frontend** | Conception des écrans et de l'interface, validés avec vous |
| **2. Backend** | Base de données, calculs, documents PDF, connectivité IA |
| **3. Phase de test** | Version de démonstration testée et validée par vous |
| **4. Livraison** | Reprise des données, formation, mise en ligne |

**Durée totale :** 5 semaines. **Garantie** de 3 mois après la livraison.

---

## 7. Éléments à fournir par le client

- Logo et couleurs de la société
- Liste des résidences, immeubles et lots (Excel)
- Liste des copropriétaires et leurs coordonnées
- Tantièmes ou grille de cotisation de chaque résidence
- Budgets et périodes d'exercice
- Soldes bancaires d'ouverture et impayés antérieurs
- Modèles souhaités (mise en demeure, PV, quitus)
- Numéro WhatsApp Business dédié
- Nom de domaine souhaité pour le site
- Textes et photos pour le site vitrine

**Frais externes à la charge du client :** hébergement, nom de domaine et consommation du service d'intelligence artificielle selon l'usage.

---

## 8. Hors périmètre

- Comptabilité générale et déclarations fiscales
- Gestion RH et paie du personnel
- Paiement en ligne par carte bancaire
- Publication sur App Store et Google Play

Ces éléments peuvent faire l'objet d'un devis complémentaire.

---

## 9. Validation

Le présent cahier des charges décrit le périmètre fonctionnel de l'application. Toute modification fera l'objet d'un avenant validé par les deux parties.
