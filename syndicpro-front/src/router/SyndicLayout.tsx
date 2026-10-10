import { LayoutDashboard, Building2, Building, DoorOpen, Users, PiggyBank, FileText, ScrollText, CreditCard, MessageSquare, BarChart3, ArrowLeftRight, Scale, Settings, Coins } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';

const preloaders: Record<string, () => Promise<unknown>> = {
  '/syndic/dashboard': () => import('@/pages/syndic/DashboardPage'),
  '/syndic/residences': () => import('@/pages/syndic/ResidencesPage'),
  '/syndic/immeubles': () => import('@/pages/syndic/ImmeublesPage'),
  '/syndic/appartements': () => import('@/pages/syndic/AppartementsPage'),
  '/syndic/coproprietaires': () => import('@/pages/syndic/CoproprietairesPage'),
  '/syndic/proprietaires': () => import('@/pages/syndic/OwnersPage'),
  '/syndic/budget': () => import('@/pages/syndic/BudgetPage'),
  '/syndic/charges': () => import('@/pages/syndic/ChargesDepensesPage'),
  '/syndic/cotisations': () => import('@/pages/syndic/CotisationsPage'),
  '/syndic/appels': () => import('@/pages/syndic/ContributionsPage'),
  '/syndic/paiements': () => import('@/pages/syndic/PaiementsPage'),
  '/syndic/reclamations': () => import('@/pages/syndic/reclamations/ReclamationsPage'),
  '/syndic/rapports': () => import('@/pages/syndic/RapportsPage'),
  '/syndic/transferts': () => import('@/pages/syndic/TransferWizardPage'),
  '/syndic/juridique': () => import('@/pages/syndic/LegalPage'),
  '/syndic/parametres': () => import('@/pages/syndic/SettingsPage'),
};

interface NavEntry {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  preload?: () => Promise<unknown>;
  /** Permission requise pour les assistants ; syndic/super_admin voient tout. */
  permission?: string;
  /** Réservé aux gérants (jamais aux assistants). */
  managersOnly?: boolean;
}

const allNavigation: NavEntry[] = [
  { name: 'Tableau de bord', href: '/syndic/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, preload: preloaders['/syndic/dashboard'] },
  { name: 'Résidences', href: '/syndic/residences', icon: <Building2 className="w-5 h-5" />, preload: preloaders['/syndic/residences'] },
  { name: 'Immeubles', href: '/syndic/immeubles', icon: <Building className="w-5 h-5" />, preload: preloaders['/syndic/immeubles'] },
  { name: 'Lots', href: '/syndic/appartements', icon: <DoorOpen className="w-5 h-5" />, preload: preloaders['/syndic/appartements'] },
  { name: 'Copropriétaires', href: '/syndic/coproprietaires', icon: <Users className="w-5 h-5" />, preload: preloaders['/syndic/coproprietaires'] },
  { name: 'Propriétaires', href: '/syndic/proprietaires', icon: <Users className="w-5 h-5" />, preload: preloaders['/syndic/proprietaires'], permission: 'owners.view' },
  { name: 'Budget', href: '/syndic/budget', icon: <PiggyBank className="w-5 h-5" />, preload: preloaders['/syndic/budget'] },
  { name: 'Charges & Dépenses', href: '/syndic/charges', icon: <FileText className="w-5 h-5" />, preload: preloaders['/syndic/charges'] },
  { name: 'Cotisations', href: '/syndic/cotisations', icon: <ScrollText className="w-5 h-5" />, preload: preloaders['/syndic/cotisations'] },
  { name: 'Appels de fonds', href: '/syndic/appels', icon: <Coins className="w-5 h-5" />, preload: preloaders['/syndic/appels'], permission: 'contributions.view' },
  { name: 'Paiements', href: '/syndic/paiements', icon: <CreditCard className="w-5 h-5" />, preload: preloaders['/syndic/paiements'] },
  { name: 'Réclamations', href: '/syndic/reclamations', icon: <MessageSquare className="w-5 h-5" />, badge: 0, preload: preloaders['/syndic/reclamations'] },
  { name: 'Rapports', href: '/syndic/rapports', icon: <BarChart3 className="w-5 h-5" />, preload: preloaders['/syndic/rapports'] },
  { name: 'Transferts', href: '/syndic/transferts', icon: <ArrowLeftRight className="w-5 h-5" />, preload: preloaders['/syndic/transferts'], permission: 'owners.handover' },
  { name: 'Juridique', href: '/syndic/juridique', icon: <Scale className="w-5 h-5" />, preload: preloaders['/syndic/juridique'], permission: 'collection.send' },
  { name: 'Paramètres', href: '/syndic/parametres', icon: <Settings className="w-5 h-5" />, preload: preloaders['/syndic/parametres'], managersOnly: true },
];

export default function SyndicLayout() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role as string | undefined;
  const isManager = role === 'syndic' || role === 'super_admin';

  const navigation = allNavigation.filter((item) => {
    if (isManager) return true;
    if (item.managersOnly) return false;
    if (item.permission) {
      return user?.permissions?.includes(item.permission) ?? false;
    }
    return true;
  });

  return <AppShell navigation={navigation} />;
}
