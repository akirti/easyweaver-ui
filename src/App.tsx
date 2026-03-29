import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/themes';
import { BasePathProvider } from '@/contexts/base-path';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoginPage } from '@/components/auth/LoginPage';
import { InteractiveQueryBuilder } from '@/components/query/InteractiveQueryBuilder';
import { ConnectionList } from '@/components/sources/ConnectionList';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { ProcessList } from '@/components/processes/ProcessList';
import { ProcessRunner } from '@/components/processes/ProcessRunner';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
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
    <ThemeProvider>
      <BasePathProvider basePath="">
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
        <AuthBootstrap>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AuthGuard />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/queries" element={<InteractiveQueryBuilder />} />
                <Route path="/sources" element={<ConnectionList />} />
                <Route path="/processes" element={<ProcessList />} />
                <Route path="/processes/:configId" element={<ProcessRunner />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/" element={<Navigate to="/queries" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthBootstrap>
          </BrowserRouter>
          <Toaster />
        </QueryClientProvider>
      </BasePathProvider>
    </ThemeProvider>
  );
}
