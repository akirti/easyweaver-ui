import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { ParamDefinition } from '@/types';

interface ParamFormProps {
  params: Record<string, ParamDefinition>;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

export function ParamForm({ params, values, onChange }: ParamFormProps) {
  const entries = Object.entries(params);

  if (entries.length === 0) return null;

  const handleChange = (key: string, value: unknown) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {entries.map(([key, param]) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`param-${key}`}>{param.label || key}</Label>
          {param.type === 'boolean' ? (
            <div className="flex items-center gap-2 pt-1">
              <Switch
                id={`param-${key}`}
                checked={Boolean(values[key] ?? param.default ?? false)}
                onCheckedChange={(checked) => handleChange(key, checked)}
              />
            </div>
          ) : (
            <Input
              id={`param-${key}`}
              type={
                param.type === 'number'
                  ? 'number'
                  : param.type === 'date'
                    ? 'date'
                    : param.type === 'datetime'
                      ? 'datetime-local'
                      : 'text'
              }
              value={String(values[key] ?? param.default ?? '')}
              onChange={(e) => {
                const val =
                  param.type === 'number'
                    ? e.target.valueAsNumber || ''
                    : e.target.value;
                handleChange(key, val);
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
