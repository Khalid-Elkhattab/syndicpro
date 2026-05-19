import { NavLink } from 'react-router-dom';

interface SidebarNavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
  collapsed: boolean;
}

export function SidebarNav({ items, collapsed }: SidebarNavProps) {
  return (
    <nav className="flex-1 py-4 overflow-y-auto">
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            `flex items-center px-4 py-3 hover:bg-brand-900/50 transition-colors relative ${
              isActive ? 'bg-brand-900 border-l-4 border-accent-500' : 'border-l-4 border-transparent'
            }`
          }
        >
          <span className="text-xl flex-shrink-0">{item.icon}</span>
          {!collapsed && (
            <span className="ml-3 text-sm font-medium truncate">{item.name}</span>
          )}
          {item.badge !== undefined && item.badge > 0 && (
            <span
              className={`ml-auto flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-danger rounded-full ${
                collapsed ? 'absolute -top-1 -right-1' : ''
              }`}
            >
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
