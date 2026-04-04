import { Card, CardContent } from '@/components/ui/card';
import { TypeBadge } from '@/components/query/TypeBadge';
import { cn } from '@/lib/utils';
import { KeyRound } from 'lucide-react';
import type { ColumnInfo } from '@/types';

interface ColumnPreviewCardProps {
  column: ColumnInfo;
  className?: string;
}

export function ColumnPreviewCard({ column, className }: ColumnPreviewCardProps) {
  return (
    <Card className={cn('py-3', className)}>
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold">{column.name}</span>
          {column.primary_key && (
            <KeyRound className="h-3.5 w-3.5 text-amber-500" aria-label="Primary key" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Type:</span>
          <TypeBadge type={column.type} />
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Nullable: {column.nullable ? 'yes' : 'no'}</span>
          <span className="flex items-center gap-1">
            Primary key: {column.primary_key ? 'yes' : 'no'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
