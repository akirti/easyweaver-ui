import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import client from '@/api/client';

interface DatasetPreviewProps {
  runId: string;
  datasetKey: string;
  open: boolean;
  onClose: () => void;
}

interface PreviewData {
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
}

export function DatasetPreview({ runId, datasetKey, open, onClose }: DatasetPreviewProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    client
      .get<PreviewData>(
        `/processes/runs/${runId}/preview/${encodeURIComponent(datasetKey)}`,
        { params: { page_size: 100 } }
      )
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load preview'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, runId, datasetKey]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview: {datasetKey}</DialogTitle>
          <DialogDescription>
            First 100 rows of intermediate results
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {data && !loading && (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {data.columns.map((col) => (
                      <th
                        key={col}
                        className="whitespace-nowrap px-3 py-2 text-left font-medium"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}
                    >
                      {data.columns.map((col) => {
                        const val = row[col];
                        return (
                          <td key={col} className="whitespace-nowrap px-3 py-1.5">
                            {val === null || val === undefined ? (
                              <span className="italic text-muted-foreground">null</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.total > data.rows.length && (
                <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                  Showing {data.rows.length} of {data.total.toLocaleString()} rows
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
