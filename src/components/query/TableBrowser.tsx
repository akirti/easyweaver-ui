import { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Star,
  StarOff,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { TableSchema } from '@/types';

const RECENT_TABLES_KEY = 'easyweaver-recent-tables';
const FAVORITE_TABLES_KEY = 'easyweaver-favorite-tables';
const MAX_RECENT = 5;

function getStoredList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string');
    return [];
  } catch {
    return [];
  }
}

function setStoredList(key: string, list: string[]): void {
  localStorage.setItem(key, JSON.stringify(list));
}

function getSizeColor(rowEstimate: number): string {
  if (rowEstimate < 10_000) return 'bg-green-500';
  if (rowEstimate < 1_000_000) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getSchemaPrefix(tableName: string): string {
  const dotIndex = tableName.indexOf('.');
  return dotIndex > 0 ? tableName.substring(0, dotIndex) : 'default';
}

interface TableBrowserProps {
  tables: TableSchema[];
  selectedTable: string | null;
  onTableSelect: (table: string) => void;
  isLoading?: boolean;
}

export function TableBrowser({
  tables,
  selectedTable,
  onTableSelect,
  isLoading = false,
}: TableBrowserProps) {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() =>
    getStoredList(FAVORITE_TABLES_KEY)
  );
  const [recentTables, setRecentTables] = useState<string[]>(() =>
    getStoredList(RECENT_TABLES_KEY)
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

  const filteredTables = useMemo(() => {
    if (!search.trim()) return tables;
    const lowerSearch = search.toLowerCase();
    return tables.filter((t) => t.name.toLowerCase().includes(lowerSearch));
  }, [tables, search]);

  const groupedTables = useMemo(() => {
    const groups = new Map<string, TableSchema[]>();
    for (const table of filteredTables) {
      const prefix = getSchemaPrefix(table.name);
      const existing = groups.get(prefix);
      if (existing) {
        existing.push(table);
      } else {
        groups.set(prefix, [table]);
      }
    }
    return groups;
  }, [filteredTables]);

  const recentTableSchemas = useMemo(() => {
    const tableMap = new Map(tables.map((t) => [t.name, t]));
    return recentTables
      .filter((name) => tableMap.has(name))
      .slice(0, MAX_RECENT)
      .map((name) => tableMap.get(name)!);
  }, [tables, recentTables]);

  const favoriteTableSchemas = useMemo(() => {
    const tableMap = new Map(tables.map((t) => [t.name, t]));
    return favorites
      .filter((name) => tableMap.has(name))
      .map((name) => tableMap.get(name)!);
  }, [tables, favorites]);

  const handleTableSelect = useCallback(
    (tableName: string) => {
      onTableSelect(tableName);
      setRecentTables((prev) => {
        const next = [tableName, ...prev.filter((t) => t !== tableName)].slice(
          0,
          MAX_RECENT
        );
        setStoredList(RECENT_TABLES_KEY, next);
        return next;
      });
    },
    [onTableSelect]
  );

  const toggleFavorite = useCallback(
    (tableName: string, event: React.MouseEvent) => {
      event.stopPropagation();
      setFavorites((prev) => {
        const next = prev.includes(tableName)
          ? prev.filter((t) => t !== tableName)
          : [...prev, tableName];
        setStoredList(FAVORITE_TABLES_KEY, next);
        return next;
      });
    },
    []
  );

  const toggleGroup = useCallback((groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2 p-2" data-testid="table-browser-loading">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  function renderTableRow(table: TableSchema) {
    const isFavorite = favorites.includes(table.name);
    const isSelected = selectedTable === table.name;

    return (
      <button
        key={table.name}
        type="button"
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
          isSelected && 'bg-accent font-medium'
        )}
        onClick={() => handleTableSelect(table.name)}
        data-testid={`table-row-${table.name}`}
      >
        <span
          className={cn('h-2 w-2 shrink-0 rounded-full', getSizeColor(table.row_estimate))}
          data-testid={`size-indicator-${table.name}`}
          aria-label={`Size indicator for ${table.name}`}
        />
        <span className="flex-1 truncate">{table.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {table.row_estimate.toLocaleString()} rows
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => toggleFavorite(table.name, e)}
          aria-label={isFavorite ? `Unstar ${table.name}` : `Star ${table.name}`}
          data-testid={`star-toggle-${table.name}`}
        >
          {isFavorite ? (
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          ) : (
            <StarOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative px-2 pt-2">
        <Search className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
          data-testid="table-search-input"
        />
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="space-y-1 p-2">
          {tables.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No tables available
            </p>
          )}

          {recentTableSchemas.length > 0 && !search.trim() && (
            <div>
              <p className="mb-1 px-2 text-xs font-semibold text-muted-foreground">
                Recently Used
              </p>
              {recentTableSchemas.map(renderTableRow)}
            </div>
          )}

          {favoriteTableSchemas.length > 0 && !search.trim() && (
            <div>
              <p className="mb-1 px-2 text-xs font-semibold text-muted-foreground">
                Favorites
              </p>
              {favoriteTableSchemas.map(renderTableRow)}
            </div>
          )}

          {Array.from(groupedTables.entries()).map(([group, groupTables]) => {
            const isCollapsed = collapsedGroups.has(group);
            return (
              <div key={group}>
                <button
                  type="button"
                  className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent"
                  onClick={() => toggleGroup(group)}
                  data-testid={`group-header-${group}`}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  <span>{group}</span>
                  <span className="ml-auto">{groupTables.length}</span>
                </button>
                {!isCollapsed && groupTables.map(renderTableRow)}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
