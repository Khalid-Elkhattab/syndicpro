import { LayoutDashboard, Building2, Building, DoorOpen, Users, PiggyBank, FileText, ScrollText, CreditCard, MessageSquare, BarChart3 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const preloaders: Record<string, () => Promise<unknown>> = {
  '/syndic/dashboard': () => import('@/pages/syndic/DashboardPage'),
  '/syndic/residences': () => import('@/pages/syndic/ResidencesPage'),
  '/syndic/immeubles': () => import('@/pages/syndic/ImmeublesPage'),
  '/syndic/appartements': () => import('@/pages/syndic/AppartementsPage'),
  '/syndic/coproprietaires': () => import('@/pages/syndic/CoproprietairesPage'),
  '/syndic/budget': () => import('@/pages/syndic/BudgetPage'),
  '/syndic/charges': () => import('@/pages/syndic/ChargesDepensesPage'),
  '/syndic/cotisations': () => import('@/pages/syndic/CotisationsPage'),
  '/syndic/paiements': () => import('@/pages/syndic/PaiementsPage'),
  '/syndic/reclamations': () => import('@/pages/syndic/reclamations/ReclamationsPage'),
  '/syndic/rapports': () => import('@/pages/syndic/RapportsPage'),
};

const navigation = [
  { name: 'Tableau de bord', href: '/syndic/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, preload: preloaders['/syndic/dashboard'] },
  { name: 'Résidences', href: '/syndic/residences', icon: <Building2 className="w-5 h-5" />, preload: preloaders['/syndic/residences'] },
  { name: 'Immeubles', href: '/syndic/immeubles', icon: <Building className="w-5 h-5" />, preload: preloaders['/syndic/immeubles'] },
  { name: 'Appartements', href: '/syndic/appartements', icon: <DoorOpen className="w-5 h-5" />, preload: preloaders['/syndic/appartements'] },
  { name: 'Copropriétaires', href: '/syndic/coproprietaires', icon: <Users className="w-5 h-5" />, preload: preloaders['/syndic/coproprietaires'] },
  { name: 'Budget', href: '/syndic/budget', icon: <PiggyBank className="w-5 h-5" />, preload: preloaders['/syndic/budget'] },
  { name: 'Charges & Dépenses', href: '/syndic/charges', icon: <FileText className="w-5 h-5" />, preload: preloaders['/syndic/charges'] },
  { name: 'Cotisations', href: '/syndic/cotisations', icon: <ScrollText className="w-5 h-5" />, preload: preloaders['/syndic/cotisations'] },
  { name: 'Paiements', href: '/syndic/paiements', icon: <CreditCard className="w-5 h-5" />, preload: preloaders['/syndic/paiements'] },
  { name: 'Réclamations', href: '/syndic/reclamations', icon: <MessageSquare className="w-5 h-5" />, badge: 0, preload: preloaders['/syndic/reclamations'] },
  { name: 'Rapports', href: '/syndic/rapports', icon: <BarChart3 className="w-5 h-5" />, preload: preloaders['/syndic/rapports'] },
];

export default function SyndicLayout() {
  return <AppShell navigation={navigation} />;
}
