import { useQuery, useMutation } from '@tanstack/react-query';
import { queriesApi } from '@/api/queries';
import type { QueryRequest } from '@/types';

export function useExecuteQuery() {
  return useMutation({
    mutationFn: (request: QueryRequest) => queriesApi.execute(request),
  });
}

export function useQueryRun(runId: string | null) {
  return useQuery({
    queryKey: ['queryRun', runId],
    queryFn: () => queriesApi.getRun(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'running') return 1000;
      return false;
    },
  });
}

export function useQueryResults(
  runId: string | null,
  params: { page?: number; page_size?: number; sort_column?: string; sort_direction?: string }
) {
  return useQuery({
    queryKey: ['queryResults', runId, params],
    queryFn: () => queriesApi.getResults(runId!, params),
    enabled: !!runId,
  });
}
