import { useEffect, useState } from 'react';

/**
 * Development controls.
 *
 * Everything is off by default so the recording state is clean. Press `D` for
 * the readout panel, `V` for the Open & Pour video-slot outline.
 */

export const debugState = {
  panel: false,
  videoBounds: false,
};

/** Live values written from `useFrame`; read by the panel on an interval. */
export const sceneReadout = {
  fps: 0,
  canPosition: [0, 0, 0] as [number, number, number],
  cameraPosition: [0, 0, 0] as [number, number, number],
  fov: 0,
  warp: 0,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

/**
 * The key listener is installed exactly once, outside React.
 *
 * More than one component subscribes to these flags, and binding the handler
 * per subscriber would toggle each flag once per subscriber — an even number of
 * listeners silently cancels every keypress.
 */
let keysInstalled = false;

function installDebugKeys() {
  if (keysInstalled || typeof window === 'undefined') return;
  keysInstalled = true;

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Never hijack typing.
    const target = e.target as HTMLElement | null;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
      return;
    }

    const key = e.key.toLowerCase();
    if (key === 'd') {
      debugState.panel = !debugState.panel;
      emit();
    } else if (key === 'v') {
      debugState.videoBounds = !debugState.videoBounds;
      emit();
    }
  });
}

export function useDebugControls() {
  const [, force] = useState(0);

  useEffect(() => {
    installDebugKeys();
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return debugState;
}
