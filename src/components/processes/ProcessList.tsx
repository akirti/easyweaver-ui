import { useNavigate } from 'react-router-dom';
import { PlayCircle, Trash2, Plus, Clock } from 'lucide-react';
import { useBasePath } from '@/contexts/base-path';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcessConfigurations, useDeleteProcess } from '@/queries/use-processes';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/client';

export function ProcessList() {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const abs = (rel: string) => basePath ? `${basePath}/${rel}` : `/${rel}`;
  const { data: processes, isLoading } = useProcessConfigurations();
  const deleteMutation = useDeleteProcess();

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete process "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Process deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Saved Processes</h2>
        <Button onClick={() => navigate(abs('queries'))}>
          <Plus className="mr-1 h-4 w-4" />
          New Process
        </Button>
      </div>

      {processes?.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No saved processes yet. Build a query and save it as a process.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {processes?.map((process) => (
          <Card
            key={process.id}
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => navigate(abs(`processes/${process.id}`))}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{process.name}</CardTitle>
                </div>
                <Badge variant="secondary">v{process.version}</Badge>
              </div>
              {process.description && (
                <CardDescription className="line-clamp-2">
                  {process.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mb-3">
                {process.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(process.updated_at).toLocaleDateString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={(e) => handleDelete(e, process.id, process.name)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
