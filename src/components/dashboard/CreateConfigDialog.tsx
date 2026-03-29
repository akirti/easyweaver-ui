import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useSources, useSourceSchema } from '@/queries/use-sources';
import { useCreateDashboardConfig } from '@/queries/use-dashboard';
import { getTypeCategory } from '@/lib/column-types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/client';
import type { TableMonitorConfig, DashboardConfigCreate } from '@/types';

interface CreateConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TableConfig {
  table_name: string;
  selected: boolean;
  timestamp_column?: string;
  modified_by_column?: string;
}

const REFRESH_OPTIONS = [
  { value: '15', label: 'Every 15 minutes' },
  { value: '30', label: 'Every 30 minutes' },
  { value: '60', label: 'Every 1 hour' },
  { value: '180', label: 'Every 3 hours' },
  { value: '360', label: 'Every 6 hours' },
  { value: '0', label: 'Manual only' },
];

export function CreateConfigDialog({ open, onOpenChange }: CreateConfigDialogProps) {
  const { data: sources } = useSources();
  const createMutation = useCreateDashboardConfig();

  const [name, setName] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [tableConfigs, setTableConfigs] = useState<TableConfig[]>([]);
  const [refreshInterval, setRefreshInterval] = useState('60');

  const { data: schema, isLoading: schemaLoading } = useSourceSchema(sourceId);

  // Build table configs when schema loads
  const currentTableConfigs = useMemo(() => {
    if (!schema) return tableConfigs;
    const existing = new Map(tableConfigs.map((tc) => [tc.table_name, tc]));
    return schema.map((table) => {
      const prev = existing.get(table.name);
      return prev || {
        table_name: table.name,
        selected: false,
        timestamp_column: undefined,
        modified_by_column: undefined,
      };
    });
  }, [schema, tableConfigs]);

  const handleSourceChange = (newSourceId: string) => {
    setSourceId(newSourceId);
    setTableConfigs([]);
  };

  const toggleTable = (tableName: string) => {
    const updated = currentTableConfigs.map((tc) =>
      tc.table_name === tableName ? { ...tc, selected: !tc.selected } : tc
    );
    setTableConfigs(updated);
  };

  const updateTableConfig = (tableName: string, field: 'timestamp_column' | 'modified_by_column', value: string) => {
    const updated = currentTableConfigs.map((tc) =>
      tc.table_name === tableName ? { ...tc, [field]: value || undefined } : tc
    );
    setTableConfigs(updated);
  };

  const getColumnsForTable = (tableName: string, category: 'datetime' | 'text') => {
    if (!schema) return [];
    const table = schema.find((t) => t.name === tableName);
    if (!table) return [];
    return table.columns.filter((col) => getTypeCategory(col.type) === category);
  };

  const selectedTables = currentTableConfigs.filter((tc) => tc.selected);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!sourceId) {
      toast.error('Please select a data source');
      return;
    }
    if (selectedTables.length === 0) {
      toast.error('Please select at least one table');
      return;
    }

    const tables: TableMonitorConfig[] = selectedTables.map((tc) => ({
      table_name: tc.table_name,
      timestamp_column: tc.timestamp_column,
      modified_by_column: tc.modified_by_column,
    }));

    const data: DashboardConfigCreate = {
      name: name.trim(),
      source_id: sourceId,
      tables,
      refresh_interval_minutes: parseInt(refreshInterval) || undefined,
    };

    try {
      await createMutation.mutateAsync(data);
      toast.success('Dashboard config created');
      handleClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleClose = () => {
    setName('');
    setSourceId('');
    setTableConfigs([]);
    setRefreshInterval('60');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Dashboard Config</DialogTitle>
          <DialogDescription>Select a data source and tables to monitor.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="config-name">Name *</Label>
            <Input
              id="config-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production DB Monitor"
            />
          </div>

          {/* Source selector */}
          <div className="space-y-1.5">
            <Label>Data Source *</Label>
            <Select value={sourceId} onValueChange={handleSourceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a source..." />
              </SelectTrigger>
              <SelectContent>
                {sources?.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name} ({source.source_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table selection */}
          {sourceId && (
            <div className="space-y-1.5">
              <Label>Tables *</Label>
              {schemaLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
                  {currentTableConfigs.map((tc) => (
                    <div key={tc.table_name} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`table-${tc.table_name}`}
                          checked={tc.selected}
                          onCheckedChange={() => toggleTable(tc.table_name)}
                        />
                        <label
                          htmlFor={`table-${tc.table_name}`}
                          className="cursor-pointer text-sm font-medium"
                        >
                          {tc.table_name}
                        </label>
                      </div>

                      {/* Column config for selected tables */}
                      {tc.selected && (
                        <div className="ml-6 grid grid-cols-2 gap-2 pb-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Timestamp column</Label>
                            <Select
                              value={tc.timestamp_column || ''}
                              onValueChange={(v) => updateTableConfig(tc.table_name, 'timestamp_column', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {getColumnsForTable(tc.table_name, 'datetime').map((col) => (
                                  <SelectItem key={col.name} value={col.name}>
                                    {col.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Modified-by column</Label>
                            <Select
                              value={tc.modified_by_column || ''}
                              onValueChange={(v) => updateTableConfig(tc.table_name, 'modified_by_column', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {getColumnsForTable(tc.table_name, 'text').map((col) => (
                                  <SelectItem key={col.name} value={col.name}>
                                    {col.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Refresh interval */}
          <div className="space-y-1.5">
            <Label>Refresh Interval</Label>
            <Select value={refreshInterval} onValueChange={setRefreshInterval}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
