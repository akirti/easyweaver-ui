import { useState } from 'react';
import { Upload, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useProcessRunHistory,
  useSaveResultsToGcp,
  useReloadFromGcp,
} from '@/queries/use-processes';
import { DataTable } from '@/components/results/DataTable';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/client';

interface RunHistoryProps {
  configId: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export function RunHistory({ configId }: RunHistoryProps) {
  const { data, isLoading } = useProcessRunHistory(configId);
  const saveToGcpMutation = useSaveResultsToGcp();
  const reloadMutation = useReloadFromGcp();
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const handleSaveToGcp = async (runId: string) => {
    try {
      const result = await saveToGcpMutation.mutateAsync(runId);
      toast.success(`Saved to GCP: ${result.gcp_path}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleReload = async (runId: string) => {
    try {
      const result = await reloadMutation.mutateAsync(runId);
      toast.success(`Reloaded ${result.row_count} rows from GCP`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
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

  if (!data || data.runs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No runs yet. Execute the process to see run history.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rows</TableHead>
            <TableHead>Parameters</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.runs.map((run) => (
            <>
              <TableRow key={run.id}>
                <TableCell className="text-sm">
                  {new Date(run.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[run.status]}>{run.status}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">
                  {run.row_count !== null ? run.row_count.toLocaleString() : '—'}
                </TableCell>
                <TableCell className="max-w-48 truncate text-xs text-muted-foreground">
                  {Object.keys(run.param_values).length > 0
                    ? JSON.stringify(run.param_values)
                    : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {run.result_run_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedRunId(expandedRunId === run.id ? null : run.id)
                        }
                      >
                        {expandedRunId === run.id ? (
                          <EyeOff className="mr-1 h-3 w-3" />
                        ) : (
                          <Eye className="mr-1 h-3 w-3" />
                        )}
                        Results
                      </Button>
                    )}
                    {run.result_gcp_path && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReload(run.id)}
                        disabled={reloadMutation.isPending}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Reload
                      </Button>
                    )}
                    {run.status === 'completed' && !run.result_gcp_path && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveToGcp(run.id)}
                        disabled={saveToGcpMutation.isPending}
                      >
                        <Upload className="mr-1 h-3 w-3" />
                        Save
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              {expandedRunId === run.id && run.result_run_id && (
                <TableRow key={`${run.id}-results`}>
                  <TableCell colSpan={5} className="p-4">
                    <DataTable runId={run.result_run_id} compact />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
