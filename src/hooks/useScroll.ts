import { useEffect, useState } from 'react';
import { motionValue, useTransform, type MotionValue } from 'motion/react';
import { TOTAL_VH, chapterAt, flavorAt, type Chapter } from '../config/timeline';
import type { FlavorId } from '../config/flavors';

/**
 * One scroll source for the whole site.
 *
 * - `scrollVh` / `scrollProgress` are Motion values, consumed by DOM chapters
 *   through `useTransform`. They never trigger a React render.
 * - `scrollState` is a plain mutable object, read directly inside `useFrame`
 *   so the WebGL side costs nothing per frame.
 *
 * Native scroll only. No smooth-scroll library: scrubbing stays locked to the
 * user's input, which is what makes fast reverse scrubbing survive.
 */

export const scrollVh = motionValue(0);
export const scrollProgress = motionValue(0);

export const scrollState = {
  /** Position along the virtual timeline, 0 .. TOTAL_VH. */
  vh: 0,
  /** Normalised 0 .. 1. */
  progress: 0,
  /** vh moved during the last frame — drives trail energy and streaks. */
  velocity: 0,
  /** True while the tab is backgrounded; the render loop throttles itself. */
  hidden: false,
};

/**
 * The one physical -> logical conversion in the codebase.
 *
 * `max` is the *measured* scrollable distance, so the page can be any length
 * (see `SCROLL_DISTANCE_SCALE`) and this still maps it onto exactly 0..TOTAL_VH.
 * Nothing downstream knows or needs to know how long the page is.
 */
function readScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  scrollState.progress = p;
  scrollState.vh = p * TOTAL_VH;
  scrollProgress.set(p);
  scrollVh.set(scrollState.vh);
}

/** Install once, at the app root. */
export function useScrollDriver() {
  useEffect(() => {
    readScroll();
    const onScroll = () => readScroll();
    const onResize = () => readScroll();
    const onVisibility = () => {
      scrollState.hidden = document.hidden;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}

/** 0 → 1 across an arbitrary vh window. Clamped, no React state. */
export function useVhRange(from: number, to: number): MotionValue<number> {
  return useTransform(scrollVh, [from, to], [0, 1], { clamp: true });
}

/**
 * Standard chapter copy envelope: fade/slide in after the chapter starts, hold,
 * then leave before the boundary so transitions are pure 3D.
 */
export function useCopyEnvelope(
  start: number,
  end: number,
  inset: [number, number, number, number] = [0.06, 0.2, 0.72, 0.92],
): MotionValue<number> {
  const span = end - start;
  const stops = inset.map((f) => start + span * f);
  return useTransform(scrollVh, stops, [0, 1, 1, 0], { clamp: true });
}

/** Chapter + flavor as React state. Updates only when they actually change. */
export function useTimelineStatus() {
  const [chapter, setChapter] = useState<Chapter>(() => chapterAt(0));
  const [flavor, setFlavor] = useState<FlavorId>(() => flavorAt(0));

  useEffect(() => {
    const unsub = scrollVh.on('change', (vh) => {
      const next = chapterAt(vh);
      setChapter((prev) => (prev.id === next.id ? prev : next));
      const nextFlavor = flavorAt(vh);
      setFlavor((prev) => (prev === nextFlavor ? prev : nextFlavor));
    });
    return unsub;
  }, []);

  return { chapter, flavor };
}
