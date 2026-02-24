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

export interface ValueFromDataset {
  run_id: string;
  column: string;
}

export interface FilterCondition {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'is_null' | 'is_not_null' | 'in' | 'not_in' | 'between';
  value?: unknown;
  value2?: unknown;
  value_from?: ValueFromDataset;
}

export interface SortSpec {
  column: string;
  direction: 'asc' | 'desc';
}

export type TransformType = 'rename' | 'format_date' | 'round' | 'uppercase' | 'lowercase' | 'trim' | 'cast';
export type CastTargetType = 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime';

export interface TransformSpec {
  column: string;
  type: TransformType;
  new_name?: string;
  date_format?: string;
  decimals?: number;
  target_type?: CastTargetType;
}

export interface QuerySourceConfig {
  source_id: string;
  table: string;
  columns?: string[];
  filters: FilterCondition[];
  filter_logic?: 'and' | 'or';
}

export interface JoinConfig {
  join_type: 'inner' | 'left' | 'right' | 'outer';
  left_on: string | string[];
  right_on: string | string[];
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

export interface JoinResultsRequest {
  left_run_id: string;
  right_run_id: string;
  join: JoinConfig;
  filters: FilterCondition[];
  filter_logic?: 'and' | 'or';
  sort: SortSpec[];
  transforms: TransformSpec[];
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

// Process Configuration types
export interface ParamDefinition {
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime';
  default?: unknown;
  label: string;
}

export interface ProcessFilterConfig {
  column: string;
  operator: string;
  value?: unknown;
  value2?: unknown;
}

export interface ProcessQueryConfig {
  source_id: string;
  table: string;
  columns?: string[];
  filters: ProcessFilterConfig[];
  filter_logic?: 'and' | 'or';
}

export interface ProcessLogicStep {
  key: string;
  type: 'join';
  left: string;
  right: string;
  join_type: 'inner' | 'left' | 'right' | 'outer';
  left_on: string[];
  right_on: string[];
}

export interface ProcessOperations {
  filters: ProcessFilterConfig[];
  filter_logic: 'and' | 'or';
  sorts: SortSpec[];
}

export interface ProcessTransformation {
  column: string;
  type: string;
  new_name?: string;
  date_format?: string;
  decimals?: number;
  target_type?: string;
}

export interface ProcessConfig {
  queries: Record<string, Record<string, ProcessQueryConfig>>;
  logics: ProcessLogicStep[];
  operations?: ProcessOperations;
  transformations: ProcessTransformation[];
}

export interface ProcessConfiguration {
  id: string;
  user_id: string;
  name: string;
  description: string;
  version: number;
  config: ProcessConfig;
  params: Record<string, ParamDefinition>;
  save_destination: string;
  gcp_path: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProcessConfigurationCreate {
  name: string;
  description?: string;
  params?: Record<string, ParamDefinition>;
  config: ProcessConfig;
  save_destination?: 'redis' | 'gcp' | 'both';
  gcp_path?: string;
  tags?: string[];
}

export interface ProcessRunRequest {
  param_values?: Record<string, unknown>;
  save_results_to_gcp?: boolean;
}

export interface ProcessRun {
  id: string;
  process_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  param_values: Record<string, unknown>;
  row_count: number | null;
  error: string | null;
  result_gcp_path: string;
  result_run_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessRunHistory {
  runs: ProcessRun[];
  total: number;
}
