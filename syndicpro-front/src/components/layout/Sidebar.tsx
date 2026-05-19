import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '@/api/axiosInstance';
import { SidebarNav } from './SidebarNav';
import { ResidenceSelector } from './ResidenceSelector';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  navigation: Array<{
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
  }>;
}

export function Sidebar({ navigation }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } finally {
      clearUser();
      navigate('/login');
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="bg-brand-950 text-white flex flex-col h-screen flex-shrink-0"
    >
      <div className="p-4 flex items-center justify-between border-b border-brand-800 h-16">
        {!sidebarCollapsed && (
          <span className="text-xl font-bold whitespace-nowrap">
            Syndic<span className="text-accent-500">Pro</span>
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-brand-800 transition-colors text-brand-300 hover:text-white ml-auto"
          aria-label={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <ResidenceSelector collapsed={sidebarCollapsed} />

      <SidebarNav items={navigation} collapsed={sidebarCollapsed} />

      <div className="p-4 border-t border-brand-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-brand-300 truncate">{user?.username}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-brand-300 hover:text-white hover:bg-brand-800 transition-colors"
              aria-label="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
