export interface ThemeDefinition {
  id: string;
  label: string;
  description: string;
  colors: { primary: string; bg: string; accent: string };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'original',
    label: 'Original',
    description: 'Classic red theme',
    colors: { primary: '#dc2626', bg: '#ffffff', accent: '#fef2f2' },
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes',
    colors: { primary: '#818cf8', bg: '#0f0f1a', accent: '#1e1e2e' },
  },
  {
    id: 'ocean',
    label: 'Ocean Breeze',
    description: 'Cool teal tones',
    colors: { primary: '#0891b2', bg: '#f0f9ff', accent: '#ecfeff' },
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Natural green earth',
    colors: { primary: '#059669', bg: '#faf5f0', accent: '#ecfdf5' },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm orange glow',
    colors: { primary: '#ea580c', bg: '#fef3e2', accent: '#fff7ed' },
  },
  {
    id: 'lavender',
    label: 'Lavender',
    description: 'Soft purple elegance',
    colors: { primary: '#7c3aed', bg: '#faf5ff', accent: '#f5f3ff' },
  },
];

export const DEFAULT_THEME = 'original';
export const STORAGE_KEY = 'easyweaver-theme';
