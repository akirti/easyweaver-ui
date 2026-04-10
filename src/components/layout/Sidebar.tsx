import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Database, Search, PlayCircle, Settings, LogOut, Menu, X } from 'lucide-react';
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
  const [open, setOpen] = useState(true);

  const abs = (rel: string) => basePath ? `${basePath}/${rel}` : `/${rel}`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const iconSize = open ? 16 : 20;

  return (
    <aside className={`flex ${open ? 'w-56' : 'w-14'} flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300`}>
      <div className="flex h-14 items-center justify-between border-b px-3">
        {open && <h1 className="text-lg font-bold tracking-tight">EasyWeaver</h1>}
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent/50 text-sidebar-foreground/70"
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <X size={18} /> : <Menu size={20} />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={abs(to)}
            title={!open ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                !open ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <Icon size={iconSize} className="shrink-0" />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      {!basePath && (
        <div className="space-y-1 border-t p-2">
          <NavLink
            to={abs('settings')}
            title={!open ? 'Settings' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                !open ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <Settings size={iconSize} className="shrink-0" />
            {open && <span>Settings</span>}
          </NavLink>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              title={!open ? 'Logout' : undefined}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors ${!open ? 'justify-center' : ''}`}
            >
              <LogOut size={iconSize} className="shrink-0" />
              {open && <span>Logout</span>}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
