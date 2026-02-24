import { Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [''];
  if (Array.isArray(val)) return val.length > 0 ? val : [''];
  return [val];
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

  const leftKeys = toArray(joinConfig?.left_on);
  const rightKeys = toArray(joinConfig?.right_on);
  const pairCount = Math.max(leftKeys.length, rightKeys.length);
  const pairs = Array.from({ length: pairCount }, (_, i) => ({
    left: leftKeys[i] || '',
    right: rightKeys[i] || '',
  }));

  const emitChange = (newPairs: { left: string; right: string }[], joinType?: JoinConfig['join_type']) => {
    onChange({
      join_type: joinType || joinConfig?.join_type || 'inner',
      left_on: newPairs.map((p) => p.left),
      right_on: newPairs.map((p) => p.right),
    });
  };

  const updatePair = (index: number, side: 'left' | 'right', value: string) => {
    const newPairs = pairs.map((p, i) =>
      i === index ? { ...p, [side]: value } : p
    );
    emitChange(newPairs);
  };

  const addPair = () => {
    emitChange([...pairs, { left: '', right: '' }]);
  };

  const removePair = (index: number) => {
    emitChange(pairs.filter((_, i) => i !== index));
  };

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

      <div>
        <Label className="text-xs text-muted-foreground">Join Type</Label>
        <Select
          value={joinConfig?.join_type || 'inner'}
          onValueChange={(v) => emitChange(pairs, v as JoinConfig['join_type'])}
        >
          <SelectTrigger className="w-48">
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

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Column Pairs</Label>
        {pairs.map((pair, i) => {
          const leftCol = leftColumnsAll.find((c) => c.name === pair.left);
          const rightCol = rightColumnsAll.find((c) => c.name === pair.right);
          const mismatch = leftCol && rightCol && leftCol.type !== rightCol.type;

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <Select
                  value={pair.left || ''}
                  onValueChange={(v) => updatePair(i, 'left', v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={`${leftTable} column`} />
                  </SelectTrigger>
                  <SelectContent>
                    {leftColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name} ({col.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-sm text-muted-foreground">=</span>

                <Select
                  value={pair.right || ''}
                  onValueChange={(v) => updatePair(i, 'right', v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={`${rightTable} column`} />
                  </SelectTrigger>
                  <SelectContent>
                    {rightColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name} ({col.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {pairs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePair(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {mismatch && (
                <Badge variant="secondary" className="text-amber-600">
                  Type mismatch: {leftCol.type} vs {rightCol.type} (auto-coerced)
                </Badge>
              )}
            </div>
          );
        })}

        <Button variant="outline" size="sm" onClick={addPair}>
          <Plus className="mr-1 h-3 w-3" />
          Add Column Pair
        </Button>
      </div>
    </div>
  );
}
