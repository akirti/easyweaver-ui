import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSourceSchema } from '@/queries/use-sources';
import type { JoinConfig } from '@/types';

interface Props {
  leftSourceId: string | null;
  leftTable: string | null;
  rightSourceId: string | null;
  rightTable: string | null;
  joinConfig: JoinConfig | null;
  onChange: (config: JoinConfig) => void;
  leftAllowedColumns?: string[];
  rightAllowedColumns?: string[];
}

export function JoinConfigurator({
  leftSourceId,
  leftTable,
  rightSourceId,
  rightTable,
  joinConfig,
  onChange,
  leftAllowedColumns,
  rightAllowedColumns,
}: Props) {
  const { data: leftSchema } = useSourceSchema(leftSourceId || '');
  const { data: rightSchema } = useSourceSchema(rightSourceId || '');

  const leftColumnsAll = leftSchema?.find((t) => t.name === leftTable)?.columns || [];
  const rightColumnsAll = rightSchema?.find((t) => t.name === rightTable)?.columns || [];

  const leftColumns = leftAllowedColumns
    ? leftColumnsAll.filter((c) => leftAllowedColumns.includes(c.name))
    : leftColumnsAll;
  const rightColumns = rightAllowedColumns
    ? rightColumnsAll.filter((c) => rightAllowedColumns.includes(c.name))
    : rightColumnsAll;

  const leftCol = leftColumnsAll.find((c) => c.name === joinConfig?.left_on);
  const rightCol = rightColumnsAll.find((c) => c.name === joinConfig?.right_on);
  const typeMismatch = leftCol && rightCol && leftCol.type !== rightCol.type;

  if (!leftTable || !rightTable) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Select tables on both sides to configure the join
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Label className="text-sm font-semibold">Join Configuration</Label>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Join Type</Label>
          <Select
            value={joinConfig?.join_type || 'inner'}
            onValueChange={(v) =>
              onChange({
                ...joinConfig!,
                join_type: v as JoinConfig['join_type'],
                left_on: joinConfig?.left_on || '',
                right_on: joinConfig?.right_on || '',
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inner">Inner Join</SelectItem>
              <SelectItem value="left">Left Join</SelectItem>
              <SelectItem value="right">Right Join</SelectItem>
              <SelectItem value="outer">Full Outer Join</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Left Key ({leftTable})</Label>
          <Select
            value={joinConfig?.left_on || ''}
            onValueChange={(v) =>
              onChange({
                join_type: joinConfig?.join_type || 'inner',
                left_on: v,
                right_on: joinConfig?.right_on || '',
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {leftColumns.map((col) => (
                <SelectItem key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Right Key ({rightTable})</Label>
          <Select
            value={joinConfig?.right_on || ''}
            onValueChange={(v) =>
              onChange({
                join_type: joinConfig?.join_type || 'inner',
                left_on: joinConfig?.left_on || '',
                right_on: v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {rightColumns.map((col) => (
                <SelectItem key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {typeMismatch && (
        <Badge variant="secondary" className="text-amber-600">
          Type mismatch: {leftCol.type} vs {rightCol.type} (will be auto-coerced to string)
        </Badge>
      )}
    </div>
  );
}
