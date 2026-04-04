import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
  type ColumnFiltersState,
  type RowSelectionState,
  type ExpandedState,
  type ColumnPinningState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Columns3,
  Filter,
  Copy,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import { ColumnHeaderMenu } from '@/components/results/ColumnHeaderMenu';
import { CellContextMenu } from '@/components/results/CellContextMenu';
import { StatusBar } from '@/components/results/StatusBar';
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: [],
  });
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const fetchResults = useResults || useQueryResults;
  const { data, isLoading } = fetchResults(runId, {
    page,
    page_size: pageSize,
    sort_column: sortColumn || undefined,
    sort_direction: sortColumn ? sortDirection : undefined,
  });

  const handleSort = useCallback(
    (column: string, direction?: 'asc' | 'desc') => {
      if (direction) {
        setSortColumn(column);
        setSortDirection(direction);
      } else if (sortColumn === column) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
      setPage(1);
    },
    [sortColumn]
  );

  const handlePinColumn = useCallback(
    (columnId: string, side: 'left' | 'right' | false) => {
      setColumnPinning((prev) => {
        const left = (prev.left || []).filter((id) => id !== columnId);
        const right = (prev.right || []).filter((id) => id !== columnId);
        if (side === 'left') left.push(columnId);
        if (side === 'right') right.push(columnId);
        return { left, right };
      });
    },
    []
  );

  const handleHideColumn = useCallback((columnId: string) => {
    setColumnVisibility((prev) => ({ ...prev, [columnId]: false }));
  }, []);

  const handleCopyValue = useCallback((value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value);
    navigator.clipboard.writeText(text);
    toast.success('Value copied');
  }, []);

  const handleCopyRow = useCallback((rowData: Record<string, unknown>) => {
    navigator.clipboard.writeText(JSON.stringify(rowData, null, 2));
    toast.success('Row copied as JSON');
  }, []);

  const handleFilterByValue = useCallback(
    (columnId: string, value: unknown) => {
      setColumnFilters((prev) => {
        const existing = prev.filter((f) => f.id !== columnId);
        return [...existing, { id: columnId, value: String(value ?? '') }];
      });
      setShowFilters(true);
    },
    []
  );

  const handleExcludeValue = useCallback(
    (columnId: string, _value: unknown) => {
      // For simple text filter exclusion, we set a negative filter pattern.
      // In practice, the includesString filter is used, so we just open the filter row.
      setShowFilters(true);
      toast.info(`Filter opened for column "${columnId}". Adjust the filter to exclude the value.`);
    },
    []
  );

  // Selection checkbox column
  const selectionColumn: ColumnDef<Record<string, unknown>> = useMemo(
    () => ({
      id: '_select',
      header: ({ table: t }) => (
        <Checkbox
          checked={t.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => t.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          data-testid="select-all-checkbox"
        />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select row ${row.index + 1}`}
            data-testid={`select-row-${row.index}`}
          />
          <button
            className="rounded p-0.5 hover:bg-muted"
            onClick={() => row.toggleExpanded()}
            aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
            data-testid={`expand-row-${row.index}`}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ),
      size: 60,
      minSize: 60,
      maxSize: 60,
      enableResizing: false,
    }),
    []
  );

  const dataColumns: ColumnDef<Record<string, unknown>>[] = useMemo(
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

  const columns = useMemo(
    () => [selectionColumn, ...dataColumns],
    [selectionColumn, dataColumns]
  );

  const table = useReactTable({
    data: data?.rows || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableRowSelection: true,
    state: {
      columnVisibility,
      columnFilters,
      rowSelection,
      expanded,
      columnPinning,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onColumnPinningChange: setColumnPinning,
    columnResizeMode: resizable ? 'onChange' : undefined,
    columnResizeDirection: 'ltr',
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const filteredRowCount = filteredRows.length;
  const selectedCount = Object.keys(rowSelection).length;

  const aggregations = useMemo(() => {
    if (!showFooter || !data?.rows?.length || !data?.columns) return null;
    const rows = filteredRows;
    const result: Record<
      string,
      { type: string; sum?: number; avg?: number; count: number; unique: number }
    > = {};
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
    const visibleCols = table
      .getVisibleFlatColumns()
      .map((c) => c.id)
      .filter((id) => id !== '_select');
    const header = visibleCols.join('\t');
    const rows = filteredRows.map((row) =>
      visibleCols
        .map((colId) => {
          const val = row.getValue(colId);
          return val === null || val === undefined ? '' : String(val);
        })
        .join('\t')
    );
    navigator.clipboard.writeText([header, ...rows].join('\n'));
    toast.success('Table copied to clipboard');
  };

  // Keyboard navigation
  const visibleColumns = table.getVisibleFlatColumns();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!activeCell) return;
      const [rowIdx, colIdx] = activeCell;
      const maxRow = filteredRows.length - 1;
      const maxCol = visibleColumns.length - 1;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setActiveCell([Math.max(0, rowIdx - 1), colIdx]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveCell([Math.min(maxRow, rowIdx + 1), colIdx]);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setActiveCell([rowIdx, Math.max(0, colIdx - 1)]);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setActiveCell([rowIdx, Math.min(maxCol, colIdx + 1)]);
          break;
        case 'Enter':
          e.preventDefault();
          filteredRows[rowIdx]?.toggleExpanded();
          break;
      }
    },
    [activeCell, filteredRows, visibleColumns.length]
  );

  // Helper to determine pinning styles
  const getPinStyle = (
    columnId: string
  ): React.CSSProperties & { borderExtra?: string } => {
    const leftPins = columnPinning.left || [];
    const rightPins = columnPinning.right || [];
    if (leftPins.includes(columnId)) {
      const idx = leftPins.indexOf(columnId);
      let offset = 0;
      for (let i = 0; i < idx; i++) {
        const c = table.getColumn(leftPins[i]);
        offset += c?.getSize() ?? 150;
      }
      return {
        position: 'sticky' as const,
        left: offset,
        zIndex: 10,
        background: 'inherit',
      };
    }
    if (rightPins.includes(columnId)) {
      const idx = rightPins.indexOf(columnId);
      let offset = 0;
      for (let i = rightPins.length - 1; i > idx; i--) {
        const c = table.getColumn(rightPins[i]);
        offset += c?.getSize() ?? 150;
      }
      return {
        position: 'sticky' as const,
        right: offset,
        zIndex: 10,
        background: 'inherit',
      };
    }
    return {};
  };

  const getPinBorderClass = (columnId: string) => {
    const leftPins = columnPinning.left || [];
    const rightPins = columnPinning.right || [];
    if (leftPins.includes(columnId)) return 'border-r border-r-border/50';
    if (rightPins.includes(columnId)) return 'border-l border-l-border/50';
    return '';
  };

  const getColumnPinState = (columnId: string): 'left' | 'right' | false => {
    if ((columnPinning.left || []).includes(columnId)) return 'left';
    if ((columnPinning.right || []).includes(columnId)) return 'right';
    return false;
  };

  if (isLoading) {
    return (
      <div className="space-y-2" data-testid="loading-skeleton">
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
            {' | '}
            {visibleCount}/{totalCols} columns
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
                {table
                  .getAllColumns()
                  .filter((column) => column.id !== '_select')
                  .map((column) => (
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
      <div
        ref={tableContainerRef}
        className="overflow-auto rounded-md border"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        data-testid="table-container"
      >
        <table
          className="w-full text-sm"
          style={resizable ? { width: table.getCenterTotalSize() } : undefined}
        >
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/50">
                {hg.headers.map((header) => {
                  const pinStyle = getPinStyle(header.column.id);
                  const pinBorder = getPinBorderClass(header.column.id);
                  const isDataColumn = header.column.id !== '_select';

                  return (
                    <th
                      key={header.id}
                      className={cn('relative px-3 py-2 text-left', pinBorder)}
                      style={{
                        ...(resizable ? { width: header.getSize() } : {}),
                        ...pinStyle,
                      }}
                    >
                      {header.isPlaceholder ? null : isDataColumn ? (
                        <ColumnHeaderMenu
                          columnId={header.column.id}
                          pinned={getColumnPinState(header.column.id)}
                          onSort={(dir) => handleSort(header.column.id, dir)}
                          onPin={(side) => handlePinColumn(header.column.id, side)}
                          onHide={() => handleHideColumn(header.column.id)}
                          onAutoSize={() => {
                            header.column.resetSize();
                          }}
                          onResetWidth={() => {
                            header.column.resetSize();
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </ColumnHeaderMenu>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                      {resizable && isDataColumn && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/50 ${
                            header.column.getIsResizing() ? 'bg-primary' : ''
                          }`}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
            {/* Filter row */}
            {showFilters && (
              <tr className="border-b bg-muted/20">
                {table.getHeaderGroups()[0]?.headers.map((header) => (
                  <th key={header.id} className="px-2 py-1">
                    {header.column.id !== '_select' ? (
                      <Input
                        type="text"
                        placeholder="Filter..."
                        className="h-7 text-xs"
                        value={(header.column.getFilterValue() as string) ?? ''}
                        onChange={(e) =>
                          header.column.setFilterValue(e.target.value || undefined)
                        }
                      />
                    ) : null}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {filteredRows.map((row, rowIndex) => (
              <Fragment key={row.id}>
                <tr
                  className={cn(
                    'border-b transition-colors hover:bg-muted/30',
                    rowIndex % 2 === 1 && 'bg-muted/10',
                    row.getIsSelected() && 'bg-primary/5'
                  )}
                  data-testid={`data-row-${rowIndex}`}
                >
                  {row.getVisibleCells().map((cell, colIndex) => {
                    const pinStyle = getPinStyle(cell.column.id);
                    const pinBorder = getPinBorderClass(cell.column.id);
                    const isActive =
                      activeCell !== null &&
                      activeCell[0] === rowIndex &&
                      activeCell[1] === colIndex;
                    const isDataColumn = cell.column.id !== '_select';

                    const cellContent = flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    );

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-3 py-1.5',
                          pinBorder,
                          isActive && 'ring-2 ring-primary/50 ring-inset'
                        )}
                        style={{
                          ...(resizable ? { width: cell.column.getSize() } : {}),
                          ...pinStyle,
                        }}
                        onClick={() => setActiveCell([rowIndex, colIndex])}
                      >
                        {isDataColumn ? (
                          <CellContextMenu
                            value={cell.getValue()}
                            rowData={row.original}
                            columnId={cell.column.id}
                            onCopyValue={() => handleCopyValue(cell.getValue())}
                            onCopyRow={() => handleCopyRow(row.original)}
                            onFilterByValue={handleFilterByValue}
                            onExcludeValue={handleExcludeValue}
                          >
                            {cellContent}
                          </CellContextMenu>
                        ) : (
                          cellContent
                        )}
                      </td>
                    );
                  })}
                </tr>
                {/* Expanded sub-row */}
                {row.getIsExpanded() && (
                  <tr key={`${row.id}-expanded`} className="bg-muted/20">
                    <td
                      colSpan={row.getVisibleCells().length}
                      className="px-6 py-3"
                    >
                      <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">
                        {JSON.stringify(row.original, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          {/* Aggregation footer */}
          {showFooter && aggregations && (
            <tfoot>
              <tr className="border-t bg-muted/30 text-xs text-muted-foreground">
                {table.getVisibleFlatColumns().map((column) => {
                  if (column.id === '_select') {
                    return <td key={column.id} className="px-3 py-1.5" />;
                  }
                  const agg = aggregations[column.id];
                  if (!agg) return <td key={column.id} className="px-3 py-1.5" />;
                  if (agg.type === 'numeric') {
                    return (
                      <td key={column.id} className="px-3 py-1.5 tabular-nums">
                        <span title="Sum" className="mr-2">
                          &Sigma;{' '}
                          {agg.sum!.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span title="Average" className="text-muted-foreground/70">
                          &mu;{' '}
                          {agg.avg!.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
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

      {/* Status Bar (replaces old pagination in non-compact mode) */}
      {!compact && (
        <StatusBar
          totalRows={data.total}
          visibleRows={filteredRowCount}
          selectedCount={selectedCount}
          page={page}
          totalPages={data.total_pages}
          pageSize={pageSize}
          aggregations={aggregations ?? undefined}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
