import { useState } from 'react';
import { Database, Trash2, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSources, useDeleteSource, useTestConnection } from '@/queries/use-sources';
import { ConnectionForm } from './ConnectionForm';
import { toast } from 'sonner';
import type { Source } from '@/types';

export function ConnectionList() {
  const { data: sources, isLoading } = useSources();
  const deleteMutation = useDeleteSource();
  const testMutation = useTestConnection();
  const [showForm, setShowForm] = useState(false);

  const handleTest = async (source: Source) => {
    try {
      const result = await testMutation.mutateAsync(source.id);
      if (result.success) {
        toast.success(`Connected in ${result.latency_ms}ms`);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Test failed');
    }
  };

  const handleDelete = async (source: Source) => {
    if (!confirm(`Delete connection "${source.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(source.id);
      toast.success('Connection deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading connections...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Data Sources</h2>
        <Button onClick={() => setShowForm(true)}>Add Connection</Button>
      </div>

      {sources?.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No connections yet. Add one to get started.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources?.map((source) => (
          <Card key={source.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{source.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {source.source_type}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleTest(source)}>
                <Plug className="mr-1 h-3 w-3" />
                Test
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => handleDelete(source)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ConnectionForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
}
