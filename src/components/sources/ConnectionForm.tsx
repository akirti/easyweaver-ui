import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSource } from '@/queries/use-sources';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  source_type: z.enum(['postgres', 'mongodb']),
  host: z.string().min(1, 'Host required'),
  port: z.number().int().positive(),
  database: z.string().min(1, 'Database required'),
  user: z.string(),
  password: z.string(),
  auth_database: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectionForm({ open, onOpenChange }: Props) {
  const createMutation = useCreateSource();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      source_type: 'postgres',
      port: 5432,
      auth_database: 'admin',
    },
  });

  const sourceType = watch('source_type');

  const onSubmit = async (data: FormData) => {
    try {
      const credentials =
        data.source_type === 'postgres'
          ? {
              type: 'postgres' as const,
              host: data.host,
              port: data.port,
              database: data.database,
              user: data.user,
              password: data.password,
            }
          : {
              type: 'mongodb' as const,
              host: data.host,
              port: data.port,
              database: data.database,
              user: data.user,
              password: data.password,
              auth_database: data.auth_database || 'admin',
            };

      await createMutation.mutateAsync({
        name: data.name,
        source_type: data.source_type,
        credentials,
      });
      toast.success('Connection created');
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Failed to create connection');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Connection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...register('name')} placeholder="My Database" />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Type</Label>
            <Select
              value={sourceType}
              onValueChange={(v) => {
                setValue('source_type', v as 'postgres' | 'mongodb');
                setValue('port', v === 'postgres' ? 5432 : 27017);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgres">PostgreSQL</SelectItem>
                <SelectItem value="mongodb">MongoDB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Host</Label>
              <Input {...register('host')} placeholder="localhost" />
            </div>
            <div>
              <Label>Port</Label>
              <Input {...register('port')} type="number" />
            </div>
          </div>

          <div>
            <Label>Database</Label>
            <Input {...register('database')} placeholder="mydb" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>User</Label>
              <Input {...register('user')} />
            </div>
            <div>
              <Label>Password</Label>
              <Input {...register('password')} type="password" />
            </div>
          </div>

          {sourceType === 'mongodb' && (
            <div>
              <Label>Auth Database</Label>
              <Input {...register('auth_database')} placeholder="admin" />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
