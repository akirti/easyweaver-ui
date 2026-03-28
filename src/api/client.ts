import axios, { type AxiosInstance } from 'axios';
import type { ApiError } from '@/types';

/** Configuration for creating an API client */
export interface ApiClientConfig {
  baseURL: string;
  getToken: () => string | null;
  onAuthFailure?: () => void;
}

/**
 * Default standalone config — reads tokens from localStorage,
 * refreshes on 401, redirects to /login on failure.
 */
const standaloneConfig: ApiClientConfig = {
  baseURL: '/api/v1',
  getToken: () => localStorage.getItem('access_token'),
  onAuthFailure: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  },
};

/** The active client instance — reconfigured by `configureClient()` */
let activeClient: AxiosInstance = createClient(standaloneConfig);

function createClient(config: ApiClientConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((reqConfig) => {
    const token = config.getToken();
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Only attempt refresh in standalone mode (localStorage tokens)
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${config.baseURL}/auth/refresh`, {
              refresh_token: refreshToken,
            });
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return instance(originalRequest);
          } catch {
            config.onAuthFailure?.();
          }
        } else {
          // Embedded mode — no refresh token in localStorage, just fail
          config.onAuthFailure?.();
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Reconfigure the shared API client. Call this from EasyWeaverApp
 * when running in embedded mode to point at a different API and
 * use the parent's auth token.
 */
export function configureClient(config: ApiClientConfig): void {
  activeClient = createClient(config);
}

/** Reset to standalone defaults */
export function resetClient(): void {
  activeClient = createClient(standaloneConfig);
}

/** Proxy that always delegates to the active client instance */
const client = new Proxy({} as AxiosInstance, {
  get(_target, prop: string) {
    return (activeClient as Record<string, unknown>)[prop];
  },
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as ApiError;
    return data.error?.message || error.message;
  }
  return error instanceof Error ? error.message : 'Unknown error';
}

export default client;
