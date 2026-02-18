import client from './client';
import type { QueryRequest, QueryRun, QueryResults } from '@/types';

export const queriesApi = {
  execute: (request: QueryRequest) =>
    client.post<QueryRun>('/queries/execute', request).then((r) => r.data),

  getRun: (runId: string) =>
    client.get<QueryRun>(`/queries/runs/${runId}`).then((r) => r.data),

  getResults: (
    runId: string,
    params: { page?: number; page_size?: number; sort_column?: string; sort_direction?: string }
  ) =>
    client
      .get<QueryResults>(`/queries/runs/${runId}/results`, { params })
      .then((r) => r.data),

  cancel: (runId: string) => client.post(`/queries/runs/${runId}/cancel`),

  exportCsv: (runId: string) => {
    window.open(`/api/v1/queries/runs/${runId}/export?format=csv`, '_blank');
  },
};
