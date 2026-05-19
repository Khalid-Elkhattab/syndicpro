import { LayoutDashboard, Building2, Building, DoorOpen, Users, PiggyBank, FileText, ScrollText, CreditCard, MessageSquare, BarChart3 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const navigation = [
  { name: 'Tableau de bord', href: '/syndic/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Résidences', href: '/syndic/residences', icon: <Building2 className="w-5 h-5" /> },
  { name: 'Immeubles', href: '/syndic/immeubles', icon: <Building className="w-5 h-5" /> },
  { name: 'Appartements', href: '/syndic/appartements', icon: <DoorOpen className="w-5 h-5" /> },
  { name: 'Copropriétaires', href: '/syndic/coproprietaires', icon: <Users className="w-5 h-5" /> },
  { name: 'Budget', href: '/syndic/budget', icon: <PiggyBank className="w-5 h-5" /> },
  { name: 'Charges & Dépenses', href: '/syndic/charges', icon: <FileText className="w-5 h-5" /> },
  { name: 'Cotisations', href: '/syndic/cotisations', icon: <ScrollText className="w-5 h-5" /> },
  { name: 'Paiements', href: '/syndic/paiements', icon: <CreditCard className="w-5 h-5" /> },
  { name: 'Réclamations', href: '/syndic/reclamations', icon: <MessageSquare className="w-5 h-5" />, badge: 0 },
  { name: 'Rapports', href: '/syndic/rapports', icon: <BarChart3 className="w-5 h-5" /> },
];

export default function SyndicLayout() {
  return <AppShell navigation={navigation} />;
}
