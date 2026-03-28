import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply theme before React mounts to prevent FOUC.
// Guard: don't overwrite if data-theme is already set (embedded mode — parent controls it).
try {
  const existing = document.documentElement.getAttribute('data-theme');
  if (!existing) {
    const stored = localStorage.getItem('easyweaver-theme');
    document.documentElement.setAttribute('data-theme', stored || 'original');
  }
} catch {
  if (!document.documentElement.getAttribute('data-theme')) {
    document.documentElement.setAttribute('data-theme', 'original');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
