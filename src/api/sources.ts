import client from './client';
import type { Source, SourceCreate, ConnectionTestResult, TableSchema, TablePreview } from '@/types';

export const sourcesApi = {
  list: () => client.get<Source[]>('/sources').then((r) => r.data),

  get: (id: string) => client.get<Source>(`/sources/${id}`).then((r) => r.data),

  create: (data: SourceCreate) => client.post<Source>('/sources', data).then((r) => r.data),

  update: (id: string, data: Partial<SourceCreate>) =>
    client.put<Source>(`/sources/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/sources/${id}`),

  test: (id: string) =>
    client.post<ConnectionTestResult>(`/sources/${id}/test`).then((r) => r.data),

  getSchema: (id: string) =>
    client.get<TableSchema[]>(`/sources/${id}/schema`).then((r) => r.data),

  getTableSchema: (id: string, table: string) =>
    client.get<TableSchema>(`/sources/${id}/schema/${table}`).then((r) => r.data),

  previewTable: (id: string, table: string) =>
    client.get<TablePreview>(`/sources/${id}/preview/${table}`).then((r) => r.data),
};
