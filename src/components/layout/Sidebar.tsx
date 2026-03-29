import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Database, Search, PlayCircle, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useBasePath } from '@/contexts/base-path';

const navItems = [
  { to: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: 'queries', label: 'Query Explorer', icon: Search },
  { to: 'sources', label: 'Connections', icon: Database },
  { to: 'processes', label: 'Saved Processes', icon: PlayCircle },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const basePath = useBasePath();

  // Build absolute path from basePath + relative segment
  const abs = (rel: string) => basePath ? `${basePath}/${rel}` : `/${rel}`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-lg font-bold tracking-tight">EasyWeaver</h1>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={abs(to)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      {/* Settings & Logout only shown in standalone mode (parent handles these when embedded) */}
      {!basePath && (
        <div className="space-y-1 border-t p-3">
          <NavLink
            to={abs('settings')}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
