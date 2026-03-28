import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEMES, DEFAULT_THEME, STORAGE_KEY, type ThemeDefinition } from './themes';

interface ThemeContextValue {
  theme: string;
  setTheme: (themeId: string) => void;
  currentTheme: ThemeDefinition;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * When true, the provider does NOT set data-theme on <html>.
   * It reads the current data-theme from the DOM instead.
   * Use this when embedded inside a parent app that controls theming.
   */
  embedded?: boolean;
}

function getInitialTheme(embedded: boolean): string {
  if (embedded) {
    const domTheme = document.documentElement.getAttribute('data-theme');
    if (domTheme && THEMES.some((t) => t.id === domTheme)) {
      return domTheme;
    }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children, embedded = false }: ThemeProviderProps) {
  const [theme, setThemeState] = useState(() => getInitialTheme(embedded));

  // In embedded mode, watch for parent theme changes via MutationObserver
  useEffect(() => {
    if (!embedded) return;

    const observer = new MutationObserver(() => {
      const domTheme = document.documentElement.getAttribute('data-theme');
      if (domTheme && THEMES.some((t) => t.id === domTheme)) {
        setThemeState(domTheme);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, [embedded]);

  // In standalone mode, apply theme to DOM + localStorage
  useEffect(() => {
    if (embedded) return;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage not available
    }
  }, [theme, embedded]);

  const setTheme = useCallback((themeId: string) => {
    if (THEMES.some((t) => t.id === themeId)) {
      setThemeState(themeId);
    }
  }, []);

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
