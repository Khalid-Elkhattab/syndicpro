import { Menu, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const user = useAuthStore((s) => s.user);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 overflow-hidden">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors lg:hidden flex-shrink-0"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && <h1 className="text-lg font-semibold text-text-primary truncate">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-lg text-text-muted hover:bg-surface-100 hover:text-text-primary transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-surface-200">
          <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span className="text-sm font-medium text-text-primary hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
