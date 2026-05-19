import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  navigation: Array<{
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
  }>;
  pageTitle?: string;
}

export function AppShell({ navigation, pageTitle = '' }: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface-50 flex">
      <Sidebar navigation={navigation} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={pageTitle} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
