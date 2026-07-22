import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  preload?: () => void;
}

interface AppShellProps {
  navigation: NavItem[];
  pageTitle?: string;
}

function PageFallback() {
  return <div className="animate-pulse space-y-4 p-2"><div className="h-8 w-48 bg-surface-200 rounded" /><div className="h-4 w-full bg-surface-100 rounded" /><div className="h-4 w-3/4 bg-surface-100 rounded" /><div className="h-20 w-full bg-surface-100 rounded" /></div>;
}

export function AppShell({ navigation, pageTitle = '' }: AppShellProps) {
  return (
    <div className="h-screen bg-surface-50 flex overflow-clip">
      <Sidebar navigation={navigation} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={pageTitle} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-6">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
