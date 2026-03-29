import { createContext, useContext } from 'react';

const BasePathContext = createContext('');

export function BasePathProvider({ basePath, children }: { basePath: string; children: React.ReactNode }) {
  return <BasePathContext.Provider value={basePath}>{children}</BasePathContext.Provider>;
}

/** Returns the base path prefix (e.g. "/aggregator" or "" for standalone) */
export function useBasePath(): string {
  return useContext(BasePathContext);
}
