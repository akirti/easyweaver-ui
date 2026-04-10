import { useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from '@/components/ui/command';
import { useDistinctValues } from '@/queries/use-sources';
import { cn } from '@/lib/utils';

interface Props {
  sourceId: string;
  table: string;
  column: string;
  value: unknown[];
  onChange: (v: unknown[]) => void;
  limit?: number;
}

export function FilterValueMultiSelect({ sourceId, table, column, value, onChange, limit = 500 }: Props) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useDistinctValues(sourceId, table, column, limit, true);

  const items = data?.values ?? [];
  const truncated = data?.truncated ?? false;

  // Normalize value to string set for comparison
  const selectedSet = new Set((value ?? []).map((v) => String(v)));

  const toggleItem = (item: unknown) => {
    const itemStr = String(item);
    if (selectedSet.has(itemStr)) {
      onChange((value ?? []).filter((v) => String(v) !== itemStr));
    } else {
      onChange([...(value ?? []), item]);
    }
  };

  const selectAll = () => {
    onChange([...items]);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              size="sm"
              className="flex-1 justify-between font-normal"
            >
              <span className="truncate">
                {selectedSet.size > 0 ? `${selectedSet.size} selected` : 'Select values...'}
              </span>
              {isLoading ? (
                <Loader2 className="ml-2 h-3.5 w-3.5 shrink-0 animate-spin opacity-50" />
              ) : (
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search values..." />
              <div className="flex items-center gap-1 border-b px-2 py-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={selectAll}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={clearAll}
                >
                  Clear All
                </Button>
              </div>
              <CommandList>
                <CommandEmpty>No values found.</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => {
                    const itemStr = String(item ?? '');
                    const isSelected = selectedSet.has(itemStr);
                    return (
                      <CommandItem
                        key={itemStr}
                        value={itemStr}
                        onSelect={() => toggleItem(item)}
                      >
                        <div
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground opacity-50',
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span className="truncate">{itemStr === '' ? '(empty)' : itemStr}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {truncated && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground border-t">
                    Showing first {limit} of many values
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {selectedSet.size > 0 && (
        <div className="flex flex-wrap gap-1">
          {(value ?? []).slice(0, 10).map((v) => (
            <Badge
              key={String(v)}
              variant="secondary"
              className="text-xs cursor-pointer"
              onClick={() => toggleItem(v)}
            >
              {String(v)}
              <span className="ml-0.5">&times;</span>
            </Badge>
          ))}
          {(value ?? []).length > 10 && (
            <Badge variant="outline" className="text-xs">
              +{(value ?? []).length - 10} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
