import { Badge } from '@/components/ui/badge';
import { getTypeCategory, type TypeCategory } from '@/lib/column-types';
import { cn } from '@/lib/utils';

interface TypeBadgeProps {
  type: string;
  className?: string;
}

const categoryStyles: Record<TypeCategory, string> = {
  numeric: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  text: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  datetime: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  boolean: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300',
};

function shortenType(type: string): string {
  const lower = type.toLowerCase();

  if (lower === 'integer' || lower === 'int32' || lower === 'int16' || lower === 'int8') return 'INT';
  if (lower === 'bigint' || lower === 'int64') return 'BIGINT';
  if (lower === 'smallint') return 'SMALLINT';
  if (lower === 'real' || lower === 'float32') return 'FLOAT';
  if (lower === 'double precision' || lower === 'float64') return 'DOUBLE';
  if (lower === 'numeric' || lower === 'decimal128') return 'NUMERIC';
  if (lower === 'money') return 'MONEY';

  if (lower === 'character varying' || lower === 'utf8') return 'VARCHAR';
  if (lower === 'character') return 'CHAR';
  if (lower === 'text' || lower === 'string') return 'TEXT';
  if (lower === 'uuid' || lower === 'objectid') return 'UUID';

  if (lower === 'boolean' || lower === 'bool') return 'BOOL';

  if (lower === 'date') return 'DATE';
  if (lower.startsWith('timestamp')) return 'TIMESTAMP';
  if (lower.startsWith('time')) return 'TIME';
  if (lower === 'datetime') return 'DATETIME';
  if (lower === 'duration') return 'DURATION';

  return type.toUpperCase().slice(0, 10);
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const category = getTypeCategory(type);

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent text-[10px] px-1.5 py-0',
        categoryStyles[category],
        className,
      )}
      aria-label={`Type: ${type}`}
    >
      {shortenType(type)}
    </Badge>
  );
}
