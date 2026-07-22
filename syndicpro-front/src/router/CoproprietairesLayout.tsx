import { Suspense } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { axiosInstance } from '@/api/axiosInstance';

function PageFallback() {
  return <div className="animate-pulse space-y-4 p-2"><div className="h-8 w-48 bg-surface-200 rounded" /><div className="h-4 w-full bg-surface-100 rounded" /><div className="h-4 w-3/4 bg-surface-100 rounded" /><div className="h-20 w-full bg-surface-100 rounded" /></div>;
}

const navigation = [
  { name: 'Tableau de bord', href: '/coproprietaires/dashboard', icon: '📊' },
  { name: 'Mes Cotisations', href: '/coproprietaires/cotisations', icon: '📄' },
  { name: 'Mes Paiements', href: '/coproprietaires/paiements', icon: '💳' },
  { name: 'Mes Réclamations', href: '/coproprietaires/reclamations', icon: '📢' },
];

export default function CoproprietairesLayout() {
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } finally {
      clearUser();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand-600">
            Syndic<span className="text-accent-500">Pro</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-text-secondary">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `py-4 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-text-muted hover:text-text-secondary'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}