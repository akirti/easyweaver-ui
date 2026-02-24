export type TypeCategory = 'numeric' | 'text' | 'datetime' | 'boolean' | 'other';

const NUMERIC_TYPES = new Set([
  // Postgres
  'smallint', 'integer', 'bigint', 'real', 'double precision', 'numeric', 'money',
  // MongoDB
  'integer', 'float', 'Decimal128',
  // Polars result types
  'Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64',
  'Float32', 'Float64',
]);

const TEXT_TYPES = new Set([
  // Postgres
  'character varying', 'character', 'text', 'uuid',
  // MongoDB
  'string', 'ObjectId',
  // Polars
  'Utf8', 'String',
]);

const DATETIME_TYPES = new Set([
  // Postgres
  'date', 'timestamp without time zone', 'timestamp with time zone',
  'time without time zone', 'time with time zone',
  // MongoDB
  'datetime',
  // Polars
  'Date', 'Datetime', 'Time', 'Duration',
]);

const BOOLEAN_TYPES = new Set([
  'boolean', 'Boolean', 'bool',
]);

export function getTypeCategory(type: string): TypeCategory {
  if (NUMERIC_TYPES.has(type)) return 'numeric';
  if (TEXT_TYPES.has(type)) return 'text';
  if (DATETIME_TYPES.has(type)) return 'datetime';
  if (BOOLEAN_TYPES.has(type)) return 'boolean';
  return 'other';
}

export interface OperatorDef {
  value: string;
  label: string;
}

const ALL_OPERATORS: OperatorDef[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'between', label: 'Between' },
  { value: 'like', label: 'Contains' },
  { value: 'in', label: 'In' },
  { value: 'not_in', label: 'Not In' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' },
];

const OPERATOR_SETS: Record<TypeCategory, Set<string>> = {
  numeric: new Set(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'between', 'in', 'not_in', 'is_null', 'is_not_null']),
  text: new Set(['eq', 'neq', 'like', 'in', 'not_in', 'is_null', 'is_not_null']),
  datetime: new Set(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'between', 'is_null', 'is_not_null']),
  boolean: new Set(['eq', 'neq', 'is_null', 'is_not_null']),
  other: new Set(['eq', 'neq', 'is_null', 'is_not_null']),
};

export function getOperatorsForType(category: TypeCategory): OperatorDef[] {
  const allowed = OPERATOR_SETS[category];
  return ALL_OPERATORS.filter((op) => allowed.has(op.value));
}

export function isDateOnly(type: string): boolean {
  return type === 'date' || type === 'Date';
}

export interface TransformDef {
  value: string;
  label: string;
}

const TRANSFORM_SETS: Record<TypeCategory, TransformDef[]> = {
  numeric: [
    { value: 'rename', label: 'Rename' },
    { value: 'round', label: 'Round' },
    { value: 'cast', label: 'Cast' },
  ],
  text: [
    { value: 'rename', label: 'Rename' },
    { value: 'uppercase', label: 'Uppercase' },
    { value: 'lowercase', label: 'Lowercase' },
    { value: 'trim', label: 'Trim' },
    { value: 'cast', label: 'Cast' },
  ],
  datetime: [
    { value: 'rename', label: 'Rename' },
    { value: 'format_date', label: 'Format Date' },
    { value: 'cast', label: 'Cast' },
  ],
  boolean: [
    { value: 'rename', label: 'Rename' },
    { value: 'cast', label: 'Cast' },
  ],
  other: [
    { value: 'rename', label: 'Rename' },
    { value: 'cast', label: 'Cast' },
  ],
};

export function getTransformsForType(category: TypeCategory): TransformDef[] {
  return TRANSFORM_SETS[category];
}

export interface DateFormatPreset {
  format: string;
  label: string;
}

export const DATE_FORMAT_PRESETS: DateFormatPreset[] = [
  { format: '%d-%m-%Y', label: 'DD-MM-YYYY' },
  { format: '%m/%d/%Y', label: 'MM/DD/YYYY' },
  { format: '%Y-%m-%d', label: 'YYYY-MM-DD' },
  { format: '%d %b %Y', label: 'DD Mon YYYY' },
  { format: '%B %d, %Y', label: 'Month DD, YYYY' },
  { format: '%Y/%m/%d %H:%M', label: 'YYYY/MM/DD HH:MM' },
];
