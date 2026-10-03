import type { UserRole } from './enums.types';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  type?: string;
  status?: string;
  username: string;
  is_active: boolean;
  roles?: string[];
  permissions?: string[];
  created_at: string;
}

export interface Residence {
  id: number;
  nom: string;
  ville: string;
  adresse: string;
  nb_immeubles: number;
  nb_appartements?: number;
  syndic_id: number;
  created_at: string;
  syndic?: User;
  periodes?: Periode[];
  immeubles?: Immeuble[];
}

export interface Immeuble {
  id: number;
  nom: string;
  residence_id: number;
  residence?: Residence;
  appartements?: Appartement[];
}

export interface Appartement {
  id: number;
  numero: string;
  etage: number;
  immeuble_id: number;
  residence_id: number;
  coproprietaire_id: number | null;
  tantieme: number;
  deleted_at?: string | null;
  created_at: string;
  immeuble?: Immeuble;
  residence?: Residence;
  coproprietaire?: User | null;
}

export interface CompteCharge {
  id: number;
  nom: string;
  description: string | null;
  is_active: boolean;
  residence_id: number;
  nb_sous_charges?: number;
  created_at: string;
  sous_charges?: SousCharge[];
}

export interface SousCharge {
  id: number;
  nom: string;
  description: string | null;
  compte_charge_id: number;
  residence_id: number;
  created_at: string;
  compte_charge?: CompteCharge;
}

export interface Depense {
  id: number;
  sous_charge_id: number;
  residence_id: number;
  date: string;
  montant: number;
  description: string;
  has_justificatif: boolean;
  justificatif_url: string | null;
  created_at: string;
  sous_charge?: SousCharge & { compte_charge?: { id: number; nom: string } };
}

export interface HorsBudget {
  id: number;
  residence_id: number;
  date: string;
  montant: number;
  description: string;
  has_justificatif: boolean;
  justificatif_url: string | null;
  created_at: string;
}

export interface Periode {
  id: number;
  residence_id: number;
  annee: number;
  is_active: boolean;
  date_debut: string;
  date_fin: string;
  created_at: string;
}

export interface BudgetPrevisionnel {
  id: number;
  periode_id: number;
  compte_charge_id: number;
  montant_prevu: number;
  montant_consomme: number;
  montant_restant: number;
  pourcentage_consomme: number;
  est_depasse: boolean;
  compte_charge?: CompteCharge;
  sous_charges_detail?: SousChargeDetail[];
}

export interface SousChargeDetail {
  sous_charge: SousCharge;
  consomme: number;
}

export interface BudgetSummary {
  prevu_total: number;
  consomme_total: number;
  restant_total: number;
  hors_budget_total: number;
  par_compte: BudgetPrevisionnel[];
}

export interface Cotisation {
  id: number;
  residence_id: number;
  periode_id: number;
  type: 'fixe' | 'exceptionnelle';
  label: string;
  montant_total: number;
  montant_mensuel: number | null;
  mode_repartition: 'egale' | 'par_appartement' | 'par_tantieme' | null;
  mois: number | null;
  annee: number | null;
  description: string | null;
  details?: CotisationDetail[];
  periode?: Periode;
}

export interface CotisationDetail {
  id: number;
  cotisation_id: number;
  appartement_id: number;
  coproprietaire_id: number;
  montant: number;
  montant_paye: number;
  montant_restant: number;
  statut: 'non_paye' | 'partiellement_paye' | 'paye';
  statut_label?: string;
  anciennete_jours?: number;
  created_at: string;
  appartement?: Appartement;
  coproprietaire?: User;
  cotisation?: { id: number; label: string; type: string };
  paiements?: Paiement[];
}

export interface Paiement {
  id: number;
  cotisation_detail_id: number;
  coproprietaire_id: number;
  date_paiement: string;
  montant: number;
  mode_paiement: 'especes' | 'virement' | 'cheque' | 'carte';
  mode_paiement_label?: string;
  reference: string | null;
  has_recu: boolean;
  recu_url: string | null;
  created_at: string;
  coproprietaire?: User;
  cotisation_detail?: CotisationDetail;
}

export interface Reclamation {
  id: number;
  coproprietaire_id: number;
  residence_id: number;
  appartement_id: number;
  titre: string;
  description: string;
  statut: 'nouveau' | 'en_cours' | 'traite' | 'rejete';
  statut_label?: string;
  priorite: 'normale' | 'urgente';
  priorite_label?: string;
  reponse_syndic: string | null;
  date_reponse: string | null;
  anciennete_jours?: number;
  created_at: string;
  updated_at?: string;
  coproprietaire?: User;
  residence?: Residence;
  appartement?: Appartement;
}