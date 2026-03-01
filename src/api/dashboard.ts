import client from './client';
import type {
  DashboardConfig,
  DashboardConfigCreate,
  DashboardStats,
  DataSnapshot,
} from '@/types';

export const dashboardApi = {
  listConfigs: () =>
    client.get<DashboardConfig[]>('/dashboard/configs').then((r) => r.data),

  getConfig: (id: string) =>
    client.get<DashboardConfig>(`/dashboard/configs/${id}`).then((r) => r.data),

  createConfig: (data: DashboardConfigCreate) =>
    client.post<DashboardConfig>('/dashboard/configs', data).then((r) => r.data),

  updateConfig: (id: string, data: Partial<DashboardConfigCreate>) =>
    client.put<DashboardConfig>(`/dashboard/configs/${id}`, data).then((r) => r.data),

  deleteConfig: (id: string) => client.delete(`/dashboard/configs/${id}`),

  getStats: (configId: string) =>
    client.get<DashboardStats>(`/dashboard/configs/${configId}/stats`).then((r) => r.data),

  refreshStats: (configId: string) =>
    client.post<DashboardStats>(`/dashboard/configs/${configId}/refresh`).then((r) => r.data),

  getHistory: (configId: string, hours?: number) =>
    client
      .get<DataSnapshot[]>(`/dashboard/configs/${configId}/history`, { params: { hours } })
      .then((r) => r.data),
};
