import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { processesApi } from '@/api/processes';
import type { ProcessConfigurationCreate, ProcessRunRequest } from '@/types';

export function useProcessConfigurations() {
  return useQuery({ queryKey: ['processes'], queryFn: processesApi.list });
}

export function useProcessConfiguration(id: string) {
  return useQuery({
    queryKey: ['processes', id],
    queryFn: () => processesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProcess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProcessConfigurationCreate) => processesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processes'] }),
  });
}

export function useUpdateProcess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProcessConfigurationCreate> }) =>
      processesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processes'] }),
  });
}

export function useDeleteProcess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processes'] }),
  });
}

export function useRunProcess(configId: string) {
  return useMutation({
    mutationFn: (data: ProcessRunRequest) => processesApi.run(configId, data),
  });
}

export function useProcessRun(runId: string | null) {
  return useQuery({
    queryKey: ['processRun', runId],
    queryFn: () => processesApi.getRun(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'running') return 1000;
      return false;
    },
  });
}

export function useProcessRunResults(
  runId: string | null,
  params: { page?: number; page_size?: number; sort_column?: string; sort_direction?: string }
) {
  return useQuery({
    queryKey: ['processRunResults', runId, params],
    queryFn: () => processesApi.getRunResults(runId!, params),
    enabled: !!runId,
    placeholderData: keepPreviousData,
  });
}

export function useProcessRunHistory(configId: string) {
  return useQuery({
    queryKey: ['processRuns', configId],
    queryFn: () => processesApi.listRuns(configId),
    enabled: !!configId,
  });
}

export function useSaveResultsToGcp() {
  return useMutation({
    mutationFn: (runId: string) => processesApi.saveResultsToGcp(runId),
  });
}

export function useReloadFromGcp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => processesApi.reloadFromGcp(runId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processRunResults'] }),
  });
}

export function useRefreshCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (configId: string) => processesApi.refreshCredentials(configId),
    onSuccess: (_data, configId) => {
      qc.invalidateQueries({ queryKey: ['processes'] });
      qc.invalidateQueries({ queryKey: ['processes', configId] });
    },
  });
}
