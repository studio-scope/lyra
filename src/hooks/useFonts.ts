import { useEffect, useState } from 'react';

/**
 * Font readiness.
 *
 * The can label is drawn with Canvas2D, so it has to be re-drawn if Syncopate or
 * Geist arrive after the first render — otherwise the texture bakes a fallback
 * face. Boot never *waits* on fonts (see main.tsx): a blocked font request must
 * not be able to hold back the first paint.
 */

const FACES = [
  '700 64px Syncopate',
  '400 16px "Geist Sans"',
  '500 16px "Geist Sans"',
  '600 16px "Geist Sans"',
  '400 16px "Geist Mono"',
  '500 16px "Geist Mono"',
];

export function loadBrandFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.all(FACES.map((face) => document.fonts.load(face)))
    .then(() => document.fonts.ready)
    .then(() => undefined)
    .catch(() => undefined);
}

/** Resolves, or gives up after `ms`. Boot must never hang on a font request. */
export function loadBrandFontsWithTimeout(ms: number): Promise<void> {
  return Promise.race([
    loadBrandFonts(),
    new Promise<void>((resolve) => window.setTimeout(resolve, ms)),
  ]);
}

/** Flips to true once the brand faces are usable. */
export function useFontsReady() {
  const [ready, setReady] = useState(
    () => typeof document !== 'undefined' && document.fonts?.check('700 64px Syncopate'),
  );

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    loadBrandFonts().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}
