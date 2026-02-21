import { useForm, type Resolver } from 'react-hook-form';
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
  source_type: z.string().min(1, 'Type required'),
  host: z.string().min(1, 'Host required'),
  port: z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, 'Valid port required'),
  database: z.string().min(1, 'Database required'),
  user: z.string().default(''),
  password: z.string().default(''),
  auth_database: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-destructive">{message}</p>;
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
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      name: '',
      source_type: 'postgres',
      host: '',
      port: '5432',
      database: '',
      user: '',
      password: '',
      auth_database: 'admin',
    },
  });

  const sourceType = watch('source_type');

  const onSubmit = async (data: FormData) => {
    const st = data.source_type as 'postgres' | 'mongodb';
    const port = Number(data.port);
    try {
      const credentials =
        st === 'postgres'
          ? {
              type: 'postgres' as const,
              host: data.host,
              port,
              database: data.database,
              user: data.user,
              password: data.password,
            }
          : {
              type: 'mongodb' as const,
              host: data.host,
              port,
              database: data.database,
              user: data.user,
              password: data.password,
              auth_database: data.auth_database || 'admin',
            };

      await createMutation.mutateAsync({
        name: data.name,
        source_type: st,
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
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <Label>Type</Label>
            <Select
              value={sourceType}
              onValueChange={(v) => {
                setValue('source_type', v);
                setValue('port', v === 'postgres' ? '5432' : '27017');
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
            <FieldError message={errors.source_type?.message} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Host</Label>
              <Input {...register('host')} placeholder="localhost" />
              <FieldError message={errors.host?.message} />
            </div>
            <div>
              <Label>Port</Label>
              <Input {...register('port')} type="number" />
              <FieldError message={errors.port?.message} />
            </div>
          </div>

          <div>
            <Label>Database</Label>
            <Input {...register('database')} placeholder="mydb" />
            <FieldError message={errors.database?.message} />
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
