export type SourceType = 'postgres' | 'mongodb' | 'mysql' | 'db2' | 'file' | 'rest_api';

export interface Source {
  id: string;
  name: string;
  source_type: SourceType;
  created_at: string;
  updated_at: string;
}

export type SslMode = 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';

export interface PostgresCredentials {
  type: 'postgres';
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl_mode?: SslMode;
  /** Base64-encoded client certificate (PEM) */
  ssl_client_cert?: string;
  /** Base64-encoded client private key (PEM) */
  ssl_client_key?: string;
  /** Base64-encoded CA certificate (PEM) */
  ssl_ca_cert?: string;
}

export interface MongoCredentials {
  type: 'mongodb';
  /** Direct connection string (mongodb:// or mongodb+srv://). When set, host/port/user/password are ignored. */
  connection_string?: string;
  host?: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  auth_database?: string;
}

export interface MySQLCredentials {
  type: 'mysql';
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl_mode?: SslMode;
  ssl_client_cert?: string;
  ssl_client_key?: string;
  ssl_ca_cert?: string;
}

export interface DB2Credentials {
  type: 'db2';
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface FileCredentials {
  type: 'file';
  gcp_path: string;
  file_format: 'csv' | 'json' | 'xlsx' | 'xls';
  original_filename: string;
}

export interface RestAPIEndpoint {
  path: string;
  method: string;
  data_path: string;
}

export interface RestAPICredentials {
  type: 'rest_api';
  base_url: string;
  auth_type: 'none' | 'bearer' | 'basic' | 'api_key' | 'oauth2_client_credentials' | 'login';
  bearer_token?: string;
  basic_user?: string;
  basic_password?: string;
  api_key_header?: string;
  api_key_value?: string;
  oauth2_token_url?: string;
  oauth2_client_id?: string;
  oauth2_client_secret?: string;
  oauth2_scope?: string;
  login_url?: string;
  login_body?: Record<string, unknown>;
  login_token_path?: string;
  headers?: Record<string, string>;
  endpoints?: Record<string, RestAPIEndpoint>;
}

export type SourceCredentials =
  | PostgresCredentials
  | MongoCredentials
  | MySQLCredentials
  | DB2Credentials
  | FileCredentials
  | RestAPICredentials;

export interface SourceCreate {
  name: string;
  source_type: SourceType;
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

export interface BindingMapping {
  source_column: string;
  target_column: string;
}

export interface DataBinding {
  source_run_id: string;
  source_dataset_index: number;
  mode: 'distinct' | 'row_pair';
  auto_refresh: boolean;
  mappings: BindingMapping[];
}

export interface DataBindingSpec {
  source_run_id: string;
  mode: 'distinct' | 'row_pair';
  mappings: BindingMapping[];
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

export type TransformType = 'rename' | 'format_date' | 'round' | 'uppercase' | 'lowercase' | 'trim' | 'cast' | 'strip_leading_zeros' | 'pad_left' | 'replace' | 'substring';
export type CastTargetType = 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime';

export interface TransformSpec {
  column: string;
  type: TransformType;
  new_name?: string;
  date_format?: string;
  decimals?: number;
  target_type?: CastTargetType;
  pad_char?: string;
  pad_length?: number;
  find_str?: string;
  replace_str?: string;
  start?: number;
  length?: number;
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
  transforms?: TransformSpec[];
  bindings?: DataBindingSpec[];
  group_by?: GroupBySpec;
  distinct?: DistinctSpec;
  page: number;
  page_size: number;
}

// Derived column types
export type DerivedExpressionType = 'concat' | 'math' | 'date_part' | 'conditional' | 'literal';
export type DatePartType = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'day_of_week' | 'quarter';

export interface DerivedColumnSpec {
  name: string;
  expression_type: DerivedExpressionType;
  columns?: string[];
  separator?: string;
  expression?: string;
  source_column?: string;
  part?: DatePartType;
  condition_column?: string;
  condition_operator?: string;
  condition_value?: unknown;
  then_value?: unknown;
  else_value?: unknown;
  value?: unknown;
}

// Group by types
export type AggFunction = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'count_distinct';

export interface AggregationSpec {
  column: string;
  function: AggFunction;
  alias?: string;
}

export interface GroupBySpec {
  group_columns: string[];
  aggregations: AggregationSpec[];
}

// Distinct types
export interface DistinctSpec {
  enabled: boolean;
  columns?: string[];
  keep: 'first' | 'last' | 'any' | 'none';
}

export interface JoinResultsRequest {
  left_run_id: string;
  right_run_id: string;
  join: JoinConfig;
  select_columns?: string[];
  derived_columns?: DerivedColumnSpec[];
  filters: FilterCondition[];
  filter_logic?: 'and' | 'or';
  group_by?: GroupBySpec;
  distinct?: DistinctSpec;
  sort: SortSpec[];
  transforms: TransformSpec[];
  bindings?: DataBindingSpec[];
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
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime'
    | 'select' | 'multi_select' | 'boolean_yesno' | 'boolean_truefalse';
  default?: unknown;
  label: string;
  options?: unknown[];
  options_source?: { source_id: string; table: string; column: string };
  max_options?: number;
}

export interface DistinctValuesResponse {
  values: unknown[];
  truncated: boolean;
  total_count: number | null;
}

export interface ProcessFilterConfig {
  column: string;
  operator: string;
  value?: unknown;
  value2?: unknown;
}

export interface ProcessQueryConfig {
  source_id: string;
  source_name?: string;
  source_type?: string;
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
  select_columns?: string[];
}

export interface ProcessOperations {
  filters: ProcessFilterConfig[];
  filter_logic: 'and' | 'or';
  group_by?: GroupBySpec;
  distinct?: DistinctSpec;
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
  derived_columns?: DerivedColumnSpec[];
  operations?: ProcessOperations;
  transformations: ProcessTransformation[];
  config_version?: number;
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
  max_rows: number;
  save_results_to_gcp?: boolean;
  config_source?: 'auto' | 'mongodb' | 'gcp';
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

// Dashboard types
export interface TableMonitorConfig {
  table_name: string;
  timestamp_column?: string;
  modified_by_column?: string;
}

export interface DashboardConfig {
  id: string;
  user_id: string;
  name: string;
  source_id: string;
  tables: TableMonitorConfig[];
  refresh_interval_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardConfigCreate {
  name: string;
  source_id: string;
  tables: TableMonitorConfig[];
  refresh_interval_minutes?: number;
}

export interface TableStats {
  table_name: string;
  current_row_count: number;
  changes_1h: number | null;
  changes_3h: number | null;
  changes_24h: number | null;
  last_modified_at: string | null;
  last_modified_by: string | null;
  column_count: number;
  size_bytes: number | null;
}

export interface DashboardStats {
  config_id: string;
  source_name: string;
  source_type: string;
  tables: TableStats[];
  captured_at: string;
  connection_healthy: boolean;
}

export interface DataSnapshot {
  id: string;
  config_id: string;
  table_name: string;
  row_count: number;
  captured_at: string;
}

// ── WebSocket message types for process execution ──────────────────────

// Client → Server
export type WsClientMessage =
  | { type: 'start'; param_values: Record<string, unknown>; max_rows: number; target_batch_seconds?: number }
  | { type: 'attach'; run_id: string }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'set_batch_size'; batch_size: number }
  | { type: 'set_target_seconds'; target_seconds: number }
  | { type: 'cancel' };

// Server → Client
export type WsServerMessage =
  | { type: 'run_started'; run_id: string; phases: string[]; datasets: string[]; dag: Record<string, string[]> }
  | { type: 'phase'; phase: string; phase_index: number; total_phases: number }
  | { type: 'fetch_progress'; dataset: string; rows_fetched: number; batch_number: number; batch_size: number; batch_time_ms: number; status: string; depends_on: string | null }
  | { type: 'fetch_complete'; dataset: string; total_rows: number }
  | { type: 'fetch_waiting'; dataset: string; waiting_for: string[]; reason?: string }
  | { type: 'fetch_started'; dataset: string; binding_resolved: boolean; filter_values_count?: number }
  | { type: 'join_progress'; step_key: string; left: string; right: string; status: string }
  | { type: 'join_complete'; step_key: string; rows: number }
  | { type: 'transform_progress'; operation: string; step: number; total_steps: number }
  | { type: 'batch_adjusted'; dataset: string; old_batch_size: number; new_batch_size: number; reason: string }
  | { type: 'paused' }
  | { type: 'resumed' }
  | { type: 'completed'; run_id: string; total_rows: number }
  | { type: 'error'; message: string; dataset?: string }
  | { type: 'cancelled' }
  | { type: 'state_snapshot'; progress: Record<string, unknown>; control: Record<string, unknown> }
  | { type: 'attached'; run_id: string };
