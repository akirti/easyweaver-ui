import { describe, it, expect } from 'vitest';
import { THEMES, DEFAULT_THEME, STORAGE_KEY } from '@/themes/themes';

describe('Theme definitions', () => {
  it('contains 7 themes', () => {
    expect(THEMES).toHaveLength(7);
    const ids = THEMES.map((t) => t.id);
    expect(ids).toEqual([
      'original',
      'dark',
      'ocean',
      'forest',
      'sunset',
      'lavender',
      'soft',
    ]);
  });

  it('all themes have required fields', () => {
    for (const theme of THEMES) {
      expect(theme).toHaveProperty('id');
      expect(theme).toHaveProperty('label');
      expect(theme).toHaveProperty('description');
      expect(theme).toHaveProperty('colors');
      expect(typeof theme.id).toBe('string');
      expect(typeof theme.label).toBe('string');
      expect(typeof theme.description).toBe('string');
    }
  });

  it('all theme IDs are unique', () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all theme colors have primary, bg, and accent fields', () => {
    for (const theme of THEMES) {
      expect(theme.colors).toHaveProperty('primary');
      expect(theme.colors).toHaveProperty('bg');
      expect(theme.colors).toHaveProperty('accent');
      expect(typeof theme.colors.primary).toBe('string');
      expect(typeof theme.colors.bg).toBe('string');
      expect(typeof theme.colors.accent).toBe('string');
    }
  });

  it('DEFAULT_THEME is "original"', () => {
    expect(DEFAULT_THEME).toBe('original');
  });

  it('STORAGE_KEY is "easyweaver-theme"', () => {
    expect(STORAGE_KEY).toBe('easyweaver-theme');
  });

  it('soft theme has correct colors', () => {
    const soft = THEMES.find((t) => t.id === 'soft');
    expect(soft).toBeDefined();
    expect(soft!.colors.primary).toBe('#4F46E5');
    expect(soft!.colors.bg).toBe('#E8EDF2');
    expect(soft!.colors.accent).toBe('#F0F4F8');
  });
});
