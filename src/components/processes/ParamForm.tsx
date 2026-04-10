import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ParamSelect } from './ParamSelect';
import { ParamMultiSelect } from './ParamMultiSelect';
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

  const renderInput = (key: string, param: ParamDefinition) => {
    switch (param.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2 pt-1">
            <Switch
              id={`param-${key}`}
              checked={Boolean(values[key] ?? param.default ?? false)}
              onCheckedChange={(checked) => handleChange(key, checked)}
            />
          </div>
        );

      case 'boolean_yesno':
        return (
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant={(values[key] ?? param.default) === true ? 'default' : 'outline'}
              onClick={() => handleChange(key, true)}
            >
              Yes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={(values[key] ?? param.default) === false ? 'default' : 'outline'}
              onClick={() => handleChange(key, false)}
            >
              No
            </Button>
          </div>
        );

      case 'boolean_truefalse':
        return (
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant={(values[key] ?? param.default) === true ? 'default' : 'outline'}
              onClick={() => handleChange(key, true)}
            >
              true
            </Button>
            <Button
              type="button"
              size="sm"
              variant={(values[key] ?? param.default) === false ? 'default' : 'outline'}
              onClick={() => handleChange(key, false)}
            >
              false
            </Button>
          </div>
        );

      case 'select':
        return (
          <ParamSelect
            param={param}
            value={values[key] ?? param.default}
            onChange={(v) => handleChange(key, v)}
          />
        );

      case 'multi_select':
        return (
          <ParamMultiSelect
            param={param}
            value={Array.isArray(values[key]) ? (values[key] as unknown[]) : []}
            onChange={(v) => handleChange(key, v)}
          />
        );

      default:
        return (
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
        );
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {entries.map(([key, param]) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`param-${key}`}>{param.label || key}</Label>
          {renderInput(key, param)}
        </div>
      ))}
    </div>
  );
}
