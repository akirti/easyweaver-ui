import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sourcesApi } from '@/api/sources';
import { lookupsApi } from '@/api/processes';
import { toast } from 'sonner';
import type { ParamDefinition } from '@/types';

interface ParamMultiSelectProps {
  param: ParamDefinition;
  value: unknown[];
  onChange: (v: unknown[]) => void;
  processId?: string;
  paramName?: string;
  onLookupRefreshed?: (options: unknown[]) => void;
}

export function ParamMultiSelect({
  param,
  value,
  onChange,
  processId,
  paramName,
  onLookupRefreshed,
}: ParamMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [localOptions, setLocalOptions] = useState<unknown[]>(param.options ?? []);
  const [refreshing, setRefreshing] = useState(false);

  // Sync when param.options changes (e.g., lookup data loaded)
  const paramOptionsKey = JSON.stringify(param.options ?? []);
  useMemo(() => {
    if ((param.options?.length ?? 0) > 0) {
      setLocalOptions(param.options!);
    }
  }, [paramOptionsKey]);

  const options = useMemo(() => localOptions.map((o) => String(o)), [localOptions]);
  const selected = useMemo(() => value.map((v) => String(v)), [value]);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(value.filter((v) => String(v) !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  const handleSelectAll = () => {
    onChange([...localOptions]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const removeChip = (opt: string) => {
    onChange(value.filter((v) => String(v) !== opt));
  };

  const handleRefresh = async () => {
    if (!param.options_source) {
      toast.error('No options source configured');
      return;
    }
    setRefreshing(true);
    try {
      const { source_id, table, column } = param.options_source;
      const resp = await sourcesApi.getDistinctValues(
        source_id,
        table,
        column,
        param.max_options ?? 500,
      );
      setLocalOptions(resp.values);
      onLookupRefreshed?.(resp.values);

      // Also update the lookup cache if we have a processId
      if (processId) {
        lookupsApi.refresh(processId).catch(() => {
          // Silent — best-effort cache update
        });
      }

      // Remove selected values that no longer exist
      const newStrings = resp.values.map((v) => String(v));
      const removed = selected.filter((s) => !newStrings.includes(s));
      if (removed.length > 0) {
        onChange(value.filter((v) => newStrings.includes(String(v))));
        toast.warning(`${removed.length} selected value(s) no longer available`);
      }
      if (resp.truncated) {
        toast.info(`Showing first ${resp.values.length} values (truncated)`);
      }
    } catch {
      toast.error('Failed to refresh options');
    } finally {
      setRefreshing(false);
    }
  };

  if (options.length === 0 && !param.options_source) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">No options available</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              <span className="truncate">
                {selected.length === 0
                  ? 'Select values...'
                  : `${selected.length} selected`}
              </span>
              <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search..." />
              <div className="flex items-center justify-between border-b px-2 py-1.5">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
              <CommandList>
                <CommandEmpty>
                  {options.length === 0
                    ? 'No options. Click refresh to load.'
                    : 'No match found.'}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt}
                      value={opt}
                      onSelect={() => toggleOption(opt)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selected.includes(opt) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {opt}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {param.options_source && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh options from live source"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1 text-xs">
              {s}
              <button
                type="button"
                className="ml-0.5 rounded-full outline-none hover:bg-secondary-foreground/20"
                onClick={() => removeChip(s)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
