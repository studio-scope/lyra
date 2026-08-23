import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/syncopate/700.css';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import './styles/global.css';

import { App } from './App';
import { loadBrandFontsWithTimeout } from './hooks/useFonts';

/**
 * Fonts get a short head start so Syncopate is present for the first paint and
 * for the first can-label texture — but never longer than that. If a font
 * request stalls, the experience still boots, and CanModel redraws its label
 * once the faces actually arrive (see useFontsReady).
 */
const FONT_BUDGET_MS = 900;

function mount() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

loadBrandFontsWithTimeout(FONT_BUDGET_MS).then(mount, mount);
