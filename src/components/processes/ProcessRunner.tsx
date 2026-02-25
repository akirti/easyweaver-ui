import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useProcessConfiguration,
  useRunProcess,
  useProcessRun,
  useProcessRunResults,
  useSaveResultsToGcp,
} from '@/queries/use-processes';
import { ParamForm } from './ParamForm';
import { RunHistory } from './RunHistory';
import { DataTable } from '@/components/results/DataTable';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/client';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export function ProcessRunner() {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();
  const { data: config, isLoading } = useProcessConfiguration(configId!);
  const runMutation = useRunProcess(configId!);
  const saveToGcpMutation = useSaveResultsToGcp();

  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  // Initialize param values from defaults when config loads
  useEffect(() => {
    if (config?.params) {
      const defaults: Record<string, unknown> = {};
      for (const [key, param] of Object.entries(config.params)) {
        if (param.default !== undefined && param.default !== null) {
          defaults[key] = param.default;
        }
      }
      setParamValues((prev) => {
        // Only set defaults for keys not already set by user
        const merged = { ...defaults };
        for (const [k, v] of Object.entries(prev)) {
          if (v !== undefined && v !== '') merged[k] = v;
        }
        return merged;
      });
    }
  }, [config?.params]);

  const { data: activeRun } = useProcessRun(activeRunId);

  const handleExecute = async () => {
    try {
      const run = await runMutation.mutateAsync({
        param_values: paramValues,
        save_results_to_gcp: false,
      });
      setActiveRunId(run.id);
      toast.success('Process execution started');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveToGcp = async () => {
    if (!activeRun) return;
    try {
      const result = await saveToGcpMutation.mutateAsync(activeRun.id);
      toast.success(`Saved to GCP: ${result.gcp_path}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!config) {
    return <div className="text-muted-foreground">Process not found.</div>;
  }

  const hasParams = Object.keys(config.params).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/processes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{config.name}</h2>
          {config.description && (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          )}
        </div>
        <Badge variant="secondary" className="ml-auto">
          v{config.version}
        </Badge>
      </div>

      <Tabs defaultValue="run">
        <TabsList>
          <TabsTrigger value="run">Run</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="space-y-4">
          {hasParams && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <ParamForm
                  params={config.params}
                  values={paramValues}
                  onChange={setParamValues}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleExecute} disabled={runMutation.isPending}>
              {runMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-1 h-4 w-4" />
              )}
              Execute
            </Button>

            {activeRun && (
              <>
                <Badge className={statusColors[activeRun.status]}>
                  {activeRun.status}
                </Badge>
                {activeRun.status === 'completed' && activeRun.row_count !== null && (
                  <span className="text-sm text-muted-foreground">
                    {activeRun.row_count.toLocaleString()} rows
                  </span>
                )}
                {activeRun.status === 'completed' && !activeRun.result_gcp_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveToGcp}
                    disabled={saveToGcpMutation.isPending}
                  >
                    <Upload className="mr-1 h-3 w-3" />
                    Save to GCP
                  </Button>
                )}
              </>
            )}
          </div>

          {activeRun?.status === 'failed' && activeRun.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {activeRun.error}
            </div>
          )}

          {activeRun?.status === 'running' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </div>
          )}

          {activeRun?.status === 'completed' && (
            <DataTable
              runId={activeRun.id}
              useResults={useProcessRunResults}
              hideExport
            />
          )}
        </TabsContent>

        <TabsContent value="history">
          <RunHistory configId={configId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
