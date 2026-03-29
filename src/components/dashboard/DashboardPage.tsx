import { useState } from 'react';
import { Plus, BarChart3, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardConfigs, useDeleteDashboardConfig } from '@/queries/use-dashboard';
import { CreateConfigDialog } from './CreateConfigDialog';
import { StatsPanel } from './StatsPanel';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/client';
import type { DashboardConfig } from '@/types';

export function DashboardPage() {
  const { data: configs, isLoading } = useDashboardConfigs();
  const deleteMutation = useDeleteDashboardConfig();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedConfig = configs?.find((c) => c.id === selectedId) ?? null;

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete dashboard config "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      if (selectedId === id) setSelectedId(null);
      toast.success('Config deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard Configs</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Config
        </Button>
      </div>

      {/* Empty state */}
      {configs?.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <p className="mb-2 font-medium">No dashboard configs yet</p>
          <p className="text-sm">Create a config to start monitoring your data sources.</p>
          <Button className="mt-4" variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Your First Config
          </Button>
        </div>
      )}

      {/* Config cards */}
      {configs && configs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <ConfigCard
              key={config.id}
              config={config}
              isSelected={selectedId === config.id}
              onSelect={() => setSelectedId(config.id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Stats panel for selected config */}
      {selectedConfig && (
        <div className="border-t pt-6">
          <StatsPanel config={selectedConfig} />
        </div>
      )}

      <CreateConfigDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function ConfigCard({
  config,
  isSelected,
  onSelect,
  onDelete,
}: {
  config: DashboardConfig;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2 bg-muted/50 rounded-t-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{config.name}</CardTitle>
          </div>
          <Badge variant={config.is_active ? 'default' : 'secondary'}>
            {config.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div>{config.tables.length} table{config.tables.length !== 1 ? 's' : ''} monitored</div>
          <div>
            Refresh: {config.refresh_interval_minutes > 0
              ? `${config.refresh_interval_minutes}min`
              : 'Manual'}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(config.updated_at).toLocaleDateString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={(e) => onDelete(e, config.id, config.name)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
