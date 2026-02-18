import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const titles: Record<string, string> = {
  '/queries': 'Query Explorer',
  '/sources': 'Connections',
  '/login': 'Login',
};

export function Header() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const title = titles[location.pathname] || 'EasyWeaver';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-3">
        {isAuthenticated && user && (
          <>
            <span className="text-sm text-muted-foreground">{user.display_name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
