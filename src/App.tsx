import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoginPage } from '@/components/auth/LoginPage';
import { QueryBuilder } from '@/components/query/QueryBuilder';
import { ConnectionList } from '@/components/sources/ConnectionList';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/api/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      authApi.me().then(setUser).catch(() => logout());
    }
  }, [isAuthenticated, user, setUser, logout]);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AuthGuard />}>
              <Route element={<AppShell />}>
                <Route path="/queries" element={<QueryBuilder />} />
                <Route path="/sources" element={<ConnectionList />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/" element={<Navigate to="/queries" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthBootstrap>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
