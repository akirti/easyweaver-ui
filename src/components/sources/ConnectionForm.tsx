import { useState, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSource, useUploadFileSource } from '@/queries/use-sources';
import { toast } from 'sonner';
import type {
  SourceType,
  SourceCredentials,
  RestAPIEndpoint,
  RestAPICredentials,
  SslMode,
} from '@/types';

const DEFAULT_PORTS: Record<string, string> = {
  postgres: '5432',
  mongodb: '27017',
  mysql: '3306',
  db2: '50000',
};

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'db2', label: 'DB2' },
  { value: 'file', label: 'File Upload' },
  { value: 'rest_api', label: 'REST API' },
];

const AUTH_TYPE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'api_key', label: 'API Key' },
  { value: 'oauth2_client_credentials', label: 'OAuth2 Client Credentials' },
  { value: 'login', label: 'Login URL' },
] as const;

type AuthType = RestAPICredentials['auth_type'];

const SSL_MODE_OPTIONS: { value: SslMode; label: string }[] = [
  { value: 'disable', label: 'Disable' },
  { value: 'prefer', label: 'Prefer' },
  { value: 'require', label: 'Require' },
  { value: 'verify-ca', label: 'Verify CA' },
  { value: 'verify-full', label: 'Verify Full' },
];

// Schema validates the base fields; type-specific validation is done in onSubmit
const schema = z.object({
  name: z.string().min(1, 'Name required'),
  source_type: z.string().min(1, 'Type required'),
  host: z.string().optional(),
  port: z.string().optional(),
  database: z.string().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  auth_database: z.string().optional(),
  ssl_mode: z.string().optional(),
  // REST API fields
  base_url: z.string().optional(),
  bearer_token: z.string().optional(),
  basic_user: z.string().optional(),
  basic_password: z.string().optional(),
  api_key_header: z.string().optional(),
  api_key_value: z.string().optional(),
  oauth2_token_url: z.string().optional(),
  oauth2_client_id: z.string().optional(),
  oauth2_client_secret: z.string().optional(),
  oauth2_scope: z.string().optional(),
  login_url: z.string().optional(),
  login_body: z.string().optional(),
  login_token_path: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EndpointEntry {
  name: string;
  path: string;
  method: string;
  data_path: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-destructive">{message}</p>;
}

const DB_TYPES: SourceType[] = ['postgres', 'mongodb', 'mysql', 'db2'];

export function ConnectionForm({ open, onOpenChange }: Props) {
  const createMutation = useCreateSource();
  const uploadMutation = useUploadFileSource();
  const [authType, setAuthType] = useState<AuthType>('none');
  const [endpoints, setEndpoints] = useState<EndpointEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sslClientCert, setSslClientCert] = useState('');
  const [sslClientKey, setSslClientKey] = useState('');
  const [sslCaCert, setSslCaCert] = useState('');

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
      ssl_mode: 'disable',
      base_url: '',
      bearer_token: '',
      basic_user: '',
      basic_password: '',
      api_key_header: '',
      api_key_value: '',
      oauth2_token_url: '',
      oauth2_client_id: '',
      oauth2_client_secret: '',
      oauth2_scope: '',
      login_url: '',
      login_body: '',
      login_token_path: '',
    },
  });

  const sourceType = watch('source_type') as SourceType;
  const isDbType = DB_TYPES.includes(sourceType);

  const resetForm = () => {
    reset();
    setAuthType('none');
    setEndpoints([]);
    setSelectedFile(null);
    setSslClientCert('');
    setSslClientKey('');
    setSslCaCert('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data URL prefix if present
        resolve(result.includes(',') ? result.split(',')[1] : btoa(result));
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const handleCertUpload = async (
    file: File | undefined,
    setter: (v: string) => void,
  ) => {
    if (!file) return;
    const text = await file.text();
    setter(btoa(text));
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const addEndpoint = () => {
    setEndpoints((prev) => [
      ...prev,
      { name: '', path: '', method: 'GET', data_path: '' },
    ]);
  };

  const updateEndpoint = (
    index: number,
    field: keyof EndpointEntry,
    value: string,
  ) => {
    setEndpoints((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, [field]: value } : ep)),
    );
  };

  const removeEndpoint = (index: number) => {
    setEndpoints((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    const st = data.source_type as SourceType;

    try {
      // File upload path
      if (st === 'file') {
        if (!selectedFile) {
          toast.error('Please select a file');
          return;
        }
        await uploadMutation.mutateAsync({ name: data.name, file: selectedFile });
        toast.success('File uploaded successfully');
        resetForm();
        onOpenChange(false);
        return;
      }

      // REST API path
      if (st === 'rest_api') {
        if (!data.base_url) {
          toast.error('Base URL is required');
          return;
        }
        const endpointsMap: Record<string, RestAPIEndpoint> = {};
        for (const ep of endpoints) {
          if (ep.name && ep.path) {
            endpointsMap[ep.name] = {
              path: ep.path,
              method: ep.method,
              data_path: ep.data_path,
            };
          }
        }

        let loginBody: Record<string, unknown> | undefined;
        if (authType === 'login' && data.login_body) {
          try {
            loginBody = JSON.parse(data.login_body);
          } catch {
            toast.error('Login body must be valid JSON');
            return;
          }
        }

        const credentials: RestAPICredentials = {
          type: 'rest_api',
          base_url: data.base_url,
          auth_type: authType,
          ...(authType === 'bearer' && { bearer_token: data.bearer_token }),
          ...(authType === 'basic' && {
            basic_user: data.basic_user,
            basic_password: data.basic_password,
          }),
          ...(authType === 'api_key' && {
            api_key_header: data.api_key_header,
            api_key_value: data.api_key_value,
          }),
          ...(authType === 'oauth2_client_credentials' && {
            oauth2_token_url: data.oauth2_token_url,
            oauth2_client_id: data.oauth2_client_id,
            oauth2_client_secret: data.oauth2_client_secret,
            oauth2_scope: data.oauth2_scope,
          }),
          ...(authType === 'login' && {
            login_url: data.login_url,
            login_body: loginBody,
            login_token_path: data.login_token_path,
          }),
          ...(Object.keys(endpointsMap).length > 0 && {
            endpoints: endpointsMap,
          }),
        };

        await createMutation.mutateAsync({
          name: data.name,
          source_type: 'rest_api',
          credentials,
        });
        toast.success('REST API source created');
        resetForm();
        onOpenChange(false);
        return;
      }

      // Database types (postgres, mongodb, mysql, db2)
      if (!data.host) {
        toast.error('Host is required');
        return;
      }
      if (!data.database) {
        toast.error('Database is required');
        return;
      }

      const port = data.port ? Number(data.port) : 0;

      let credentials: SourceCredentials;
      if (st === 'mongodb') {
        const mongoCreds: Record<string, unknown> = {
          type: 'mongodb' as const,
          host: data.host,
          database: data.database,
          user: data.user || '',
          password: data.password || '',
          auth_database: data.auth_database || 'admin',
        };
        // Only include port if provided (SRV/Atlas connections don't use port)
        if (data.port && port > 0) {
          mongoCreds.port = port;
        }
        credentials = mongoCreds as SourceCredentials;
      } else {
        if (!port) {
          toast.error('Port is required');
          return;
        }
        const dbCreds: Record<string, unknown> = {
          type: st,
          host: data.host,
          port,
          database: data.database,
          user: data.user || '',
          password: data.password || '',
        };

        // Add SSL fields for PostgreSQL
        if (st === 'postgres' && data.ssl_mode && data.ssl_mode !== 'disable') {
          dbCreds.ssl_mode = data.ssl_mode;
          if (sslCaCert) dbCreds.ssl_ca_cert = sslCaCert;
          if (sslClientCert) dbCreds.ssl_client_cert = sslClientCert;
          if (sslClientKey) dbCreds.ssl_client_key = sslClientKey;
        }

        credentials = dbCreds as SourceCredentials;
      }

      await createMutation.mutateAsync({
        name: data.name,
        source_type: st,
        credentials,
      });
      toast.success('Connection created');
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error('Failed to create connection');
    }
  };

  const isPending = createMutation.isPending || uploadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Connection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <Label>Name</Label>
            <Input {...register('name')} placeholder="My Data Source" />
            <FieldError message={errors.name?.message} />
          </div>

          {/* Source Type Selector */}
          <div>
            <Label>Type</Label>
            <Select
              value={sourceType}
              onValueChange={(v) => {
                const newType = v as SourceType;
                setValue('source_type', newType);
                if (DEFAULT_PORTS[newType]) {
                  setValue('port', DEFAULT_PORTS[newType]);
                }
                setAuthType('none');
                setEndpoints([]);
                setSelectedFile(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Database fields (postgres, mongodb, mysql, db2) */}
          {isDbType && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className={sourceType === 'mongodb' ? 'col-span-2' : 'col-span-2'}>
                  <Label>Host</Label>
                  <Input
                    {...register('host')}
                    placeholder={sourceType === 'mongodb' ? 'cluster0.abc123.mongodb.net' : 'localhost'}
                  />
                </div>
                <div>
                  <Label>Port {sourceType === 'mongodb' && <span className="text-xs text-muted-foreground">(optional)</span>}</Label>
                  <Input
                    {...register('port')}
                    type="number"
                    placeholder={DEFAULT_PORTS[sourceType] || ''}
                  />
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

              {/* SSL Configuration (PostgreSQL) */}
              {sourceType === 'postgres' && (
                <div className="space-y-3 rounded-md border p-3">
                  <div>
                    <Label>SSL Mode</Label>
                    <Select
                      value={watch('ssl_mode') || 'disable'}
                      onValueChange={(v) => setValue('ssl_mode', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SSL_MODE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {watch('ssl_mode') && watch('ssl_mode') !== 'disable' && (
                    <div className="space-y-3">
                      <div>
                        <Label>
                          CA Certificate <span className="text-xs text-muted-foreground">(PEM file)</span>
                        </Label>
                        <input
                          type="file"
                          accept=".pem,.crt,.cer"
                          onChange={(e) => handleCertUpload(e.target.files?.[0], setSslCaCert)}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
                        />
                        {sslCaCert && <p className="mt-1 text-xs text-muted-foreground">CA certificate loaded</p>}
                      </div>
                      <div>
                        <Label>
                          Client Certificate <span className="text-xs text-muted-foreground">(PEM file, optional)</span>
                        </Label>
                        <input
                          type="file"
                          accept=".pem,.crt,.cer"
                          onChange={(e) => handleCertUpload(e.target.files?.[0], setSslClientCert)}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
                        />
                        {sslClientCert && <p className="mt-1 text-xs text-muted-foreground">Client certificate loaded</p>}
                      </div>
                      <div>
                        <Label>
                          Client Key <span className="text-xs text-muted-foreground">(PEM file, optional)</span>
                        </Label>
                        <input
                          type="file"
                          accept=".pem,.key"
                          onChange={(e) => handleCertUpload(e.target.files?.[0], setSslClientKey)}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
                        />
                        {sslClientKey && <p className="mt-1 text-xs text-muted-foreground">Client key loaded</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* File Upload fields */}
          {sourceType === 'file' && (
            <div>
              <Label>File</Label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.xlsx,.xls"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              {selectedFile && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          )}

          {/* REST API fields */}
          {sourceType === 'rest_api' && (
            <>
              <div>
                <Label>Base URL</Label>
                <Input
                  {...register('base_url')}
                  placeholder="https://api.example.com"
                />
              </div>

              {/* Auth Type */}
              <div>
                <Label>Authentication</Label>
                <Select
                  value={authType}
                  onValueChange={(v) => setAuthType(v as AuthType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTH_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional auth fields */}
              {authType === 'bearer' && (
                <div>
                  <Label>Bearer Token</Label>
                  <Input
                    {...register('bearer_token')}
                    type="password"
                    placeholder="Token"
                  />
                </div>
              )}

              {authType === 'basic' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Username</Label>
                    <Input {...register('basic_user')} />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input {...register('basic_password')} type="password" />
                  </div>
                </div>
              )}

              {authType === 'api_key' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Header Name</Label>
                    <Input
                      {...register('api_key_header')}
                      placeholder="X-API-Key"
                    />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input {...register('api_key_value')} type="password" />
                  </div>
                </div>
              )}

              {authType === 'oauth2_client_credentials' && (
                <div className="space-y-3">
                  <div>
                    <Label>Token URL</Label>
                    <Input
                      {...register('oauth2_token_url')}
                      placeholder="https://auth.example.com/token"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Client ID</Label>
                      <Input {...register('oauth2_client_id')} />
                    </div>
                    <div>
                      <Label>Client Secret</Label>
                      <Input
                        {...register('oauth2_client_secret')}
                        type="password"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Scope</Label>
                    <Input
                      {...register('oauth2_scope')}
                      placeholder="read write (optional)"
                    />
                  </div>
                </div>
              )}

              {authType === 'login' && (
                <div className="space-y-3">
                  <div>
                    <Label>Login URL</Label>
                    <Input
                      {...register('login_url')}
                      placeholder="https://api.example.com/auth/login"
                    />
                  </div>
                  <div>
                    <Label>Login Body (JSON)</Label>
                    <Textarea
                      {...register('login_body')}
                      placeholder={'{"username": "user", "password": "pass"}'}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Token Path</Label>
                    <Input
                      {...register('login_token_path')}
                      placeholder="data.access_token"
                    />
                  </div>
                </div>
              )}

              {/* Endpoints */}
              <div>
                <div className="flex items-center justify-between">
                  <Label>Endpoints</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEndpoint}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
                {endpoints.length === 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No endpoints configured yet.
                  </p>
                )}
                <div className="mt-2 space-y-3">
                  {endpoints.map((ep, i) => (
                    <div
                      key={i}
                      className="rounded-md border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Endpoint {i + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEndpoint(i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={ep.name}
                            onChange={(e) =>
                              updateEndpoint(i, 'name', e.target.value)
                            }
                            placeholder="users"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Method</Label>
                          <Select
                            value={ep.method}
                            onValueChange={(v) =>
                              updateEndpoint(i, 'method', v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Path</Label>
                        <Input
                          value={ep.path}
                          onChange={(e) =>
                            updateEndpoint(i, 'path', e.target.value)
                          }
                          placeholder="/v1/users"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Data Path</Label>
                        <Input
                          value={ep.data_path}
                          onChange={(e) =>
                            updateEndpoint(i, 'data_path', e.target.value)
                          }
                          placeholder="data.results"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? sourceType === 'file'
                  ? 'Uploading...'
                  : 'Creating...'
                : sourceType === 'file'
                  ? 'Upload'
                  : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
