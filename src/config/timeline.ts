/**
 * The single source of truth for scroll choreography.
 *
 * All positions along the page are expressed in "virtual vh" — the same unit
 * used in the brief (0 → TOTAL_VH). Nothing else in the codebase is allowed to
 * invent a raw scroll number; components read chapters and tracks from here.
 */

import { ease, lerp, type EaseName } from './easing';
import type { FlavorId } from './flavors';

export const TOTAL_VH = 1450;

/**
 * Physical scroll distance per unit of logical timeline.
 *
 * The choreography is authored in logical vh and always runs 0 -> `TOTAL_VH`.
 * That range is a coordinate system, not a pace: changing it would invalidate
 * every keyframe in `choreography.ts`. This constant is the separate,
 * authoritative lever for pace - it stretches the *page*, not the timeline.
 *
 *     physicalPageVh  = TOTAL_VH * SCROLL_DISTANCE_SCALE
 *     logicalScrollVh = (scrollY / maxScroll) * TOTAL_VH
 *
 * The second line lives in `useScroll.readScroll` and is the only place the
 * physical coordinate is converted back to the logical one. It divides by the
 * *measured* document height rather than by this constant, so the inverse can
 * never drift out of sync with the spacer, and no component needs to know the
 * scale exists.
 *
 * Consequences, all of them intended:
 *   - a wheel notch is a fixed number of CSS pixels, so a longer page costs
 *     proportionally more notches. This is real distance, not damping;
 *   - the composition at any logical vh is unchanged, keyframe for keyframe;
 *   - every chapter slows by exactly the same factor, so relative pacing
 *     between chapters is untouched.
 *
 * Measured at 1440x900: the site traverses in 122 wheel notches at 1.0 and
 * 220 at 1.75. Useful range is 1.65-1.85.
 */
export const SCROLL_DISTANCE_SCALE = 1.75;

/** Spacer height in vh - the single physical page-length value. */
export const PHYSICAL_PAGE_VH = TOTAL_VH * SCROLL_DISTANCE_SCALE;

export interface Chapter {
  id: string;
  /** `01`…`06`, printed in the HUD. */
  index: string;
  label: string;
  start: number;
  end: number;
  flavor: FlavorId;
}

export const CHAPTERS: Chapter[] = [
  { id: 'ignition', index: '01', label: 'IGNITION', start: 0, end: 180, flavor: 'nova' },
  { id: 'asteroid', index: '02', label: 'ASTEROID RUN', start: 180, end: 420, flavor: 'nova' },
  { id: 'nebulas', index: '03', label: 'FLAVOR NEBULAS', start: 420, end: 820, flavor: 'nova' },
  { id: 'station', index: '04', label: 'STATION FLYBY', start: 820, end: 1080, flavor: 'void' },
  { id: 'release', index: '05', label: 'OPEN & POUR', start: 1080, end: 1320, flavor: 'void' },
  { id: 'cta', index: '06', label: 'CHOOSE YOUR SIGNAL', start: 1320, end: 1450, flavor: 'void' },
];

/** Sub-moments inside chapter 03. */
export const NEBULA_MOMENTS = [
  { flavor: 'nova' as FlavorId, start: 420, end: 553 },
  { flavor: 'comet' as FlavorId, start: 553, end: 686 },
  { flavor: 'void' as FlavorId, start: 686, end: 820 },
];

/**
 * Label-texture swaps. Each one sits at the peak of a warp flash so the change
 * is never observed mid-frame — cheaper and cleaner than a live material morph.
 */
export const FLAVOR_SWAPS: { at: number; flavor: FlavorId }[] = [
  { at: 0, flavor: 'nova' },
  { at: 566, flavor: 'comet' },
  { at: 699, flavor: 'void' },
];

export function flavorAt(vh: number): FlavorId {
  let current: FlavorId = 'nova';
  for (const swap of FLAVOR_SWAPS) {
    if (vh >= swap.at) current = swap.flavor;
  }
  return current;
}

export function chapterAt(vh: number): Chapter {
  for (const c of CHAPTERS) {
    if (vh >= c.start && vh < c.end) return c;
  }
  return vh < 0 ? CHAPTERS[0] : CHAPTERS[CHAPTERS.length - 1];
}

/* ------------------------------------------------------------------ */
/* Keyframe tracks                                                     */
/* ------------------------------------------------------------------ */

export type Vec3 = [number, number, number];

/** `ease` describes the segment that *ends* at this keyframe. */
export interface Key<T> {
  at: number;
  v: T;
  ease?: EaseName;
}

export type NumberTrack = Key<number>[];
export type Vec3Track = Key<Vec3>[];

function segment<T>(track: Key<T>[], vh: number) {
  if (vh <= track[0].at) return { a: track[0], b: track[0], t: 0 };
  const last = track[track.length - 1];
  if (vh >= last.at) return { a: last, b: last, t: 0 };
  let lo = 0;
  let hi = track.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (track[mid].at <= vh) lo = mid;
    else hi = mid;
  }
  const a = track[lo];
  const b = track[hi];
  const raw = b.at === a.at ? 0 : (vh - a.at) / (b.at - a.at);
  return { a, b, t: ease(b.ease ?? 'inOut', raw) };
}

export function sampleNumber(track: NumberTrack, vh: number): number {
  const { a, b, t } = segment(track, vh);
  return lerp(a.v, b.v, t);
}

export function sampleVec3(track: Vec3Track, vh: number, out: Vec3): Vec3 {
  const { a, b, t } = segment(track, vh);
  out[0] = lerp(a.v[0], b.v[0], t);
  out[1] = lerp(a.v[1], b.v[1], t);
  out[2] = lerp(a.v[2], b.v[2], t);
  return out;
}

/**
 * A short symmetric pulse — used for ignition flashes and warp bursts.
 * Returns 0 outside [at - rise, at + fall].
 */
export function pulse(vh: number, at: number, rise: number, fall: number): number {
  if (vh < at - rise || vh > at + fall) return 0;
  if (vh <= at) {
    const t = (vh - (at - rise)) / rise;
    return t * t * t;
  }
  const t = 1 - (vh - at) / fall;
  return t * t;
}
