import { useState } from 'react';
import { ChevronRight, ChevronDown, Table, Columns, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSourceSchema, useTablePreview } from '@/queries/use-sources';
import { Skeleton } from '@/components/ui/skeleton';
import type { TableSchema } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  sourceId: string;
  sourceName?: string;
}

export function SchemaBrowser({ sourceId, sourceName }: Props) {
  const { data: tables, isLoading } = useSourceSchema(sourceId);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [previewTable, setPreviewTable] = useState<string | null>(null);

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-44" />
      </div>
    );
  }

  if (!tables?.length) {
    return <div className="text-sm text-muted-foreground">No tables found</div>;
  }

  return (
    <div className="space-y-1">
      {sourceName && (
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{sourceName}</h3>
      )}
      {tables.map((table) => (
        <TableNode
          key={table.name}
          table={table}
          isExpanded={expanded.has(table.name)}
          onToggle={() => toggle(table.name)}
          onPreview={() => setPreviewTable(table.name)}
        />
      ))}
      {previewTable && (
        <PreviewDialog
          sourceId={sourceId}
          table={previewTable}
          onClose={() => setPreviewTable(null)}
        />
      )}
    </div>
  );
}

function TableNode({
  table,
  isExpanded,
  onToggle,
  onPreview,
}: {
  table: TableSchema;
  isExpanded: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  return (
    <div>
      <div
        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Table className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{table.name}</span>
        <span className="text-xs text-muted-foreground">
          ~{table.row_estimate.toLocaleString()} rows
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6 px-1"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>
      {isExpanded && (
        <div className="ml-6 space-y-0.5 border-l pl-3">
          {table.columns.map((col) => (
            <div key={col.name} className="flex items-center gap-2 px-2 py-0.5 text-xs">
              <Columns className="h-3 w-3 text-muted-foreground" />
              <span>{col.name}</span>
              <Badge variant="outline" className="h-4 px-1 text-[10px]">
                {col.type}
              </Badge>
              {col.primary_key && (
                <Badge className="h-4 px-1 text-[10px]">PK</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewDialog({
  sourceId,
  table,
  onClose,
}: {
  sourceId: string;
  table: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useTablePreview(sourceId, table);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Preview: {table}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : data ? (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {data.columns.map((col) => (
                    <th key={col.name} className="px-3 py-2 text-left font-medium">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="border-b">
                    {data.columns.map((col) => (
                      <td key={col.name} className="px-3 py-1.5">
                        {String(row[col.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">
              Showing {data.total_sampled} sample rows
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">No data</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
