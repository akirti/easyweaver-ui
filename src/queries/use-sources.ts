import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourcesApi } from '@/api/sources';
import type { SourceCreate } from '@/types';

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: sourcesApi.list,
  });
}

export function useSource(id: string) {
  return useQuery({
    queryKey: ['sources', id],
    queryFn: () => sourcesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SourceCreate) => sourcesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sourcesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (id: string) => sourcesApi.test(id),
  });
}

export function useSourceSchema(sourceId: string) {
  return useQuery({
    queryKey: ['schema', sourceId],
    queryFn: () => sourcesApi.getSchema(sourceId),
    enabled: !!sourceId,
    staleTime: 15 * 60 * 1000,
  });
}

export function useTablePreview(sourceId: string, table: string) {
  return useQuery({
    queryKey: ['preview', sourceId, table],
    queryFn: () => sourcesApi.previewTable(sourceId, table),
    enabled: !!sourceId && !!table,
  });
}

export function useUploadFileSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, file }: { name: string; file: File }) =>
      sourcesApi.uploadFile(name, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });
}
