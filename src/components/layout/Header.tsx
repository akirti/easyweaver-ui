import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeSwitcher } from '@/themes';

const titles: Record<string, string> = {
  'dashboard': 'Dashboard',
  'queries': 'Query Explorer',
  'sources': 'Connections',
  'processes': 'Saved Processes',
  'settings': 'Settings',
};

export function Header() {
  const location = useLocation();
  const { user } = useAuthStore();

  // Match the last path segment to get the title (works for both /queries and /aggregator/queries)
  const lastSegment = location.pathname.split('/').filter(Boolean).pop() || '';
  const title = titles[lastSegment] || 'EasyWeaver';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        {user && (
          <span className="text-sm text-muted-foreground">{user.display_name}</span>
        )}
      </div>
    </header>
  );
}
