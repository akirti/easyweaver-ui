import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
import { Check, ChevronsUpDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sourcesApi } from '@/api/sources';
import { toast } from 'sonner';
import type { ParamDefinition } from '@/types';

interface ParamSelectProps {
  param: ParamDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function ParamSelect({ param, value, onChange }: ParamSelectProps) {
  const [open, setOpen] = useState(false);
  const [localOptions, setLocalOptions] = useState<unknown[]>(param.options ?? []);
  const [refreshing, setRefreshing] = useState(false);

  const options = useMemo(() => localOptions.map((o) => String(o)), [localOptions]);

  const selectedLabel = value != null ? String(value) : '';

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
      // Check if current selection still exists
      if (value != null && !resp.values.some((v) => String(v) === String(value))) {
        toast.warning('Previously selected value is no longer available');
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
              {selectedLabel || 'Select value...'}
            </span>
            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
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
                    onSelect={() => {
                      onChange(opt === selectedLabel ? undefined : opt);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        opt === selectedLabel ? 'opacity-100' : 'opacity-0',
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
          title="Refresh options"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </Button>
      )}
    </div>
  );
}
