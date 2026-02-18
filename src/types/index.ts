export interface Source {
  id: string;
  name: string;
  source_type: 'postgres' | 'mongodb';
  created_at: string;
  updated_at: string;
}

export interface PostgresCredentials {
  type: 'postgres';
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface MongoCredentials {
  type: 'mongodb';
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  auth_database: string;
}

export type SourceCredentials = PostgresCredentials | MongoCredentials;

export interface SourceCreate {
  name: string;
  source_type: 'postgres' | 'mongodb';
  credentials: SourceCredentials;
}

export interface ConnectionTestResult {
  success: boolean;
  latency_ms: number | null;
  message: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
}

export interface TableSchema {
  name: string;
  row_estimate: number;
  columns: ColumnInfo[];
}

export interface TablePreview {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  total_sampled: number;
}

export interface FilterCondition {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'is_null' | 'is_not_null';
  value?: unknown;
}

export interface SortSpec {
  column: string;
  direction: 'asc' | 'desc';
}

export interface QuerySourceConfig {
  source_id: string;
  table: string;
  columns?: string[];
  filters: FilterCondition[];
}

export interface JoinConfig {
  join_type: 'inner' | 'left' | 'right' | 'outer';
  left_on: string;
  right_on: string;
}

export interface QueryRequest {
  type: 'single' | 'join';
  left: QuerySourceConfig;
  right?: QuerySourceConfig;
  join?: JoinConfig;
  sort: SortSpec[];
  page: number;
  page_size: number;
}

export interface QueryRun {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  row_count: number | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueryResults {
  columns: { name: string; type: string }[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
