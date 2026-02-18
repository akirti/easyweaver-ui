import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'At least 6 characters'),
  display_name: z.string().min(1, 'Name required'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const { login, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      const tokens = await authApi.login(data.email, data.password);
      login(tokens.access_token, tokens.refresh_token);
      const user = await authApi.me();
      setUser(user);
      navigate('/queries');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setLoading(true);
    try {
      await authApi.register(data.email, data.password, data.display_name);
      toast.success('Account created. Please login.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6">
        <h1 className="mb-6 text-center text-2xl font-bold">EasyWeaver</h1>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input {...loginForm.register('email')} type="email" />
              </div>
              <div>
                <Label>Password</Label>
                <Input {...loginForm.register('password')} type="password" />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input {...registerForm.register('display_name')} />
              </div>
              <div>
                <Label>Email</Label>
                <Input {...registerForm.register('email')} type="email" />
              </div>
              <div>
                <Label>Password</Label>
                <Input {...registerForm.register('password')} type="password" />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
