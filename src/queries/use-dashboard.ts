import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import type { DashboardConfigCreate } from '@/types';

export function useDashboardConfigs() {
  return useQuery({ queryKey: ['dashboardConfigs'], queryFn: dashboardApi.listConfigs });
}

export function useDashboardConfig(id: string) {
  return useQuery({
    queryKey: ['dashboardConfigs', id],
    queryFn: () => dashboardApi.getConfig(id),
    enabled: !!id,
  });
}

export function useCreateDashboardConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DashboardConfigCreate) => dashboardApi.createConfig(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboardConfigs'] }),
  });
}

export function useUpdateDashboardConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DashboardConfigCreate> }) =>
      dashboardApi.updateConfig(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboardConfigs'] }),
  });
}

export function useDeleteDashboardConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dashboardApi.deleteConfig(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboardConfigs'] }),
  });
}

export function useDashboardStats(configId: string, refreshIntervalMinutes?: number) {
  return useQuery({
    queryKey: ['dashboardStats', configId],
    queryFn: () => dashboardApi.getStats(configId),
    enabled: !!configId,
    refetchInterval: refreshIntervalMinutes ? refreshIntervalMinutes * 60 * 1000 : false,
    placeholderData: keepPreviousData,
  });
}

export function useRefreshDashboardStats(configId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dashboardApi.refreshStats(configId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboardStats', configId] }),
  });
}

export function useDashboardHistory(configId: string, hours?: number) {
  return useQuery({
    queryKey: ['dashboardHistory', configId, hours],
    queryFn: () => dashboardApi.getHistory(configId, hours),
    enabled: !!configId,
  });
}
