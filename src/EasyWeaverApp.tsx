import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppShell } from '@/components/layout/AppShell';
import { InteractiveQueryBuilder } from '@/components/query/InteractiveQueryBuilder';
import { ConnectionList } from '@/components/sources/ConnectionList';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { ProcessList } from '@/components/processes/ProcessList';
import { ProcessRunner } from '@/components/processes/ProcessRunner';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { configureClient, resetClient } from '@/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/api/auth';
import { ThemeProvider } from '@/themes';

export interface EasyWeaverProps {
  /** Base URL for the easyweaver API (e.g. "http://localhost:8001/api/v1") */
  apiBaseUrl: string;
  /** Callback that returns the current auth token from the parent app */
  getToken: () => string | null;
  /** Base path for routes (e.g. "/aggregator") */
  basePath?: string;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

/**
 * Embeddable EasyWeaver component for use inside the admin-panel.
 *
 * - Does NOT render its own BrowserRouter (parent provides router context)
 * - Does NOT render LoginPage or AuthGuard (parent handles auth)
 * - Bridges parent's auth token into easyweaver's API client
 * - Renders all feature pages under the given basePath
 */
export function EasyWeaverApp({ apiBaseUrl, getToken, basePath = '' }: EasyWeaverProps) {
  // Configure the API client to use parent's auth and API URL
  useEffect(() => {
    configureClient({
      baseURL: apiBaseUrl,
      getToken,
    });

    // Sync auth state so components that check useAuthStore work
    const token = getToken();
    if (token) {
      useAuthStore.getState().setUser(null); // clear stale user
      useAuthStore.setState({ isAuthenticated: true });
      // Fetch user profile with the parent's token
      authApi.me().then((user) => {
        useAuthStore.getState().setUser(user);
      }).catch(() => {
        // If /auth/me fails, the embedded user info won't be available
        // but the app still works — parent controls auth
      });
    }

    return () => {
      resetClient();
    };
  }, [apiBaseUrl, getToken]);

  // Strip leading/trailing slashes for clean route matching
  const base = basePath.replace(/^\/|\/$/g, '');

  return (
    <ThemeProvider embedded>
      <QueryClientProvider client={queryClient}>
        <Routes>
        <Route element={<AppShell />}>
          <Route path={base ? `${base}/dashboard` : 'dashboard'} element={<DashboardPage />} />
          <Route path={base ? `${base}/queries` : 'queries'} element={<InteractiveQueryBuilder />} />
          <Route path={base ? `${base}/sources` : 'sources'} element={<ConnectionList />} />
          <Route path={base ? `${base}/processes` : 'processes'} element={<ProcessList />} />
          <Route path={base ? `${base}/processes/:configId` : 'processes/:configId'} element={<ProcessRunner />} />
          <Route path={base ? `${base}/settings` : 'settings'} element={<SettingsPage />} />
          <Route
            path={base ? `${base}` : ''}
            element={<Navigate to={base ? `/${base}/queries` : 'queries'} replace />}
          />
          <Route
            path={base ? `${base}/*` : '*'}
            element={<Navigate to={base ? `/${base}/queries` : 'queries'} replace />}
          />
        </Route>
        </Routes>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
