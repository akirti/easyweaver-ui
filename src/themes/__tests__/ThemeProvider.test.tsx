import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/themes/ThemeProvider';

// Mock MutationObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();

  vi.stubGlobal(
    'MutationObserver',
    vi.fn(() => ({
      observe: mockObserve,
      disconnect: mockDisconnect,
      takeRecords: vi.fn(),
    })),
  );
});

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeProvider', () => {
  it('provides default theme (original)', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('original');
  });

  it('setTheme changes theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
  });

  it('setTheme ignores invalid theme IDs', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('nonexistent');
    });

    expect(result.current.theme).toBe('original');
  });

  it('sets data-theme attribute on document', () => {
    renderHook(() => useTheme(), { wrapper });
    expect(document.documentElement.getAttribute('data-theme')).toBe('original');
  });

  it('stores theme in localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('ocean');
    });

    expect(localStorage.getItem('easyweaver-theme')).toBe('ocean');
  });

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('easyweaver-theme', 'forest');

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('forest');
  });

  it('useTheme throws outside provider', () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
  });

  it('can set theme to "soft"', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('soft');
    });

    expect(result.current.theme).toBe('soft');
    expect(document.documentElement.getAttribute('data-theme')).toBe('soft');
  });

  it('currentTheme returns correct ThemeDefinition', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.currentTheme.id).toBe('original');
    expect(result.current.currentTheme.label).toBe('Original');

    act(() => {
      result.current.setTheme('soft');
    });

    expect(result.current.currentTheme.id).toBe('soft');
    expect(result.current.currentTheme.label).toBe('Soft');
    expect(result.current.currentTheme.description).toBe('Neumorphic depth');
  });
});
