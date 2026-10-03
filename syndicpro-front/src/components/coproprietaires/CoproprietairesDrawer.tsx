import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from '@/lib/motion';
import { X, Edit2, Key, ChevronRight, Mail, Phone, User as UserIcon, Calendar } from 'lucide-react';
import { useCoproprietaire } from '@/hooks/useCoproprietaires';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { User } from '@/types/entities.types';

interface CoproprietairesDrawerProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
}

type Tab = 'appartements' | 'cotisations' | 'paiements' | 'reclamations';

export function CoproprietairesDrawer({ user, onClose, onEdit, onResetPassword }: CoproprietairesDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('appartements');
  const { data: enrichedUser, isLoading } = useCoproprietaire(user.id);
  const shouldReduceMotion = useReducedMotion();

  const displayUser = enrichedUser ?? user;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'appartements', label: 'Lots' },
    { key: 'cotisations', label: 'Cotisations' },
    { key: 'paiements', label: 'Paiements' },
    { key: 'reclamations', label: 'Réclamations' },
  ];

  const tabsWithCounts = tabs.map((tab) => {
    let count = 0;
    if ('appartements' in displayUser && displayUser.appartements) {
      count = (displayUser as User & { appartements?: { id: number }[] }).appartements!.length;
    }
    return { ...tab, count };
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={shouldReduceMotion ? { x: 0 } : { x: '100%' }}
        animate={{ x: 0 }}
        exit={shouldReduceMotion ? { x: 0 } : { x: '100%' }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-drawer z-50 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{displayUser.name}</h2>
            <p className="text-sm text-text-muted">{displayUser.username}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-surface-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-lg font-semibold text-brand-600">
              {displayUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge isActive={displayUser.is_active} />
              {'nb_appartements' in displayUser && (
                <span className="text-xs text-text-muted">
                  {(displayUser as User & { nb_appartements?: number }).nb_appartements ?? 0} lot(s).
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary">{displayUser.email}</p>
          </div>
        </div>

        <div className="px-6 py-3 bg-surface-50 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Mail className="w-4 h-4 text-text-muted" />
            <span>{displayUser.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Phone className="w-4 h-4 text-text-muted" />
            <span>{displayUser.phone ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <UserIcon className="w-4 h-4 text-text-muted" />
            <span>{displayUser.username}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Calendar className="w-4 h-4 text-text-muted" />
            <span>Inscrit le {formatDate(displayUser.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 px-6 py-2 border-b border-surface-200 overflow-x-auto">
          {tabsWithCounts.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-100'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-brand-100 text-brand-600' : 'bg-surface-200 text-text-muted'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-surface-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <TabContent tab={activeTab} user={displayUser} />
          )}
        </div>

        <div className="px-6 py-4 border-t border-surface-200 flex gap-3">
          <button
            onClick={onResetPassword}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg"
          >
            <Key className="w-4 h-4" /> Réinitialiser MDP
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg ml-auto"
          >
            <Edit2 className="w-4 h-4" /> Modifier
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TabContent({ tab, user }: { tab: Tab; user: User }) {
  const u = user as unknown as Record<string, unknown>;
  switch (tab) {
    case 'appartements': {
      const appartements = u.appartements as Array<{
        id: number;
        numero: string;
        etage: number;
        residence?: { nom: string };
        immeuble?: { nom: string };
      }> | undefined;
      if (!appartements?.length) {
        return <EmptyState title="Aucun lot" description="Aucun lot associé." />;
      }
      return (
        <div className="space-y-3">
          {appartements.map((apt) => (
            <div key={apt.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg border border-surface-200">
              <div>
                <p className="text-sm font-medium text-text-primary">{apt.numero}</p>
                <p className="text-xs text-text-muted">
                  {apt.immeuble?.nom ?? 'Immeuble inconnu'} · Étage {apt.etage}
                </p>
                <p className="text-xs text-text-muted">{apt.residence?.nom ?? 'Résidence inconnu'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </div>
          ))}
        </div>
      );
    }

    case 'cotisations': {
      const details = u.cotisation_details as Array<{
        id: number;
        montant: number;
        montant_paye: number;
        montant_restant: number;
        statut: string;
        appartement?: { numero: string };
      }> | undefined;
      if (!details?.length) {
        return <EmptyState type="budget" title="Aucune cotisation" description="Aucune cotisation trouvée." />;
      }
      return (
        <div className="space-y-3">
          {details.map((detail) => (
            <div key={detail.id} className="p-3 bg-surface-50 rounded-lg border border-surface-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">
                  {detail.appartement?.numero ?? 'Lot #' + detail.id}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  detail.statut === 'paye' ? 'bg-success/10 text-success' :
                  detail.statut === 'partiellement_paye' ? 'bg-warning/10 text-warning' :
                  'bg-error/10 text-error'
                }`}>
                  {detail.statut === 'paye' ? 'Payé' :
                   detail.statut === 'partiellement_paye' ? 'Partiel' : 'Dû'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Montant</span>
                  <span className="text-text-secondary font-medium">{formatCurrency(detail.montant)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Payé</span>
                  <span className="text-text-secondary">{formatCurrency(detail.montant_paye)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Restant</span>
                  <span className="text-error font-medium">{formatCurrency(detail.montant_restant)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'paiements': {
      const paiements = u.paiements as Array<{
        id: number;
        montant: number;
        date_paiement: string;
        mode_paiement: string;
        reference: string | null;
      }> | undefined;
      if (!paiements?.length) {
        return <EmptyState type="payment" title="Aucun paiement" description="Aucun paiement trouvé." />;
      }
      const modeLabels: Record<string, string> = {
        especes: 'Espèces',
        virement: 'Virement',
        cheque: 'Chèque',
        carte: 'Carte bancaire',
      };
      return (
        <div className="space-y-3">
          {paiements.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg border border-surface-200">
              <div>
                <p className="text-sm font-semibold text-text-primary">{formatCurrency(p.montant)}</p>
                <p className="text-xs text-text-muted">
                  {formatDate(p.date_paiement)} · {modeLabels[p.mode_paiement] ?? p.mode_paiement}
                </p>
                {p.reference && <p className="text-xs text-text-muted">Réf: {p.reference}</p>}
              </div>
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <span className="text-xs font-medium text-success">✓</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'reclamations': {
      const reclamations = u.reclamations as Array<{
        id: number;
        titre: string;
        statut: string;
        priorite: string;
        created_at: string;
        residence?: { nom: string };
        appartement?: { numero: string };
      }> | undefined;
      if (!reclamations?.length) {
        return <EmptyState type="reclamation" title="Aucune réclamation" description="Aucune réclamation trouvée." />;
      }
      const statutLabels: Record<string, string> = {
        nouveau: 'Nouveau',
        en_cours: 'En cours',
        traite: 'Traité',
        rejete: 'Rejeté',
      };
      const statutColors: Record<string, string> = {
        nouveau: 'bg-blue-100 text-blue-700',
        en_cours: 'bg-warning/10 text-warning',
        traite: 'bg-success/10 text-success',
        rejete: 'bg-error/10 text-error',
      };
      return (
        <div className="space-y-3">
          {reclamations.map((r) => (
            <div key={r.id} className="p-3 bg-surface-50 rounded-lg border border-surface-200">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-text-primary">{r.titre}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statutColors[r.statut] ?? 'bg-surface-200 text-text-muted'}`}>
                  {statutLabels[r.statut] ?? r.statut}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                {r.appartement?.numero} · {r.residence?.nom}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {formatDate(r.created_at)}
                {r.priorite === 'urgente' && (
                  <span className="ml-2 text-error font-medium">Urgent</span>
                )}
              </p>
            </div>
          ))}
        </div>
      );
    }
  }
}