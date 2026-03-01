import { useState, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Columns3,
  Filter,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryResults } from '@/queries/use-queries';
import { queriesApi } from '@/api/queries';
import { getTypeCategory } from '@/lib/column-types';
import { toast } from 'sonner';
import type { QueryResults } from '@/types';

type ResultsFetcher = (
  runId: string | null,
  params: { page?: number; page_size?: number; sort_column?: string; sort_direction?: string }
) => { data: QueryResults | undefined; isLoading: boolean };

interface Props {
  runId: string;
  compact?: boolean;
  useResults?: ResultsFetcher;
  hideExport?: boolean;
  showFooter?: boolean;
  showColumnFilters?: boolean;
  resizable?: boolean;
}

export function DataTable({
  runId,
  compact,
  useResults,
  hideExport,
  showFooter = !compact,
  showColumnFilters = !compact,
  resizable = !compact,
}: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(compact ? 10 : 50);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchResults = useResults || useQueryResults;
  const { data, isLoading } = fetchResults(runId, {
    page,
    page_size: pageSize,
    sort_column: sortColumn || undefined,
    sort_direction: sortColumn ? sortDirection : undefined,
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const columns: ColumnDef<Record<string, unknown>>[] = useMemo(
    () =>
      (data?.columns || []).map((col) => ({
        id: col.name,
        accessorFn: (row: Record<string, unknown>) => row[col.name],
        header: () => (
          <button
            className="flex items-center gap-1 font-medium hover:text-foreground"
            onClick={() => handleSort(col.name)}
          >
            {col.name}
            {sortColumn === col.name ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </button>
        ),
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const val = getValue();
          if (val === null || val === undefined)
            return <span className="text-muted-foreground italic">null</span>;
          if (typeof val === 'boolean') {
            return (
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${val ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
              >
                {String(val)}
              </span>
            );
          }
          if (typeof val === 'number') {
            return <span className="text-right tabular-nums">{val.toLocaleString()}</span>;
          }
          const str = String(val);
          if (str.length > 100) {
            return (
              <span title={str} className="cursor-help">
                {str.slice(0, 100)}...
              </span>
            );
          }
          return str;
        },
        filterFn: 'includesString' as const,
        size: 150,
        minSize: 60,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.columns, sortColumn, sortDirection]
  );

  const table = useReactTable({
    data: data?.rows || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnVisibility,
      columnFilters,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    columnResizeMode: resizable ? 'onChange' : undefined,
    columnResizeDirection: 'ltr',
  });

  // Aggregation footer computations
  const filteredRows = table.getFilteredRowModel().rows;
  const filteredRowCount = filteredRows.length;

  const aggregations = useMemo(() => {
    if (!showFooter || !data?.rows?.length || !data?.columns) return null;
    const rows = filteredRows;
    const result: Record<string, { type: string; sum?: number; avg?: number; count: number; unique: number }> = {};
    for (const col of data.columns) {
      const category = getTypeCategory(col.type);
      const values = rows.map((r) => r.getValue(col.name));
      const nonNull = values.filter((v) => v !== null && v !== undefined);
      if (category === 'numeric') {
        const nums = nonNull.filter((v) => typeof v === 'number') as number[];
        const sum = nums.reduce((a, b) => a + b, 0);
        result[col.name] = {
          type: 'numeric',
          sum,
          avg: nums.length ? sum / nums.length : 0,
          count: nums.length,
          unique: new Set(nums).size,
        };
      } else {
        result[col.name] = {
          type: 'other',
          count: nonNull.length,
          unique: new Set(nonNull.map(String)).size,
        };
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.rows, data?.columns, showFooter, columnFilters]);

  const handleCopyTable = () => {
    if (!data) return;
    const visibleCols = table.getVisibleFlatColumns().map((c) => c.id);
    const header = visibleCols.join('\t');
    const rows = filteredRows.map((row) =>
      visibleCols.map((colId) => {
        const val = row.getValue(colId);
        return val === null || val === undefined ? '' : String(val);
      }).join('\t')
    );
    navigator.clipboard.writeText([header, ...rows].join('\n'));
    toast.success('Table copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">No results</div>;
  }

  const visibleCount = table.getVisibleFlatColumns().length;
  const totalCols = table.getAllColumns().length;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.total)} of{' '}
            {data.total.toLocaleString()} rows
            {filteredRowCount < data.rows.length && (
              <span className="ml-1">({filteredRowCount} visible)</span>
            )}
            {' | '}{visibleCount}/{totalCols} columns
          </span>
          <div className="flex items-center gap-1.5">
            {showColumnFilters && (
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowFilters((v) => !v);
                  if (showFilters) setColumnFilters([]);
                }}
              >
                <Filter className="mr-1 h-3 w-3" />
                Filter
              </Button>
            )}

            {/* Column visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="mr-1 h-3 w-3" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table.getAllColumns().map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={handleCopyTable}>
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </Button>

            {!hideExport && (
              <Button variant="outline" size="sm" onClick={() => queriesApi.exportCsv(runId)}>
                <Download className="mr-1 h-3 w-3" />
                CSV
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto rounded-md border">
        <table
          className="w-full text-sm"
          style={resizable ? { width: table.getCenterTotalSize() } : undefined}
        >
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/50">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="relative px-3 py-2 text-left"
                    style={resizable ? { width: header.getSize() } : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {resizable && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/50 ${
                          header.column.getIsResizing() ? 'bg-primary' : ''
                        }`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
            {/* Filter row */}
            {showFilters && (
              <tr className="border-b bg-muted/20">
                {table.getHeaderGroups()[0]?.headers.map((header) => (
                  <th key={header.id} className="px-2 py-1">
                    <Input
                      type="text"
                      placeholder="Filter..."
                      className="h-7 text-xs"
                      value={(header.column.getFilterValue() as string) ?? ''}
                      onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                    />
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="border-b transition-colors hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-1.5"
                    style={resizable ? { width: cell.column.getSize() } : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {/* Aggregation footer */}
          {showFooter && aggregations && (
            <tfoot>
              <tr className="border-t bg-muted/30 text-xs text-muted-foreground">
                {table.getVisibleFlatColumns().map((column) => {
                  const agg = aggregations[column.id];
                  if (!agg) return <td key={column.id} className="px-3 py-1.5" />;
                  if (agg.type === 'numeric') {
                    return (
                      <td key={column.id} className="px-3 py-1.5 tabular-nums">
                        <span title="Sum" className="mr-2">
                          &Sigma; {agg.sum!.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                        <span title="Average" className="text-muted-foreground/70">
                          &mu; {agg.avg!.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    );
                  }
                  return (
                    <td key={column.id} className="px-3 py-1.5">
                      {agg.unique} unique
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {data.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
