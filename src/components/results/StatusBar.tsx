import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatusBarProps {
  totalRows: number;
  visibleRows: number;
  selectedCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
  queryTime?: number;
  aggregations?: Record<
    string,
    { type: string; sum?: number; avg?: number; count: number; unique: number }
  >;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function StatusBar({
  totalRows,
  visibleRows,
  selectedCount,
  page,
  totalPages,
  pageSize,
  queryTime,
  aggregations,
  onPageChange,
  onPageSizeChange,
}: StatusBarProps) {
  const [jumpPage, setJumpPage] = useState('');

  const rangeStart = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalRows);

  const numericAggs = aggregations
    ? Object.entries(aggregations)
        .filter(([, agg]) => agg.type === 'numeric' && agg.sum !== undefined)
        .slice(0, 2)
    : [];

  const handleJump = () => {
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
    }
    setJumpPage('');
  };

  return (
    <div
      className="flex items-center justify-between border-t bg-muted/20 px-3 py-1.5 text-sm"
      data-testid="status-bar"
    >
      {/* Left: row range + selection */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <span data-testid="status-row-range">
          Showing {rangeStart.toLocaleString()}-{rangeEnd.toLocaleString()} of{' '}
          {totalRows.toLocaleString()}
        </span>
        {selectedCount > 0 && (
          <span data-testid="status-selected">
            ({selectedCount.toLocaleString()} selected)
          </span>
        )}
      </div>

      {/* Center: aggregation stats */}
      {numericAggs.length > 0 && (
        <div
          className="hidden items-center gap-4 text-xs text-muted-foreground md:flex"
          data-testid="status-aggregations"
        >
          {numericAggs.map(([colName, agg]) => (
            <span key={colName}>
              <span className="font-medium">{colName}:</span>{' '}
              <span title="Sum">
                Sum {agg.sum!.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              {' | '}
              <span title="Avg">
                Avg {agg.avg!.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Right: query time + pagination */}
      <div className="flex items-center gap-2">
        {queryTime !== undefined && (
          <span className="text-xs text-muted-foreground" data-testid="status-query-time">
            {queryTime.toFixed(1)}s
          </span>
        )}

        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-7 w-[70px] text-xs" data-testid="status-page-size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          data-testid="status-prev"
        >
          Previous
        </Button>

        <span className="text-xs" data-testid="status-page-info">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          data-testid="status-next"
        >
          Next
        </Button>

        <Input
          type="number"
          className="h-7 w-14 text-xs"
          placeholder="Go"
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJump();
          }}
          data-testid="status-jump"
        />
      </div>
    </div>
  );
}
