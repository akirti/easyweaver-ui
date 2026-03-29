import './embedded.css';
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
import { ThemeProvider } from '@/themes';
import { BasePathProvider } from '@/contexts/base-path';

export interface EasyWeaverProps {
  /** Base URL for the easyweaver API (e.g. "http://localhost:8001/api/v1") */
  apiBaseUrl: string;
  /** Callback that returns the current auth token from the parent app */
  getToken: () => string | null;
  /** Base path for absolute navigations (e.g. "/aggregator") */
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
 * Route paths are RELATIVE — the parent's <Route path="aggregator/*">
 * already consumed the base prefix. We only use basePath for absolute
 * <Navigate to="..."> targets.
 */
export function EasyWeaverApp({ apiBaseUrl, getToken, basePath = '' }: EasyWeaverProps) {
  useEffect(() => {
    configureClient({
      baseURL: apiBaseUrl,
      getToken,
    });

    const token = getToken();
    if (token) {
      useAuthStore.setState({ isAuthenticated: true });
    }

    return () => {
      resetClient();
    };
  }, [apiBaseUrl, getToken]);

  // Normalize basePath for absolute Navigate targets: "/aggregator"
  const absBase = basePath.replace(/\/+$/, '') || '';

  return (
    <ThemeProvider embedded>
      <BasePathProvider basePath={absBase}>
        <QueryClientProvider client={queryClient}>
          <Routes>
          <Route element={<AppShell />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="queries" element={<InteractiveQueryBuilder />} />
            <Route path="sources" element={<ConnectionList />} />
            <Route path="processes" element={<ProcessList />} />
            <Route path="processes/:configId" element={<ProcessRunner />} />
            <Route path="settings" element={<SettingsPage />} />
            {/* Default: redirect bare /aggregator to /aggregator/queries */}
            <Route index element={<Navigate to={`${absBase}/queries`} replace />} />
            <Route path="*" element={<Navigate to={`${absBase}/queries`} replace />} />
          </Route>
        </Routes>
          <Toaster />
        </QueryClientProvider>
      </BasePathProvider>
    </ThemeProvider>
  );
}
