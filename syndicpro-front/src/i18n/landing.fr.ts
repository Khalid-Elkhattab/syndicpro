export interface FaqItem {
  q: string;
  a: string;
}

export interface LandingStrings {
  locale: 'fr' | 'ar';
  dir: 'ltr' | 'rtl';
  meta: { title: string; description: string };
  header: {
    features: string;
    audiences: string;
    sales: string;
    security: string;
    faq: string;
    contact: string;
    login: string;
    loginCopro: string;
    loginCoproHint: string;
    loginStaff: string;
    loginStaffHint: string;
    demo: string;
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    sub: string;
    primary: string;
    secondary: string;
    tertiary: string;
    micro: string;
    mockupCaption: string;
    dashboardTitle: string;
    collected: string;
    salesProgress: string;
    portalTitle: string;
    due: string;
    paid: string;
    remaining: string;
    receipt: string;
  };
  espace: {
    title: string;
    loginTitle: string;
    loginText: string;
    loginCopro: string;
    loginStaff: string;
    firstTitle: string;
    firstText: string;
    firstCta: string;
    forgotTitle: string;
    forgotText: string;
    forgotCta: string;
    note: string;
  };
  audiences: {
    title: string;
    cards: { title: string; text: string; cta: string }[];
  };
  beforeAfter: {
    title: string;
    beforeTitle: string;
    before: string[];
    afterTitle: string;
    after: string[];
  };
  features: { title: string; sub: string; items: { title: string; text: string }[] };
  platform: {
    title: string;
    managersTab: string;
    ownersTab: string;
    managers: string[];
    owners: string[];
  };
  sales: {
    title: string;
    intro: string;
    legendSold: string;
    legendUnsold: string;
    legendPending: string;
    bullets: string[];
    sellerTitle: string;
    seller: string[];
    buyerTitle: string;
    buyer: string[];
    reassurance: string;
  };
  access: { title: string; cta: string; steps: { title: string; text: string }[] };
  documents: {
    title: string;
    text: string;
    items: string[];
    verifyTitle: string;
    verifyText: string;
    verifyPlaceholder: string;
    verifyCta: string;
  };
  automation: {
    title: string;
    remindersTitle: string;
    remindersText: string;
    assistantTitle: string;
    assistantText: string;
    aiTitle: string;
    aiText: string;
  };
  team: { title: string; roles: { title: string; text: string }[]; facts: string[] };
  security: { title: string; intro: string; points: string[]; note: string };
  faq: { title: string; managersTab: string; ownersTab: string; managers: FaqItem[]; owners: FaqItem[] };
  demo: {
    title: string;
    bullets: string[];
    contactTitle: string;
    demoTab: string;
    contactTab: string;
    name: string;
    email: string;
    phone: string;
    organization: string;
    role: string;
    roles: string[];
    residencesCount: string;
    lotsCount: string;
    currentTool: string;
    tools: string[];
    message: string;
    consent: string;
    privacyLink: string;
    submitDemo: string;
    submitContact: string;
    emailOrPhone: string;
    successTitle: string;
    successText: string;
    reference: string;
  };
  final: { title: string; demo: string; space: string };
  footer: {
    tagline: string;
    product: string;
    coproSpace: string;
    coproLogin: string;
    coproFirst: string;
    coproForgot: string;
    staffSpace: string;
    staffLogin: string;
    contact: string;
    legal: string;
    mentions: string;
    privacy: string;
    language: string;
    rights: string;
  };
  legal: {
    mentionsTitle: string;
    privacyTitle: string;
    draftNotice: string;
    publisher: string;
    address: string;
    registration: string;
    host: string;
    notProvided: string;
    privacyIntro: string;
    privacyCollected: string;
    privacyWhy: string;
    privacyRights: string;
  };
  common: {
    soon: string;
    backHome: string;
    illustrativeOnly: string;
  };
}

export const fr: LandingStrings = {
  locale: 'fr',
  dir: 'ltr',
  meta: {
    title: '{app} — Logiciel de gestion de syndic de copropriété',
    description:
      'Gérez vos copropriétés sans Excel, en toute transparence : cotisations, reçus, recouvrement, budgets, assemblées générales et espace personnel pour chaque copropriétaire, en français et en arabe.',
  },
  header: {
    features: 'Fonctionnalités',
    audiences: 'Pour qui',
    sales: 'Ventes',
    security: 'Sécurité',
    faq: 'FAQ',
    contact: 'Contact',
    login: 'Se connecter',
    loginCopro: 'Espace copropriétaire',
    loginCoproHint: 'Identifiant de votre local',
    loginStaff: 'Espace gestion',
    loginStaffHint: 'Email professionnel',
    demo: 'Demander une démo',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
  },
  hero: {
    eyebrow: 'Logiciel de gestion de syndic de copropriété',
    title: 'Gérez vos copropriétés sans Excel, en toute transparence.',
    sub: '{app} réunit cotisations, reçus, recouvrement, budgets, assemblées générales et un espace personnel pour chaque copropriétaire, en français et en arabe.',
    primary: 'Demander une démo',
    secondary: 'Accéder à mon espace',
    tertiary: 'Copropriétaire ? Première connexion →',
    micro: 'Plusieurs résidences dans une seule application · Un accès personnel par local · Français et العربية',
    mockupCaption: 'Aperçu illustratif avec des données fictives',
    dashboardTitle: 'Tableau de bord syndic',
    collected: 'Encaissé ce mois',
    salesProgress: 'Lots vendus',
    portalTitle: 'Mon espace',
    due: 'Dû',
    paid: 'Payé',
    remaining: 'Reste',
    receipt: 'Reçu n° REC-2026-000123',
  },
  espace: {
    title: 'Déjà inscrit ?',
    loginTitle: 'Se connecter',
    loginText:
      'Copropriétaire : utilisez l’identifiant de votre local (exemple : JARD1-B-A12). Équipe de gestion : utilisez votre email.',
    loginCopro: 'Espace copropriétaire',
    loginStaff: 'Espace gestion',
    firstTitle: 'Première connexion',
    firstText:
      'Vous avez reçu un lien d’activation ? Ouvrez-le pour choisir votre mot de passe. Pas de lien ? Demandez votre accès à votre syndic.',
    firstCta: 'Demander mon accès',
    forgotTitle: 'Mot de passe oublié',
    forgotText:
      'Saisissez votre identifiant : un lien de réinitialisation est envoyé au contact enregistré pour votre local.',
    forgotCta: 'Réinitialiser',
    note: 'Un identifiant par local : si vous possédez plusieurs locaux, vous aurez un accès pour chacun.',
  },
  audiences: {
    title: 'Pour qui ?',
    cards: [
      {
        title: 'Syndics professionnels et sociétés de gestion',
        text: 'Plusieurs résidences dans une seule application, équipe avec rôles et droits, comparaison entre résidences.',
        cta: 'Voir les fonctionnalités',
      },
      {
        title: 'Syndics bénévoles et associations',
        text: 'Fini les fichiers Excel, des rapports prêts pour l’assemblée générale, des comptes clairs pour tous.',
        cta: 'Demander une démo',
      },
      {
        title: 'Copropriétaires et résidents',
        text: 'Suivez vos cotisations, téléchargez vos reçus, signalez un problème, depuis votre téléphone.',
        cta: 'Mon espace',
      },
    ],
  },
  beforeAfter: {
    title: 'Fini Excel, WhatsApp et papier',
    beforeTitle: 'Avant',
    before: [
      'Fichiers Excel dispersés',
      'Reçus papier',
      'Relances faites à la main',
      'Questions des résidents par téléphone',
      'Historique perdu à chaque changement de gestionnaire',
    ],
    afterTitle: 'Avec {app}',
    after: [
      'Une seule base partagée',
      'Reçus numérotés avec QR',
      'Relances automatiques',
      'Espace personnel pour chaque copropriétaire',
      'Historique complet de chaque local',
    ],
  },
  features: {
    title: 'Tout ce qu’un syndic fait au quotidien',
    sub: 'Douze modules qui travaillent sur les mêmes données.',
    items: [
      { title: 'Résidences et locaux', text: 'Immeubles, appartements, duplex, magasins, bureaux, tantièmes ; import CSV avec aperçu avant validation.' },
      { title: 'Cotisations et appels de fonds', text: 'Calcul fixe ou par tantième, au prorata des jours, avec arrondis exacts.' },
      { title: 'Règlements et reçus', text: 'Chèque, virement, versement, espèces ; un règlement peut solder plusieurs périodes ; reçu numéroté avec QR.' },
      { title: 'Budgets et dépenses', text: 'Budget prévisionnel, hors budget, fonctionnement ou investissement ; comparé prévu / réalisé et alertes de dépassement.' },
      { title: 'Trésorerie', text: 'Solde initial, encaissements, dépenses, solde final rapproché du relevé bancaire.' },
      { title: 'Recouvrement', text: 'Situation des impayés, rappels automatiques de fin de mois, mises en demeure, liste pour avocat.' },
      { title: 'Réclamations et interventions', text: 'Signalement avec photos, suivi par statut, délai de traitement mesuré.' },
      { title: 'Assemblées générales', text: 'Convocations, listes de présence et procurations, votes pondérés par les tantièmes, PV.' },
      { title: 'Documents officiels', text: 'Générés à l’en-tête de chaque résidence, numérotés, versionnés.' },
      { title: 'Tableaux de bord', text: 'Évolution des charges et des budgets par résidence et par immeuble, comparaison entre résidences.' },
      { title: 'Ventes et changements de propriétaire', text: 'Lots vendus / invendus, quitus, historique complet de chaque local.' },
      { title: 'Traçabilité', text: 'Journal de toutes les opérations, corbeille, annulation plutôt que suppression pour les paiements.' },
    ],
  },
  platform: {
    title: 'Une plateforme pour toute la copropriété',
    managersTab: 'Pour les gestionnaires',
    ownersTab: 'Pour les copropriétaires',
    managers: [
      'Équipe avec rôles : super admin, syndic, assistants',
      'Droits par module et par résidence',
      'Validation des suppressions',
      'Relances et documents envoyés par WhatsApp ou email',
      'Historique de chaque local',
      'Tableaux de bord et comparaison entre résidences',
      'Exports Excel et PDF',
    ],
    owners: [
      'Tableau de bord : dû, payé, reste à payer',
      'Détail des cotisations mois par mois',
      'Reçus PDF',
      'Déclaration d’un paiement avec justificatif',
      'Réclamations avec photos et suivi',
      'Documents et annonces de la résidence',
      'Français et arabe',
      'Installable sur le téléphone comme une application',
    ],
  },
  sales: {
    title: 'Résidences neuves et ventes de lots : tout est suivi.',
    intro:
      'Sur les résidences neuves, les immeubles appartiennent au promoteur jusqu’à la vente de chaque lot. {app} suit chaque lot du promoteur jusqu’au propriétaire actuel.',
    legendSold: 'Vendu',
    legendUnsold: 'Invendu',
    legendPending: 'Vente en cours',
    bullets: [
      'Les lots invendus sont facturés au promoteur comme à tout propriétaire.',
      'Chaque immeuble affiche « Non vendu », « Partiellement vendu » ou « Entièrement vendu ».',
      'L’historique de chaque lot, du promoteur au propriétaire actuel, reste consultable par la gestion.',
    ],
    sellerTitle: 'Vendeur',
    seller: [
      'Contactez le syndic.',
      'Réglez vos cotisations échues.',
      'Obtenez votre quitus (إبراء الذمة).',
      'Remettez-le lors de la vente.',
    ],
    buyerTitle: 'Acquéreur',
    buyer: [
      'Déclarez-vous auprès du syndic, en ligne ou en personne.',
      'Présentez votre CIN et le contrat de vente (pièces exactes à confirmer par votre syndic).',
      'Après vérification, vous recevez un lien pour choisir votre mot de passe.',
    ],
    reassurance:
      'L’accès du local passe au nouveau propriétaire. Les informations des anciens propriétaires restent confidentielles.',
  },
  access: {
    title: 'Comment obtenir votre accès',
    cta: 'Demander mon accès',
    steps: [
      { title: 'Votre local est enregistré', text: 'Le syndic crée l’accès de votre local, avec un identifiant fixe.' },
      { title: 'Vous recevez votre lien', text: 'Par WhatsApp ou email, ou vous demandez votre accès en ligne.' },
      { title: 'Vous choisissez votre mot de passe', text: 'Vous seul le connaissez ; le lien ne fonctionne qu’une fois.' },
      { title: 'Vous suivez votre situation', text: 'Cotisations, reçus, réclamations et documents.' },
    ],
  },
  documents: {
    title: 'Tous les documents officiels, générés pour vous.',
    text: 'Chaque document est numéroté, daté et porte l’en-tête de la résidence. Les reçus et les quitus portent un QR code qui permet d’en vérifier l’authenticité.',
    items: [
      'Reçu de paiement', 'Appel de fonds', 'Situation du copropriétaire', 'Situation des impayés',
      'Rappel de paiement', 'Mise en demeure', 'Liste pour avocat', 'Convocation d’assemblée générale',
      'PV d’assemblée générale', 'Quitus', 'Rapport financier', 'Rapport moral',
      'Budget prévisionnel', 'État des dépenses', 'État de trésorerie',
    ],
    verifyTitle: 'Vérifier un document',
    verifyText: 'Saisissez le code figurant sous le QR code.',
    verifyPlaceholder: 'Ex : REC-2026-000123',
    verifyCta: 'Vérifier',
  },
  automation: {
    title: 'Automatismes utiles, sans complexité',
    remindersTitle: 'Relances automatiques',
    remindersText:
      'Relances de fin de mois par WhatsApp ou email, avec un seul message regroupé par propriétaire même s’il possède plusieurs lots.',
    assistantTitle: 'Un assistant sur WhatsApp',
    assistantText:
      'Le résident, reconnu par son numéro, demande son solde, reçoit ses reçus et signale un problème ; un gestionnaire prend le relais si besoin.',
    aiTitle: 'Connectez vos outils d’IA',
    aiText:
      'Un serveur MCP et une API documentée pour interroger vos données en langage naturel (« Qui n’a pas payé ce mois-ci ? ») ; les actions sensibles demandent une validation ; chaque échange est journalisé.',
  },
  team: {
    title: 'Chaque personne voit ce qu’elle doit voir.',
    roles: [
      { title: 'Super admin', text: 'Tout, y compris les paramètres.' },
      { title: 'Syndic', text: 'Ses résidences, ses assistants, la validation des demandes d’accès.' },
      { title: 'Assistants', text: 'Uniquement les tâches que le syndic leur confie, jamais plus que lui.' },
      { title: 'Copropriétaires', text: 'Leur local seulement.' },
    ],
    facts: [
      'Les comptes sont créés par invitation, personne ne tape le mot de passe d’un autre.',
      'Les suppressions demandées par un assistant passent par une validation.',
      'Toutes les opérations sont journalisées.',
    ],
  },
  security: {
    title: 'Sécurité et confidentialité',
    intro: 'Des règles simples et vérifiables :',
    points: [
      'Accès personnel par local.',
      'Chaque copropriétaire ne voit que la situation de son local.',
      'Mot de passe choisi par l’utilisateur, jamais communiqué.',
      'Liens d’activation à usage unique.',
      'Mots de passe chiffrés et connexion HTTPS.',
      'Sauvegarde automatique quotidienne.',
      'Journal de toutes les opérations.',
      'Droits par rôle, par module et par résidence.',
    ],
    note: 'Les données personnelles des copropriétaires ne sont visibles que par l’équipe de gestion de leur résidence.',
  },
  faq: {
    title: 'Questions fréquentes',
    managersTab: 'Gestionnaires',
    ownersTab: 'Copropriétaires',
    managers: [
      { q: 'Faut-il installer un logiciel ?', a: 'Non. {app} est une application web : elle fonctionne sur ordinateur, tablette et téléphone, sans rien installer.' },
      { q: 'Puis-je importer mes données Excel ?', a: 'Oui. L’import CSV affiche un aperçu avant validation : rien n’est enregistré tant que vous ne confirmez pas.' },
      { q: 'Puis-je gérer plusieurs résidences ?', a: 'Oui. Plusieurs résidences vivent dans une seule application, avec des tableaux de bord par résidence et des comparaisons entre résidences.' },
      { q: 'Comment mes assistants travaillent-ils avec moi ?', a: 'Vous créez leur compte et vous choisissez leurs droits, par module et par résidence. Ils ne voient jamais plus que vous.' },
      { q: 'Comment mes copropriétaires accèdent-ils à leur espace ?', a: 'Chaque local reçoit un identifiant fixe. Le propriétaire choisit son mot de passe grâce à un lien à usage unique envoyé par WhatsApp ou email.' },
      { q: 'Comment sont gérées la vente d’un lot et les lots du promoteur ?', a: 'Les lots invendus sont facturés au promoteur comme à tout propriétaire. Lors d’une vente, le vendeur règle ses cotisations et obtient un quitus ; l’acquéreur se déclare avec sa CIN et son contrat de vente.' },
      { q: 'Les documents existent-ils en français et en arabe ?', a: 'Oui. L’interface, les documents et les communications existent dans les deux langues.' },
      { q: 'Puis-je exporter mes données ?', a: 'Oui, en Excel et en PDF : situations, rapports, listes et tableaux de bord.' },
      { q: 'Mes données sont-elles sauvegardées ?', a: 'Oui, une sauvegarde automatique quotidienne est effectuée.' },
      { q: 'Comment demander une démo ?', a: 'Remplissez le formulaire de démonstration plus bas sur cette page : nous vous recontacterons.' },
    ],
    owners: [
      { q: 'Comment obtenir mon accès ?', a: 'Votre syndic crée l’accès de votre local. Vous recevez alors un lien par WhatsApp ou email pour choisir votre mot de passe. Sans lien, utilisez le bouton « Demander mon accès ».' },
      { q: 'Je n’ai pas reçu mon lien, que faire ?', a: 'Vérifiez le numéro de téléphone et l’email connus de votre syndic, puis demandez-lui de renvoyer le lien.' },
      { q: 'J’ai oublié mon mot de passe', a: 'Utilisez « Mot de passe oublié » avec votre identifiant : un lien de réinitialisation est envoyé au contact enregistré pour votre local.' },
      { q: 'Je possède plusieurs locaux : ai-je plusieurs comptes ?', a: 'Oui. Il y a un identifiant par local : un accès pour chacun de vos locaux.' },
      { q: 'Je viens d’acheter un bien, que dois-je faire ?', a: 'Déclarez-vous auprès du syndic, en ligne ou en personne, avec votre CIN et votre contrat de vente. Après vérification, vous recevez votre lien d’activation.' },
      { q: 'Je vends mon bien, quelles démarches ?', a: 'Contactez le syndic, réglez vos cotisations échues et obtenez votre quitus. Remettez-le lors de la vente.' },
      { q: 'Comment déclarer un paiement ?', a: 'Depuis votre espace, déclarez le montant, la date et le mode de règlement, avec une photo du justificatif. Le syndic le valide.' },
      { q: 'Où retrouver mes reçus et documents ?', a: 'Dans votre espace, rubriques Reçus et Documents. Chaque reçu porte un numéro et un QR code de vérification.' },
      { q: 'Comment signaler un problème ?', a: 'Depuis votre espace, décrivez le problème, ajoutez des photos si besoin, et suivez son traitement.' },
      { q: 'Mes informations sont-elles visibles par les autres copropriétaires ?', a: 'Non. Vous ne voyez que la situation de votre local. Vos informations personnelles ne sont visibles que par l’équipe de gestion.' },
    ],
  },
  demo: {
    title: 'Voyons si {app} convient à vos résidences.',
    bullets: [
      'Une démonstration sur vos cas réels',
      'Quelques champs suffisent',
      'Nous vous recontactons',
    ],
    contactTitle: 'Contact',
    demoTab: 'Demander une démo',
    contactTab: 'Nous contacter',
    name: 'Nom complet',
    email: 'Email professionnel',
    phone: 'Téléphone',
    organization: 'Organisme',
    role: 'Vous êtes',
    roles: ['Syndic professionnel', 'Syndic bénévole', 'Association de copropriétaires', 'Promoteur', 'Autre'],
    residencesCount: 'Nombre de résidences',
    lotsCount: 'Nombre approximatif de lots',
    currentTool: 'Outil actuel',
    tools: ['Excel', 'Autre logiciel', 'Papier', 'Rien'],
    message: 'Message',
    consent: 'J’accepte que mes informations soient utilisées pour répondre à ma demande.',
    privacyLink: 'Politique de confidentialité',
    submitDemo: 'Envoyer ma demande',
    submitContact: 'Envoyer',
    emailOrPhone: 'Email ou téléphone (au moins l’un des deux)',
    successTitle: 'Demande envoyée !',
    successText: 'Merci, votre demande a bien été reçue. Conservez cette référence :',
    reference: 'Référence',
  },
  final: {
    title: 'Prêt à remplacer vos fichiers Excel ?',
    demo: 'Demander une démo',
    space: 'Accéder à mon espace',
  },
  footer: {
    tagline: 'La gestion de syndic de copropriété, sans Excel, en toute transparence.',
    product: 'Produit',
    coproSpace: 'Espace copropriétaire',
    coproLogin: 'Connexion',
    coproFirst: 'Première connexion',
    coproForgot: 'Mot de passe oublié',
    staffSpace: 'Espace gestion',
    staffLogin: 'Connexion',
    contact: 'Contact',
    legal: 'Légal',
    mentions: 'Mentions légales',
    privacy: 'Politique de confidentialité',
    language: 'Langue',
    rights: 'Tous droits réservés.',
  },
  legal: {
    mentionsTitle: 'Mentions légales',
    privacyTitle: 'Politique de confidentialité',
    draftNotice: 'Texte provisoire — À valider par un professionnel avant publication. Ceci n’est pas un avis juridique.',
    publisher: 'Éditeur',
    address: 'Adresse',
    registration: 'Immatriculation (RC / ICE)',
    host: 'Hébergeur',
    notProvided: 'Non renseigné',
    privacyIntro:
      'Cette page explique quelles données les formulaires de ce site collectent, pourquoi, combien de temps elles sont conservées, et vos droits, conformément à la loi marocaine 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel et à la CNDP.',
    privacyCollected: 'Les formulaires collectent : nom, email, téléphone, organisme, message. Aucune autre donnée n’est collectée sur ce site.',
    privacyWhy: 'Ces données servent uniquement à répondre à votre demande (démo ou contact).',
    privacyRights: 'Vous disposez d’un droit d’accès, de rectification et d’opposition. Contactez-nous pour exercer vos droits.',
  },
  common: {
    soon: 'Bientôt disponible',
    backHome: 'Retour à l’accueil',
    illustrativeOnly: 'Illustration',
  },
};
