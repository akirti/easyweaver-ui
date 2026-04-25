import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ParamSelect } from './ParamSelect';
import { ParamMultiSelect } from './ParamMultiSelect';
import { lookupsApi } from '@/api/processes';
import type { ParamDefinition } from '@/types';

interface ParamFormProps {
  params: Record<string, ParamDefinition>;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  processId?: string;
}

export function ParamForm({ params, values, onChange, processId }: ParamFormProps) {
  const entries = Object.entries(params);
  const [lookupOptions, setLookupOptions] = useState<Record<string, unknown[]>>({});

  // Auto-load cached lookup options on mount
  useEffect(() => {
    if (!processId) return;
    lookupsApi.get(processId).then((data) => {
      if (data?.lookups) {
        setLookupOptions(data.lookups);
      }
    }).catch(() => {
      // No cached lookups — user can still use refresh button
    });
  }, [processId]);

  if (entries.length === 0) return null;

  const handleChange = (key: string, value: unknown) => {
    onChange({ ...values, [key]: value });
  };

  const handleLookupRefreshed = (paramName: string, newOptions: unknown[]) => {
    setLookupOptions((prev) => ({ ...prev, [paramName]: newOptions }));
  };

  const renderInput = (key: string, param: ParamDefinition) => {
    // Merge cached lookup options into param
    const paramWithOptions: ParamDefinition = {
      ...param,
      options: lookupOptions[key]?.length ? lookupOptions[key] : (param.options ?? []),
    };

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
            param={paramWithOptions}
            value={values[key] ?? param.default}
            onChange={(v) => handleChange(key, v)}
            processId={processId}
            paramName={key}
            onLookupRefreshed={(opts) => handleLookupRefreshed(key, opts)}
          />
        );

      case 'multi_select':
        return (
          <ParamMultiSelect
            param={paramWithOptions}
            value={Array.isArray(values[key]) ? (values[key] as unknown[]) : []}
            onChange={(v) => handleChange(key, v)}
            processId={processId}
            paramName={key}
            onLookupRefreshed={(opts) => handleLookupRefreshed(key, opts)}
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
