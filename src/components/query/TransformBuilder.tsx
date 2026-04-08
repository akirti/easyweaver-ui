import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TransformSpec, TransformType, CastTargetType, ColumnInfo } from '@/types';
import {
  getTypeCategory,
  getTransformsForType,
  DATE_FORMAT_PRESETS,
} from '@/lib/column-types';

interface Props {
  columns: ColumnInfo[];
  transforms: TransformSpec[];
  onChange: (transforms: TransformSpec[]) => void;
}

const CAST_OPTIONS: { value: CastTargetType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'float', label: 'Float' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Datetime' },
];

function DateFormatInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [isCustom, setIsCustom] = useState(
    () => !!value && !DATE_FORMAT_PRESETS.some((p) => p.format === value)
  );

  if (isCustom) {
    return (
      <div className="flex flex-1 items-center gap-1">
        <Input
          className="flex-1"
          placeholder="%Y-%m-%d"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => setIsCustom(false)}
        >
          Presets
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-1">
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Choose format..." />
        </SelectTrigger>
        <SelectContent position="popper">
          {DATE_FORMAT_PRESETS.map((p) => (
            <SelectItem key={p.format} value={p.format}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={() => setIsCustom(true)}
      >
        Custom
      </Button>
    </div>
  );
}

export function TransformBuilder({ columns, transforms, onChange }: Props) {
  const addTransform = () => {
    const col = columns[0]?.name || '';
    const colType = columns[0]?.type || '';
    const category = getTypeCategory(colType);
    const available = getTransformsForType(category);
    onChange([
      ...transforms,
      { column: col, type: (available[0]?.value || 'rename') as TransformType },
    ]);
  };

  const removeTransform = (index: number) => {
    onChange(transforms.filter((_, i) => i !== index));
  };

  const updateTransform = (index: number, updates: Partial<TransformSpec>) => {
    const current = transforms[index];
    let updated = { ...current, ...updates };

    // When changing column, reset type if it's no longer valid
    if (updates.column) {
      const colType = columns.find((c) => c.name === updates.column)?.type || '';
      const category = getTypeCategory(colType);
      const available = getTransformsForType(category);
      if (!available.some((t) => t.value === updated.type)) {
        updated = {
          column: updates.column,
          type: (available[0]?.value || 'rename') as TransformType,
        };
      }
    }

    // When changing type, clear stale params
    if (updates.type && updates.type !== current.type) {
      updated = { column: updated.column, type: updates.type };
    }

    onChange(transforms.map((t, i) => (i === index ? updated : t)));
  };

  return (
    <div className="space-y-2">
      {transforms.map((transform, i) => {
        const colType = columns.find((c) => c.name === transform.column)?.type || '';
        const category = getTypeCategory(colType);
        const availableTransforms = getTransformsForType(category);

        return (
          <div key={`${transform.column}-${transform.type}-${i}`} className="flex items-center gap-2">
            {/* Column selector */}
            <Select
              value={transform.column}
              onValueChange={(v) => updateTransform(i, { column: v })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {columns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    <span>{col.name}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({col.type})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Transform type selector */}
            <Select
              value={transform.type}
              onValueChange={(v) => updateTransform(i, { type: v as TransformType })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {availableTransforms.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Params — conditional on type */}
            {transform.type === 'rename' && (
              <Input
                className="flex-1"
                placeholder="New column name"
                value={transform.new_name || ''}
                onChange={(e) => updateTransform(i, { ...transform, new_name: e.target.value })}
              />
            )}

            {transform.type === 'format_date' && (
              <DateFormatInput
                value={transform.date_format || ''}
                onChange={(v) => updateTransform(i, { ...transform, date_format: v })}
              />
            )}

            {transform.type === 'round' && (
              <Input
                type="number"
                className="w-24"
                min={0}
                max={10}
                placeholder="Decimals"
                value={transform.decimals ?? ''}
                onChange={(e) =>
                  updateTransform(i, { ...transform, decimals: Number.parseInt(e.target.value) || 0 })
                }
              />
            )}

            {transform.type === 'cast' && (
              <Select
                value={transform.target_type || ''}
                onValueChange={(v) =>
                  updateTransform(i, { ...transform, target_type: v as CastTargetType })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Target type..." />
                </SelectTrigger>
                <SelectContent position="popper">
                  {CAST_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* strip_leading_zeros — no params, just casts to string and strips */}
            {transform.type === 'strip_leading_zeros' && (
              <div className="flex-1 text-xs text-muted-foreground self-center">
                Remove leading zeros (e.g. 00123 → 123)
              </div>
            )}

            {/* pad_left — pad character + target length */}
            {transform.type === 'pad_left' && (
              <>
                <Input
                  className="w-16"
                  maxLength={1}
                  placeholder="0"
                  value={transform.pad_char || ''}
                  onChange={(e) => updateTransform(i, { ...transform, pad_char: e.target.value })}
                />
                <Input
                  type="number"
                  className="w-20"
                  min={1}
                  max={50}
                  placeholder="Length"
                  value={transform.pad_length ?? ''}
                  onChange={(e) =>
                    updateTransform(i, { ...transform, pad_length: Number.parseInt(e.target.value) || 0 })
                  }
                />
              </>
            )}

            {/* replace — find and replace strings */}
            {transform.type === 'replace' && (
              <>
                <Input
                  className="flex-1"
                  placeholder="Find"
                  value={transform.find_str || ''}
                  onChange={(e) => updateTransform(i, { ...transform, find_str: e.target.value })}
                />
                <Input
                  className="flex-1"
                  placeholder="Replace with"
                  value={transform.replace_str || ''}
                  onChange={(e) => updateTransform(i, { ...transform, replace_str: e.target.value })}
                />
              </>
            )}

            {/* substring — start offset + length */}
            {transform.type === 'substring' && (
              <>
                <Input
                  type="number"
                  className="w-20"
                  min={0}
                  placeholder="Start"
                  value={transform.start ?? ''}
                  onChange={(e) =>
                    updateTransform(i, { ...transform, start: Number.parseInt(e.target.value) || 0 })
                  }
                />
                <Input
                  type="number"
                  className="w-20"
                  min={1}
                  placeholder="Length"
                  value={transform.length ?? ''}
                  onChange={(e) =>
                    updateTransform(i, { ...transform, length: Number.parseInt(e.target.value) || undefined })
                  }
                />
              </>
            )}

            {/* No extra params for uppercase/lowercase/trim */}
            {['uppercase', 'lowercase', 'trim'].includes(transform.type) && (
              <div className="flex-1" />
            )}

            <Button variant="ghost" size="sm" onClick={() => removeTransform(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <Button variant="outline" size="sm" onClick={addTransform} disabled={columns.length === 0}>
        <Plus className="mr-1 h-3 w-3" />
        Add Transform
      </Button>
    </div>
  );
}
