import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ActivatePage = lazy(() => import('@/pages/auth/ActivatePage'));
const LandingPage = lazy(() => import('@/pages/public/LandingPage'));
const PublicLegalPage = lazy(() => import('@/pages/public/LegalPage'));
const SyndicLayout = lazy(() => import('@/router/SyndicLayout'));
const CoproprietairesLayout = lazy(() => import('@/router/CoproprietairesLayout'));

const SyndicDashboardPage = lazy(() => import('@/pages/syndic/DashboardPage'));
const ResidencesPage = lazy(() => import('@/pages/syndic/ResidencesPage'));
const ImmeublesPage = lazy(() => import('@/pages/syndic/ImmeublesPage'));
const AppartementsPage = lazy(() => import('@/pages/syndic/AppartementsPage'));
const CoproprietairesPage = lazy(() => import('@/pages/syndic/CoproprietairesPage'));
const OwnersPage = lazy(() => import('@/pages/syndic/OwnersPage'));
const BudgetPage = lazy(() => import('@/pages/syndic/BudgetPage'));
const ChargesDepensesPage = lazy(() => import('@/pages/syndic/ChargesDepensesPage'));
const CotisationsPage = lazy(() => import('@/pages/syndic/CotisationsPage'));
const PaiementsPage = lazy(() => import('@/pages/syndic/PaiementsPage'));
const ReclamationsPage = lazy(() => import('@/pages/syndic/reclamations/ReclamationsPage'));
const RapportsPage = lazy(() => import('@/pages/syndic/RapportsPage'));
const SettingsPage = lazy(() => import('@/pages/syndic/SettingsPage'));
const LegalPage = lazy(() => import('@/pages/syndic/LegalPage'));
const TransferWizardPage = lazy(() => import('@/pages/syndic/TransferWizardPage'));

const CoproDashboardPage = lazy(() => import('@/pages/coproprietaires/DashboardPage'));
const MesCotisationsPage = lazy(() => import('@/pages/coproprietaires/MesCotisationsPage'));
const MesPaiementsPage = lazy(() => import('@/pages/coproprietaires/MesPaiementsPage'));
const MesReclamationsPage = lazy(() => import('@/pages/coproprietaires/MesReclamationsPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RoleGuard({ requiredRoles, children }: { requiredRoles: string[]; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !requiredRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function FullPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-brand-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-surface-200 rounded"></div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageSkeleton />}>
        <Routes>
          <Route path="/" element={<LandingPage locale="fr" />} />
          <Route path="/ar" element={<LandingPage locale="ar" />} />
          <Route path="/mentions-legales" element={<PublicLegalPage locale="fr" page="mentions" />} />
          <Route path="/confidentialite" element={<PublicLegalPage locale="fr" page="privacy" />} />
          <Route path="/ar/mentions-legales" element={<PublicLegalPage locale="ar" page="mentions" />} />
          <Route path="/ar/confidentialite" element={<PublicLegalPage locale="ar" page="privacy" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activate/:token" element={<ActivatePage />} />

          <Route
            path="/syndic"
            element={
              <ProtectedRoute>
                <RoleGuard requiredRoles={['syndic', 'assistant', 'super_admin']}>
                  <SyndicLayout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SyndicDashboardPage />} />
            <Route path="residences" element={<ResidencesPage />} />
            <Route path="immeubles" element={<ImmeublesPage />} />
            <Route path="appartements" element={<AppartementsPage />} />
            <Route path="coproprietaires" element={<CoproprietairesPage />} />
            <Route path="proprietaires" element={<OwnersPage />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="charges" element={<ChargesDepensesPage />} />
            <Route path="cotisations" element={<CotisationsPage />} />
            <Route path="paiements" element={<PaiementsPage />} />
            <Route path="reclamations" element={<ReclamationsPage />} />
            <Route path="rapports" element={<RapportsPage />} />
            <Route path="transferts" element={<TransferWizardPage />} />
            <Route path="juridique" element={<LegalPage />} />
            <Route path="parametres" element={<SettingsPage />} />
          </Route>

          <Route
            path="/coproprietaires"
            element={
              <ProtectedRoute>
                <RoleGuard requiredRoles={['coproprietaire']}>
                  <CoproprietairesLayout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CoproDashboardPage />} />
            <Route path="cotisations" element={<MesCotisationsPage />} />
            <Route path="paiements" element={<MesPaiementsPage />} />
            <Route path="reclamations" element={<MesReclamationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;