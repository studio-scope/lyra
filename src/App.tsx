import { useEffect } from 'react';
import styles from './App.module.css';
import chapterStyles from './chapters/Chapters.module.css';

import { Experience } from './experience/Experience';
import { HudOverlay } from './components/HudOverlay';
import { DebugPanel } from './components/DebugPanel';

import { Chapter01Ignition } from './chapters/Chapter01Ignition';
import { Chapter02AsteroidRun } from './chapters/Chapter02AsteroidRun';
import { Chapter03FlavorNebulas } from './chapters/Chapter03FlavorNebulas';
import { Chapter04StationFlyby } from './chapters/Chapter04StationFlyby';
import { Chapter05Release } from './chapters/Chapter05Release';
import { Chapter06Cta } from './chapters/Chapter06Cta';

import { useScrollDriver, useTimelineStatus } from './hooks/useScroll';
import { useDebugControls } from './hooks/useDebug';
import { PHYSICAL_PAGE_VH } from './config/timeline';

export function App() {
  useScrollDriver();
  // `chapter` is no longer surfaced anywhere; the flavour still drives the
  // DOM accent tokens and the WebGL palette.
  const { flavor } = useTimelineStatus();
  const debug = useDebugControls();

  /** The flavour drives the DOM accent tokens as well as the WebGL palette. */
  useEffect(() => {
    document.documentElement.dataset.flavor = flavor;
  }, [flavor]);

  return (
    <>
      {/* One continuous canvas, behind everything. */}
      <Experience flavor={flavor} />

      {/* All six stages, pinned. */}
      <div className={chapterStyles.chapterLayer}>
        <Chapter01Ignition />
        <Chapter02AsteroidRun />
        <Chapter03FlavorNebulas />
        <Chapter04StationFlyby />
        <Chapter05Release />
        <Chapter06Cta />
      </div>

      <HudOverlay />

      {/* The page's entire scroll length. */}
      <div className={styles.spacer} style={{ height: `${PHYSICAL_PAGE_VH}vh` }} />

      {debug.panel && <DebugPanel />}
    </>
  );
}
