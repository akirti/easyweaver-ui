import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/themes';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold">Account</h3>
        <p className="text-sm text-muted-foreground">Your profile information</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Display Name</Label>
            <p className="text-sm font-medium">{user?.display_name ?? '—'}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="text-sm font-medium">{user?.email ?? '—'}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Role</Label>
            <p className="text-sm font-medium capitalize">{user?.role ?? '—'}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <p className="text-sm font-medium">
              {user?.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold">Appearance</h3>
        <p className="text-sm text-muted-foreground">Customize the look and feel</p>
      </div>

      <Card className="p-6">
        <Label className="text-xs text-muted-foreground mb-3 block">Theme</Label>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                theme === t.id && 'border-primary ring-2 ring-primary/20'
              )}
            >
              <span
                className="h-8 w-8 rounded-full border shrink-0"
                style={{ backgroundColor: t.colors.primary }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.label}</p>
                <p className="text-xs text-muted-foreground truncate">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold">Application</h3>
        <p className="text-sm text-muted-foreground">General application settings</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Version</Label>
            <p className="text-sm font-medium">0.1.0 (MVP)</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
