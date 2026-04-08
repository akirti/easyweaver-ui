import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pin, Plus, Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/query/TypeBadge';
import { getTypeCategory, type TypeCategory } from '@/lib/column-types';
import { cn } from '@/lib/utils';
import type { ColumnInfo } from '@/types';

interface ColumnPickerProps {
  columns: ColumnInfo[];
  selected: string[];
  pinned: string[];
  onSelectedChange: (columns: string[]) => void;
  onPinnedChange: (pinned: string[]) => void;
  onOrderChange?: (orderedColumns: string[]) => void;
}

const TYPE_FILTERS: { label: string; value: TypeCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Numeric', value: 'numeric' },
  { label: 'Text', value: 'text' },
  { label: 'DateTime', value: 'datetime' },
  { label: 'Boolean', value: 'boolean' },
];

interface SortableColumnItemProps {
  column: ColumnInfo;
  isPinned: boolean;
  onRemove: (name: string) => void;
  onTogglePin: (name: string) => void;
}

function SortableColumnItem({ column, isPinned, onRemove, onTogglePin }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        aria-label={`Drag to reorder ${column.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="flex-1 truncate font-medium">{column.name}</span>
      <TypeBadge type={column.type} />
      <button
        type="button"
        onClick={() => onTogglePin(column.name)}
        className={cn(
          'rounded p-0.5 hover:bg-accent',
          isPinned ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-label={isPinned ? `Unpin ${column.name}` : `Pin ${column.name}`}
      >
        <Pin className={cn('h-3.5 w-3.5', isPinned && 'fill-current')} />
      </button>
      <button
        type="button"
        onClick={() => onRemove(column.name)}
        className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Remove ${column.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ColumnPicker({
  columns,
  selected,
  pinned,
  onSelectedChange,
  onPinnedChange,
  onOrderChange,
}: ColumnPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<TypeCategory | 'all'>>(
    new Set(['all']),
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnMap = useMemo(() => {
    const map = new Map<string, ColumnInfo>();
    for (const col of columns) {
      map.set(col.name, col);
    }
    return map;
  }, [columns]);

  const matchesSearch = useCallback(
    (name: string) => {
      if (!debouncedSearch) return true;
      return name.toLowerCase().includes(debouncedSearch.toLowerCase());
    },
    [debouncedSearch],
  );

  const matchesTypeFilter = useCallback(
    (type: string) => {
      if (activeTypeFilters.has('all')) return true;
      const category = getTypeCategory(type);
      return activeTypeFilters.has(category);
    },
    [activeTypeFilters],
  );

  const selectedColumns = useMemo(() => {
    return selected
      .map((name) => columnMap.get(name))
      .filter((col): col is ColumnInfo => col !== undefined);
  }, [selected, columnMap]);

  const availableColumns = useMemo(() => {
    return columns.filter(
      (col) =>
        !selected.includes(col.name) &&
        matchesSearch(col.name) &&
        matchesTypeFilter(col.type),
    );
  }, [columns, selected, matchesSearch, matchesTypeFilter]);

  const handleToggleTypeFilter = (value: TypeCategory | 'all') => {
    setActiveTypeFilters((prev) => {
      const next = new Set(prev);
      if (value === 'all') {
        return new Set(['all']);
      }
      next.delete('all');
      if (next.has(value)) {
        next.delete(value);
        if (next.size === 0) return new Set(['all']);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    onSelectedChange(columns.map((c) => c.name));
  };

  const handleDeselectAll = () => {
    const first = columns[0]?.name;
    onSelectedChange(first ? [first] : []);
    onPinnedChange([]);
  };

  const handleAdd = (name: string) => {
    onSelectedChange([...selected, name]);
  };

  const handleRemove = (name: string) => {
    const next = selected.filter((n) => n !== name);
    if (next.length === 0) return;
    onSelectedChange(next);
    if (pinned.includes(name)) {
      onPinnedChange(pinned.filter((n) => n !== name));
    }
  };

  const handleTogglePin = (name: string) => {
    if (pinned.includes(name)) {
      onPinnedChange(pinned.filter((n) => n !== name));
    } else {
      onPinnedChange([...pinned, name]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selected.indexOf(active.id as string);
    const newIndex = selected.indexOf(over.id as string);
    const reordered = arrayMove(selected, oldIndex, newIndex);
    onSelectedChange(reordered);
    onOrderChange?.(reordered);
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search columns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-8 text-sm"
        />
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by column type">
        {TYPE_FILTERS.map((f) => (
          <Button
            key={f.value}
            type="button"
            variant={activeTypeFilters.has(f.value) ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handleToggleTypeFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">
          {selected.length}/{columns.length} selected
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-xs"
          onClick={handleSelectAll}
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-xs"
          onClick={handleDeselectAll}
        >
          Deselect All
        </Button>
      </div>

      {/* Selected columns — 2-column grid layout */}
      <div>
        <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Selected ({selectedColumns.length})
        </div>
        <ScrollArea className="max-h-[280px]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={selected} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-2 pr-2">
                {selectedColumns.map((col) => (
                  <SortableColumnItem
                    key={col.name}
                    column={col}
                    isPinned={pinned.includes(col.name)}
                    onRemove={handleRemove}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {selectedColumns.length === 0 && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No columns selected
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Available columns — 2-column grid layout */}
      <div>
        <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Available ({availableColumns.length})
        </div>
        <ScrollArea className="max-h-[280px]">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-2 pr-2">
            {availableColumns.map((col) => (
              <div
                key={col.name}
                className="flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs"
              >
                <span className="flex-1 truncate">{col.name}</span>
                <TypeBadge type={col.type} />
                <button
                  type="button"
                  onClick={() => handleAdd(col.name)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  aria-label={`Add ${col.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {availableColumns.length === 0 && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              {columns.length === selected.length
                ? 'All columns are selected'
                : 'No columns match filters'}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
