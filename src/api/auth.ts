import client from './client';
import type { TokenResponse, User } from '@/types';

export const authApi = {
  register: (email: string, password: string, display_name: string) =>
    client
      .post<User>('/auth/register', { email, password, display_name })
      .then((r) => r.data),

  login: (email: string, password: string) =>
    client
      .post<TokenResponse>('/auth/login', { email, password })
      .then((r) => r.data),

  refresh: (refresh_token: string) =>
    client
      .post<TokenResponse>('/auth/refresh', { refresh_token })
      .then((r) => r.data),

  me: () => client.get<User>('/auth/me').then((r) => r.data),
};
