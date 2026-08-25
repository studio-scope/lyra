/**
 * Dev-only URL flags. All of them are inert in a normal page load, and none of
 * them changes a single shipped value — they only let QA hold something still
 * that the timeline would otherwise be driving.
 *
 *   ?capture=1        deterministic hand-driven render loop (see Experience)
 *   ?neutral=1        strip every flavour-coloured light to white
 *   ?flavor=nova|…    pin the flavour regardless of scroll position
 *
 * `?neutral` and `?flavor` exist for one specific, permanent quality gate: the
 * three variants have to be distinguishable **under neutral white light**, not
 * merely under their own coloured environments. Being able to re-check that in
 * one URL is worth more than a pile of one-off console hacks.
 */

import type { FlavorId } from './flavors';

const params =
  typeof window === 'undefined'
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search);

export const CAPTURE_MODE = params.has('capture');

export const NEUTRAL_LIGHT = params.has('neutral');

const requested = params.get('flavor');
export const FLAVOR_PIN: FlavorId | null =
  requested === 'nova' || requested === 'comet' || requested === 'void'
    ? requested
    : null;
