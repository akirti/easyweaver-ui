import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function SettingsPage() {
  const { user } = useAuthStore();

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
        <h3 className="text-lg font-semibold">Application</h3>
        <p className="text-sm text-muted-foreground">General application settings</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Version</Label>
            <p className="text-sm font-medium">0.1.0 (MVP)</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Theme</Label>
            <p className="text-sm font-medium">Dark</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
