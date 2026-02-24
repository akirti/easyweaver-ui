import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryResults } from '@/queries/use-queries';
import { queriesApi } from '@/api/queries';

interface Props {
  runId: string;
  compact?: boolean;
}

export function DataTable({ runId, compact }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(compact ? 10 : 50);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading } = useQueryResults(runId, {
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

  const columns: ColumnDef<Record<string, unknown>>[] = (data?.columns || []).map((col) => ({
    id: col.name,
    accessorFn: (row) => row[col.name],
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
    cell: ({ getValue }) => {
      const val = getValue();
      if (val === null || val === undefined) return <span className="text-muted-foreground">null</span>;
      if (typeof val === 'boolean') {
        return (
          <span className={`rounded px-1.5 py-0.5 text-xs ${val ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {String(val)}
          </span>
        );
      }
      if (typeof val === 'number') {
        return <span className="text-right tabular-nums">{val.toLocaleString()}</span>;
      }
      return String(val);
    },
  }));

  const table = useReactTable({
    data: data?.rows || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {!compact && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.total)} of{' '}
            {data.total.toLocaleString()} rows
          </span>
          <Button variant="outline" size="sm" onClick={() => queriesApi.exportCsv(runId)}>
            <Download className="mr-1 h-3 w-3" />
            Export CSV
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/50">
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2 text-left">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-1.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">Rows per page:</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
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
