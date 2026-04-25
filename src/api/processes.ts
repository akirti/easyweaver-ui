import client from './client';
import type {
  ProcessConfiguration,
  ProcessConfigurationCreate,
  ProcessRun,
  ProcessRunRequest,
  ProcessRunHistory,
  QueryResults,
} from '@/types';

export const settingsApi = {
  get: () => client.get<{ max_result_rows: number }>('/settings').then((r) => r.data),
};

export const processesApi = {
  list: () => client.get<ProcessConfiguration[]>('/processes').then((r) => r.data),

  get: (id: string) => client.get<ProcessConfiguration>(`/processes/${id}`).then((r) => r.data),

  create: (data: ProcessConfigurationCreate) =>
    client.post<ProcessConfiguration>('/processes', data).then((r) => r.data),

  update: (id: string, data: Partial<ProcessConfigurationCreate>) =>
    client.put<ProcessConfiguration>(`/processes/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/processes/${id}`),

  run: (id: string, data: ProcessRunRequest) =>
    client.post<ProcessRun>(`/processes/${id}/run`, data).then((r) => r.data),

  listRuns: (configId: string) =>
    client.get<ProcessRunHistory>(`/processes/${configId}/runs`).then((r) => r.data),

  getRun: (runId: string) =>
    client.get<ProcessRun>(`/processes/runs/${runId}`).then((r) => r.data),

  getRunResults: (
    runId: string,
    params: { page?: number; page_size?: number; sort_column?: string; sort_direction?: string }
  ) => client.get<QueryResults>(`/processes/runs/${runId}/results`, { params }).then((r) => r.data),

  saveResultsToGcp: (runId: string) =>
    client.post<{ gcp_path: string }>(`/processes/runs/${runId}/save-results`).then((r) => r.data),

  reloadFromGcp: (runId: string) =>
    client
      .post<{ status: string; row_count: number }>(`/processes/runs/${runId}/reload`)
      .then((r) => r.data),

  refreshCredentials: (configId: string) =>
    client.post<ProcessConfiguration>(`/processes/${configId}/refresh-credentials`).then((r) => r.data),
};

export interface LookupData {
  key: string;
  type: string;
  process_id: string;
  lookups: Record<string, unknown[]>;
  references: Array<{ source_id: string; table: string; column: string }>;
  created_at: string;
  updated_at: string;
}

export const lookupsApi = {
  get: (processId: string) =>
    client.get<LookupData>(`/lookups/${processId}`).then((r) => r.data),

  refresh: (processId: string) =>
    client.post<LookupData>(`/lookups/${processId}/refresh`).then((r) => r.data),
};
