import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Loader2, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useProcessConfiguration,
  useRunProcess,
  useProcessRun,
  useProcessRunResults,
  useSaveResultsToGcp,
  useRefreshCredentials,
  useAppSettings,
} from '@/queries/use-processes';
import { ParamForm } from './ParamForm';
import { RunHistory } from './RunHistory';
import { ProgressPanel } from './ProgressPanel';
import { DataTable } from '@/components/results/DataTable';
import { useProcessWebSocket } from '@/hooks/use-process-ws';
import { useProgressState } from '@/hooks/use-progress-state';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/client';
import { useBasePath } from '@/contexts/base-path';

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
  const basePath = useBasePath();
  const abs = (rel: string) => basePath ? `${basePath}/${rel}` : `/${rel}`;
  const { data: config, isLoading } = useProcessConfiguration(configId!);
  const runMutation = useRunProcess(configId!);
  const saveToGcpMutation = useSaveResultsToGcp();
  const refreshCredentialsMutation = useRefreshCredentials();

  const { data: appSettings } = useAppSettings();
  const systemMaxRows = appSettings?.max_result_rows ?? 100_000;

  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});
  const [maxRows, setMaxRows] = useState<number>(1000);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  // WebSocket + progress state
  const { sendCommand, lastMessage, isConnected, connect, disconnect } =
    useProcessWebSocket(configId!);
  const { state: progressState, dispatch } = useProgressState();
  const wsExecuting = useRef(false);

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

  // Dispatch incoming WS messages to progress reducer
  useEffect(() => {
    if (lastMessage) {
      dispatch(lastMessage);
    }
  }, [lastMessage, dispatch]);

  // When progress state becomes completed, set activeRunId for DataTable
  useEffect(() => {
    if (progressState.completed && progressState.runId) {
      setActiveRunId(progressState.runId);
      wsExecuting.current = false;
      disconnect();
      toast.success(
        `Process completed: ${progressState.totalRows?.toLocaleString() ?? 0} rows`
      );
    }
  }, [progressState.completed, progressState.runId, progressState.totalRows, disconnect]);

  // Handle cancelled state
  useEffect(() => {
    if (progressState.cancelled) {
      wsExecuting.current = false;
      disconnect();
      toast.info('Process cancelled');
    }
  }, [progressState.cancelled, disconnect]);

  // Handle error with no recovery
  useEffect(() => {
    if (progressState.error && !progressState.completed) {
      // Keep showing the progress panel with error — don't auto-disconnect
    }
  }, [progressState.error, progressState.completed]);

  const { data: activeRun } = useProcessRun(activeRunId);

  const sourceSummary = useMemo(() => {
    if (!config?.config?.queries) return [];
    const sources: { name: string; type: string }[] = [];
    const seen = new Set<string>();
    for (const group of Object.values(config.config.queries)) {
      for (const q of Object.values(group)) {
        if (q.source_name && !seen.has(q.source_id)) {
          seen.add(q.source_id);
          sources.push({ name: q.source_name, type: q.source_type || 'unknown' });
        }
      }
    }
    return sources;
  }, [config]);

  const handleRefreshCredentials = async () => {
    try {
      await refreshCredentialsMutation.mutateAsync(configId!);
      toast.success('Credentials refreshed successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const maxRowsValid = maxRows > 0 && maxRows <= systemMaxRows;

  const wantToStart = useRef(false);
  const sentStartRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleExecute = async () => {
    if (!maxRowsValid) {
      toast.error(`Max rows must be between 1 and ${systemMaxRows.toLocaleString()}`);
      return;
    }

    // Try WebSocket first
    dispatch({ type: 'reset' });
    wsExecuting.current = true;
    wantToStart.current = true;
    sentStartRef.current = false;

    connect();

    // Set a 3s timeout: if not connected by then, fall back to REST
    fallbackTimerRef.current = setTimeout(async () => {
      if (!sentStartRef.current) {
        wantToStart.current = false;
        wsExecuting.current = false;
        disconnect();
        try {
          const run = await runMutation.mutateAsync({
            param_values: paramValues,
            max_rows: maxRows,
            save_results_to_gcp: false,
          });
          setActiveRunId(run.id);
          toast.success('Process execution started');
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      }
    }, 3000);
  };

  // Send start command once connected (for WS execution)
  useEffect(() => {
    if (isConnected && wantToStart.current && !sentStartRef.current) {
      sentStartRef.current = true;
      wantToStart.current = false;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      sendCommand({
        type: 'start',
        param_values: paramValues,
        max_rows: maxRows,
        target_batch_seconds: progressState.targetSeconds,
      });
    }
    if (!isConnected) {
      sentStartRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const handleSaveToGcp = async () => {
    if (!activeRun) return;
    try {
      const result = await saveToGcpMutation.mutateAsync(activeRun.id);
      toast.success(`Saved to GCP: ${result.gcp_path}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // WS control handlers
  const handlePause = () => sendCommand({ type: 'pause' });
  const handleResume = () => sendCommand({ type: 'resume' });
  const handleSetBatchSize = (size: number) =>
    sendCommand({ type: 'set_batch_size', batch_size: size });
  const handleSetTargetSeconds = (seconds: number) =>
    sendCommand({ type: 'set_target_seconds', target_seconds: seconds });
  const handleCancel = () => sendCommand({ type: 'cancel' });

  // Determine if WS execution is in progress
  const wsRunning =
    wsExecuting.current &&
    !progressState.completed &&
    !progressState.cancelled &&
    (isConnected || progressState.runId !== null);

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
        <Button variant="ghost" size="sm" onClick={() => navigate(abs('processes'))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{config.name}</h2>
          {config.description && (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          )}
          {sourceSummary.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5">
              {sourceSummary.map((s) => (
                <Badge key={s.name} variant="outline" className="text-xs">
                  {s.name} ({s.type})
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary">v{config.version}</Badge>
          {config.config.config_version === 2 ? (
            <Badge className="bg-green-100 text-green-800">Self-sufficient</Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800">Legacy</Badge>
          )}
          {config.config.config_version === 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshCredentials}
              disabled={refreshCredentialsMutation.isPending}
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${refreshCredentialsMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh Credentials
            </Button>
          )}
        </div>
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
                  processId={configId}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="max-rows" className="text-sm whitespace-nowrap">
                Max Rows
              </Label>
              <Input
                id="max-rows"
                type="number"
                min={1}
                max={systemMaxRows}
                value={maxRows}
                onChange={(e) => setMaxRows(Number(e.target.value) || 0)}
                className={`w-32 ${!maxRowsValid ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                (max {systemMaxRows.toLocaleString()})
              </span>
            </div>
            <Button
              onClick={handleExecute}
              disabled={runMutation.isPending || wsRunning || !maxRowsValid}
            >
              {runMutation.isPending || wsRunning ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-1 h-4 w-4" />
              )}
              Execute
            </Button>

            {!wsRunning && activeRun && (
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

          {/* WS-driven progress panel */}
          {wsRunning && (
            <ProgressPanel
              state={progressState}
              onPause={handlePause}
              onResume={handleResume}
              onSetBatchSize={handleSetBatchSize}
              onSetTargetSeconds={handleSetTargetSeconds}
              onCancel={handleCancel}
              runId={progressState.runId}
            />
          )}

          {/* REST fallback: error display */}
          {!wsRunning && activeRun?.status === 'failed' && activeRun.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {activeRun.error}
            </div>
          )}

          {/* REST fallback: running spinner */}
          {!wsRunning && activeRun?.status === 'running' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </div>
          )}

          {/* Results table — shown when completed (both WS and REST paths) */}
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
