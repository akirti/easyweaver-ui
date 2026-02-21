import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

const titles: Record<string, string> = {
  '/queries': 'Query Explorer',
  '/sources': 'Connections',
  '/settings': 'Settings',
};

export function Header() {
  const location = useLocation();
  const { user } = useAuthStore();
  const title = titles[location.pathname] || 'EasyWeaver';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {user && (
        <span className="text-sm text-muted-foreground">{user.display_name}</span>
      )}
    </header>
  );
}
