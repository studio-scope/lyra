/**
 * Can / camera / effect keyframes, in virtual-vh units.
 *
 * World scale reference: the can is 2.6 units tall and 0.96 units wide
 * (355 ml proportions, ~1:2.7). The camera looks down -Z at the origin.
 */

import type { NumberTrack, Vec3Track } from './timeline';

/* ---------------------------------------------------------------- */
/* CAN                                                               */
/* ---------------------------------------------------------------- */

export const CAN_POSITION: Vec3Track = [
  // 01 IGNITION - dormant inside the Vega point, then launched forward.
  // The start value is VEGA_POSITION (see LyraConstellation).
  { at: 0, v: [0, 1.6, -26] },
  { at: 88, v: [0, 1.6, -26], ease: 'hold' },
  { at: 97, v: [0, 2.25, -24.4], ease: 'expoOut' },
  { at: 112, v: [0, 2.1, -17.2], ease: 'expoIn' },
  { at: 130, v: [0, 0.8, -5.6], ease: 'linear' },
  { at: 152, v: [0, 0, 0], ease: 'expoOut' },
  { at: 180, v: [0, 0, 0], ease: 'linear' },

  // 02 ASTEROID RUN - one readable S-curve. The can sweeps left only while the
  // left-hand copy block is off screen; it holds right while the copy reads.
  { at: 215, v: [-1.25, 0.3, -1.3], ease: 'inOut' },
  { at: 250, v: [0.55, 0.05, -0.5], ease: 'inOut' },
  { at: 288, v: [1.35, -0.18, -0.2], ease: 'inOut' },
  { at: 330, v: [0.7, 0.28, -1.1], ease: 'inOut' },
  { at: 362, v: [-0.95, 0.1, -1.7], ease: 'inOut' },
  { at: 394, v: [0.15, 0.02, -0.6], ease: 'inOut' },
  { at: 420, v: [0.85, 0, 0], ease: 'out' },

  // 03 NEBULAS - each moment holds a different composition.
  { at: 470, v: [0.85, 0, 0], ease: 'linear' },
  { at: 553, v: [0.85, 0.04, 0], ease: 'linear' },
  { at: 566, v: [0.2, 0.02, -1.6], ease: 'expoIn' },
  { at: 600, v: [-0.8, -0.1, 0], ease: 'expoOut' },
  { at: 686, v: [-0.8, -0.06, 0], ease: 'linear' },
  { at: 699, v: [-0.2, -0.02, -1.8], ease: 'expoIn' },
  { at: 733, v: [0, 0.1, 0], ease: 'expoOut' },
  { at: 820, v: [0, 0.1, 0], ease: 'linear' },

  // 04 STATION - a slow arc across the ring.
  { at: 880, v: [-0.7, 0.18, -0.3], ease: 'inOut' },
  { at: 960, v: [0.35, -0.12, -0.6], ease: 'inOut' },
  { at: 1040, v: [0.55, 0.14, -0.2], ease: 'inOut' },
  { at: 1080, v: [0, 0.06, 0], ease: 'inOut' },

  // 05 RELEASE - centred and locked. Framing must not drift after 1262.
  { at: 1150, v: [0, -0.1, 0], ease: 'inOut' },
  { at: 1240, v: [0, -0.12, 0], ease: 'linear' },
  { at: 1262, v: [0, -0.12, 0], ease: 'hold' },
  // A brief settled hold once the release has finished: RELEASE_PRESENCE is
  // gone by 1318, so by 1314 the frame is just the open can.
  { at: 1314, v: [0, -0.12, 0], ease: 'hold' },

  // 06 CTA - the opaque product leaves downward. It accelerates like weight
  // rather than easing symmetrically, and drifts back as it goes so the exit
  // reads as depth and not as a slide. Fully clear of frame by 1342.
  { at: 1326, v: [0, -1.15, -0.4], ease: 'in' },
  { at: 1342, v: [0, -3.9, -1.2], ease: 'linear' },
  { at: 1380, v: [0, -5.4, -2.6], ease: 'linear' },
  { at: 1450, v: [0, -6.2, -3.4], ease: 'linear' },
];

export const CAN_ROTATION: Vec3Track = [
  { at: 0, v: [0, 3.2, 0] },
  { at: 88, v: [0, 3.2, 0], ease: 'hold' },
  { at: 126, v: [0.14, 1.9, 0.1], ease: 'linear' },
  { at: 152, v: [0.02, 0.35, 0.03], ease: 'expoOut' },
  { at: 180, v: [0.02, 0.35, 0.02], ease: 'linear' },

  { at: 232, v: [0.1, 1.5, -0.16], ease: 'inOut' },
  { at: 286, v: [-0.06, 2.9, 0.14], ease: 'inOut' },
  { at: 338, v: [0.12, 4.4, -0.1], ease: 'inOut' },
  { at: 392, v: [0.02, 5.6, 0.05], ease: 'inOut' },

  // Label settles square to camera for NOVA.
  { at: 470, v: [0.02, 6.2832, 0.04], ease: 'expoOut' },
  { at: 553, v: [0.02, 6.2832, 0.04], ease: 'linear' },
  // Two fast turns inside the COMET warp, landing square again.
  { at: 600, v: [-0.03, 12.5664, -0.06], ease: 'expoOut' },
  { at: 686, v: [-0.03, 12.5664, -0.06], ease: 'linear' },
  { at: 733, v: [0.03, 18.8496, 0.02], ease: 'expoOut' },
  { at: 820, v: [0.03, 18.8496, 0.02], ease: 'linear' },

  // Station: a slow deliberate turn, no wobble.
  { at: 960, v: [0.01, 19.15, -0.05], ease: 'inOut' },
  { at: 1080, v: [0, 19.35, 0.02], ease: 'inOut' },

  // Release: locked three-quarter presentation angle. 19.47 rad is 18.8496
  // (three full turns, label square to camera) plus 0.62 rad / 35.5 degrees —
  // far enough to read as a three-quarter view, close enough to keep the
  // printed LYRA legible in the hero close-up.
  { at: 1150, v: [-0.05, 19.47, 0.015], ease: 'inOut' },
  { at: 1262, v: [-0.05, 19.47, 0.015], ease: 'hold' },
  { at: 1314, v: [-0.05, 19.47, 0.015], ease: 'hold' },
  { at: 1450, v: [-0.02, 19.6, 0], ease: 'linear' },
];

export const CAN_SCALE: NumberTrack = [
  { at: 0, v: 0 },
  { at: 88, v: 0, ease: 'hold' },
  { at: 96, v: 0.12, ease: 'expoIn' },
  { at: 126, v: 0.6, ease: 'linear' },
  { at: 152, v: 1, ease: 'expoOut' },
  { at: 1314, v: 1, ease: 'linear' },
  // A restrained shrink during the exit only — enough to read as receding,
  // not enough to read as the can being scaled away.
  { at: 1342, v: 0.95, ease: 'inOut' },
  { at: 1450, v: 0.92, ease: 'linear' },
];

/** Master can opacity - only used to retire the can behind the CTA. */
/**
 * Whole-product presence: 1 = drawn, 0 = not drawn. Never a fade.
 *
 * The switch sits at 1343, a beat *after* `CAN_POSITION` has carried the can
 * clear of the bottom of frame at 1342, so nothing is ever cut while visible
 * and nothing is ever drawn translucent. Reverse scrubbing restores it on the
 * same frame because this is a pure function of vh like every other track.
 */
export const CAN_PRESENCE: NumberTrack = [
  { at: 0, v: 1 },
  { at: 1342, v: 1, ease: 'hold' },
  { at: 1344, v: 0, ease: 'linear' },
  { at: 1450, v: 0, ease: 'hold' },
];

/**
 * Pull-tab lift, 0 = closed, 1 = fully pressed.
 *
 * The whole point is contrast: the tab spends a long, slow stretch building
 * tension against a sealed flap, then everything stops dead, and only then does
 * the flap give way. Anticipation is 42 vh, the dead hold is 8, the break is 6.
 *
 * Values above 1 are intentional and are *not* clamped away by `CanModel`: the
 * hand is still pulling at the instant the score parts, so the tab jumps the
 * few degrees the flap was holding back before it settles.
 */
export const TAB_LIFT: NumberTrack = [
  { at: 0, v: 0 },
  // BEAT A — TENSION. Sealed hold while the composition settles.
  { at: 1192, v: 0, ease: 'hold' },
  { at: 1214, v: 0.55, ease: 'inOut' },
  { at: 1228, v: 0.93, ease: 'inOut' },
  // The tab finishes its travel with the flap still sealed ...
  { at: 1231, v: 1, ease: 'out' },
  // ... and then nothing on the can moves at all for 11 vh. This dead beat is
  // the whole reason the break lands: the eye settles on a static, fully loaded
  // mechanism, and the only things still changing are the pressure under the
  // flap and the flap's own outward bow against it.
  { at: 1242, v: 1, ease: 'linear' },
  // BEAT B — the score lets go. 1.055 x TAB_MAX_ROTATION is ~1.7 degrees past
  // the resting travel: a mechanical jump, not a bounce. One small counter and
  // it is settled 11 vh after the break.
  { at: 1245, v: 1.055, ease: 'out' },
  { at: 1249, v: 0.988, ease: 'inOut' },
  { at: 1253, v: 1, ease: 'inOut' },
  { at: 1450, v: 1, ease: 'linear' },
];

/**
 * The scored flap, driven independently of the tab.
 *
 * Deliberately a bare linear ramp: `CanModel` runs it through the `impact`
 * easing, so the shape of the break lives with the hardware rather than being
 * baked into keyframes that would have to be hand-tuned to overshoot.
 */
export const FLAP_BREAK: NumberTrack = [
  { at: 0, v: 0 },
  // BEAT B — SNAP. Sealed right up to 1242, then the whole break happens in
  // 6 vh — about two thirds of a wheel notch at the shipped scroll distance.
  // `CanModel` runs this through the `impact` easing, so the overshoot and
  // settle of thin aluminium live with the hardware, not in keyframes.
  { at: 1242, v: 0, ease: 'hold' },
  { at: 1248, v: 1, ease: 'linear' },
  { at: 1450, v: 1, ease: 'hold' },
];

/**
 * Bright edge on the freshly cut aluminium.
 *
 * The peak sits on 1242 — the exact vh the score parts and the flap starts to
 * move — so the flash, the pressure ring and the can's recoil are one event
 * rather than three consequences. The 2 vh `in` ramp ahead of it is the score
 * loading, and it also guarantees the peak cannot fall between two frames on a
 * fast wheel scroll.
 */
export const CUT_EDGE_FLASH: NumberTrack = [
  { at: 0, v: 0 },
  { at: 1240, v: 0, ease: 'hold' },
  { at: 1242, v: 1, ease: 'in' },
  { at: 1250, v: 0, ease: 'out' },
  { at: 1450, v: 0, ease: 'hold' },
];

/**
 * Can recoil at the break.
 *
 * Unitless: `SceneController` maps it through `RECOIL_RISE` / `RECOIL_PUSH` /
 * `RECOIL_TILT` below. Peak 1.35 lands ~12px of lift, ~0.75 degrees of tilt and
 * a hair of push toward camera — the can is shoved by what leaves it.
 *
 * The rise is 2 vh, so on screen it is a single-frame kick. One counter-swing
 * and it is done: no second bounce, because a second bounce on a 12px throw is
 * what makes a can read as rubber. `SceneController` adds this on top of the
 * locked position track, and the *camera* never moves.
 */
export const CAN_RECOIL: NumberTrack = [
  { at: 0, v: 0 },
  { at: 1242, v: 0, ease: 'hold' },
  { at: 1244, v: 1.35, ease: 'out' },
  { at: 1248, v: -0.38, ease: 'inOut' },
  { at: 1254, v: 0, ease: 'inOut' },
  { at: 1450, v: 0, ease: 'hold' },
];

/**
 * How `CAN_RECOIL` reaches the rig. Measured at the release camera, where the
 * frame is 2.04 world units tall across 900px — 441 px per unit.
 *
 *   rise  0.026 * 1.35 = 0.035 units = ~15 px of lift
 *   tilt  0.0097 * 1.35 = 0.0131 rad = 0.75 degrees
 *   push  0.011 * 1.35 = 0.015 units toward camera, ~0.4% apparent scale
 *
 * The rise is deliberately larger than the number you want to see. The camera
 * is still easing in across 1240-1262, and that push carries the can *down* the
 * frame by ~10px over the same window, so a 15px object lift nets out at the
 * 10-14px on-screen kick the shot is cut for.
 *
 * The tilt is what sells it. Pure translation reads as the whole shot nudging;
 * a rotation about X reads as the *object* being kicked.
 */
export const RECOIL_RISE = 0.026;
export const RECOIL_PUSH = 0.011;
export const RECOIL_TILT = 0.0097;

/* ---------------------------------------------------------------- */
/* CAMERA                                                            */
/* ---------------------------------------------------------------- */

export const CAMERA_POSITION: Vec3Track = [
  { at: 0, v: [0, -0.2, 2.4] },
  { at: 60, v: [0, -0.15, 1.4], ease: 'inOut' },
  { at: 92, v: [0, -0.12, 0.9], ease: 'in' },
  { at: 104, v: [0, -0.05, 3.4], ease: 'expoOut' },
  { at: 152, v: [0, 0.06, 7.6], ease: 'expoOut' },
  { at: 180, v: [0, 0.05, 7.5], ease: 'linear' },

  { at: 240, v: [0.72, 0.32, 7.0], ease: 'inOut' },
  { at: 300, v: [-0.6, -0.2, 6.6], ease: 'inOut' },
  { at: 338, v: [0, 0.1, 5.9], ease: 'in' },
  { at: 362, v: [0, 0.05, 6.9], ease: 'expoOut' },
  { at: 420, v: [-0.78, -0.62, 7.3], ease: 'inOut' },

  // NOVA - slightly low, looking up. Heroic. Distances are set so the can
  // reads at ~60% of frame height and stays inside the central 80%.
  { at: 470, v: [-0.78, -0.62, 7.3], ease: 'linear' },
  { at: 553, v: [-0.72, -0.56, 7.2], ease: 'linear' },
  { at: 566, v: [-0.3, -0.1, 5.4], ease: 'expoIn' },
  // COMET - high and clean, looking slightly down.
  { at: 600, v: [0.72, 0.94, 7.0], ease: 'expoOut' },
  { at: 686, v: [0.68, 0.9, 6.95], ease: 'linear' },
  { at: 699, v: [0.2, 0.2, 5.2], ease: 'expoIn' },
  // VOID - closer, low and heavy, but still framed.
  { at: 733, v: [0.05, -0.95, 6.9], ease: 'expoOut' },
  { at: 820, v: [0.05, -0.9, 6.95], ease: 'linear' },

  // STATION - the camera rotates with the can around the ring.
  { at: 880, v: [2.6, 0.7, 6.9], ease: 'inOut' },
  { at: 960, v: [3.4, -0.35, 6.5], ease: 'inOut' },
  { at: 1040, v: [1.3, 1.0, 7.1], ease: 'inOut' },
  { at: 1080, v: [0, 0.4, 6.6], ease: 'inOut' },

  // RELEASE - climb over the lid so the seal and the pull tab are actually in
  // frame, then lock. The camera ends ~24 degrees above the horizontal.
  //
  // The push-in is split into an ease-in / accelerate / settle arc instead of
  // one symmetric move. Leaving the boundary slowly is what lets the station
  // ring fade out behind the can before the camera commits to the close-up.
  { at: 1104, v: [0, 0.52, 6.3], ease: 'in' },
  { at: 1126, v: [0, 0.92, 5.45], ease: 'linear' },
  { at: 1150, v: [0, 1.62, 4.3], ease: 'out' },
  { at: 1240, v: [0, 2.5, 3.52], ease: 'inOut' },
  { at: 1262, v: [0, 2.58, 3.42], ease: 'out' },
  { at: 1320, v: [0, 2.58, 3.42], ease: 'hold' },

  { at: 1450, v: [0, 0.3, 5.6], ease: 'inOut' },
];

export const CAMERA_TARGET: Vec3Track = [
  // Framed on Vega through the whole opening, then handed to the can.
  { at: 0, v: [0, 0.02, -6] },
  { at: 92, v: [0, 0.28, -8], ease: 'inOut' },
  { at: 104, v: [0, 0.5, -3], ease: 'expoOut' },
  { at: 130, v: [0, 0.28, -1], ease: 'linear' },
  { at: 152, v: [0, 0.02, 0], ease: 'expoOut' },

  { at: 240, v: [-0.5, 0.1, -0.4], ease: 'inOut' },
  { at: 300, v: [0.45, -0.1, -0.2], ease: 'inOut' },
  { at: 362, v: [0, 0.02, -0.4], ease: 'inOut' },

  { at: 420, v: [0.55, 0.06, 0], ease: 'inOut' },
  { at: 553, v: [0.55, 0.06, 0], ease: 'linear' },
  { at: 600, v: [-0.5, -0.04, 0], ease: 'expoOut' },
  { at: 686, v: [-0.5, -0.04, 0], ease: 'linear' },
  { at: 733, v: [0, 0.16, 0], ease: 'expoOut' },
  { at: 820, v: [0, 0.14, 0], ease: 'linear' },

  { at: 880, v: [-0.35, 0.12, -0.2], ease: 'inOut' },
  { at: 960, v: [0.2, -0.08, -0.3], ease: 'inOut' },
  { at: 1080, v: [0, 0.16, 0], ease: 'inOut' },
  { at: 1104, v: [0, 0.22, 0], ease: 'in' },
  { at: 1126, v: [0, 0.42, 0], ease: 'linear' },

  // Camera target rises toward the lid for the open & pour framing.
  { at: 1150, v: [0, 0.74, 0], ease: 'inOut' },
  { at: 1262, v: [0, 1.05, 0], ease: 'inOut' },
  { at: 1320, v: [0, 1.05, 0], ease: 'hold' },
  { at: 1450, v: [0, 0.1, 0], ease: 'inOut' },
];

export const CAMERA_FOV: NumberTrack = [
  { at: 0, v: 30 },
  { at: 92, v: 28, ease: 'inOut' },
  { at: 104, v: 46, ease: 'expoIn' },
  { at: 130, v: 36, ease: 'expoOut' },
  { at: 180, v: 34, ease: 'inOut' },
  { at: 330, v: 34, ease: 'linear' },
  { at: 344, v: 47, ease: 'expoIn' },
  { at: 366, v: 34, ease: 'expoOut' },
  { at: 420, v: 32, ease: 'inOut' },
  { at: 553, v: 32, ease: 'linear' },
  { at: 566, v: 48, ease: 'expoIn' },
  { at: 590, v: 33, ease: 'expoOut' },
  { at: 686, v: 33, ease: 'linear' },
  { at: 699, v: 50, ease: 'expoIn' },
  { at: 724, v: 30, ease: 'expoOut' },
  { at: 820, v: 31, ease: 'inOut' },
  { at: 1080, v: 33, ease: 'inOut' },
  { at: 1104, v: 32.6, ease: 'in' },
  { at: 1126, v: 31.4, ease: 'linear' },
  { at: 1150, v: 29, ease: 'out' },
  { at: 1262, v: 30, ease: 'inOut' },
  { at: 1320, v: 30, ease: 'hold' },
  { at: 1450, v: 32, ease: 'inOut' },
];

/* ---------------------------------------------------------------- */
/* EFFECT TRACKS                                                     */
/* ---------------------------------------------------------------- */

/** Constellation line-draw progress. */
export const CONSTELLATION_DRAW: NumberTrack = [
  { at: 0, v: 0 },
  { at: 8, v: 0, ease: 'hold' },
  { at: 62, v: 1, ease: 'out' },
  { at: 150, v: 1, ease: 'linear' },
];

/** Overall constellation visibility - it fades out once the can is airborne. */
export const CONSTELLATION_OPACITY: NumberTrack = [
  { at: 0, v: 0 },
  { at: 14, v: 1, ease: 'out' },
  { at: 96, v: 1, ease: 'linear' },
  { at: 140, v: 0, ease: 'inOut' },
  { at: 180, v: 0, ease: 'hold' },
];

/** Vega pulse energy, ramping into the ignition flash. */
export const VEGA_ENERGY: NumberTrack = [
  { at: 0, v: 0.05 },
  { at: 58, v: 0.12, ease: 'linear' },
  { at: 66, v: 0.45, ease: 'in' },
  { at: 88, v: 1, ease: 'expoIn' },
  { at: 96, v: 0.2, ease: 'expoOut' },
  { at: 140, v: 0, ease: 'inOut' },
];

/**
 * Warp intensity: drives the radial streak overlay, the FOV kick's companion
 * exposure pulse and forward motion. Narrow spikes only - never a standing blur.
 */
export const WARP: NumberTrack = [
  { at: 0, v: 0 },
  { at: 330, v: 0, ease: 'hold' },
  { at: 344, v: 0.85, ease: 'expoIn' },
  { at: 368, v: 0, ease: 'expoOut' },
  { at: 553, v: 0, ease: 'hold' },
  { at: 566, v: 1, ease: 'expoIn' },
  { at: 592, v: 0, ease: 'expoOut' },
  { at: 686, v: 0, ease: 'hold' },
  { at: 699, v: 1, ease: 'expoIn' },
  { at: 726, v: 0, ease: 'expoOut' },
  { at: 1450, v: 0, ease: 'hold' },
];

/** Trail presence. Drops away during closeups so it never crowds the product. */
export const TRAIL_INTENSITY: NumberTrack = [
  { at: 0, v: 0 },
  { at: 96, v: 0, ease: 'hold' },
  { at: 112, v: 1, ease: 'out' },
  { at: 180, v: 0.9, ease: 'linear' },
  { at: 300, v: 1, ease: 'linear' },
  { at: 420, v: 0.55, ease: 'inOut' },
  { at: 470, v: 0.12, ease: 'inOut' },
  { at: 560, v: 0.12, ease: 'linear' },
  { at: 578, v: 1, ease: 'out' },
  { at: 616, v: 0.12, ease: 'inOut' },
  { at: 693, v: 0.12, ease: 'linear' },
  { at: 711, v: 1, ease: 'out' },
  { at: 750, v: 0.14, ease: 'inOut' },
  { at: 880, v: 0.5, ease: 'inOut' },
  { at: 1040, v: 0.4, ease: 'linear' },
  { at: 1110, v: 0, ease: 'inOut' },
  { at: 1450, v: 0, ease: 'hold' },
];

/**
 * World-frame flight speed, in Z units per vh.
 *
 * The can's own coordinates barely change during the run — the camera travels
 * with it and the environment streams past instead. This track is that missing
 * motion, and it is what gives the trail its length. It matches the rate the
 * asteroid field and star layers stream toward the camera.
 */
export const TRAIL_DRIFT: NumberTrack = [
  { at: 0, v: 0 },
  { at: 170, v: 0, ease: 'hold' },
  { at: 200, v: 0.13, ease: 'out' },
  { at: 400, v: 0.13, ease: 'linear' },
  { at: 440, v: 0.03, ease: 'inOut' },
  { at: 820, v: 0.03, ease: 'linear' },
  { at: 870, v: 0.09, ease: 'inOut' },
  { at: 1050, v: 0.09, ease: 'linear' },
  { at: 1100, v: 0, ease: 'inOut' },
  { at: 1450, v: 0, ease: 'hold' },
];

/** Environment / nebula presence per chapter. */
export const NEBULA_PRESENCE: NumberTrack = [
  { at: 0, v: 0 },
  { at: 400, v: 0, ease: 'hold' },
  { at: 448, v: 1, ease: 'inOut' },
  { at: 800, v: 1, ease: 'linear' },
  { at: 860, v: 0.18, ease: 'inOut' },
  { at: 1240, v: 0.18, ease: 'linear' },
  { at: 1300, v: 0, ease: 'inOut' },
];

export const ASTEROIDS_PRESENCE: NumberTrack = [
  { at: 0, v: 0 },
  // Holds off until the hero copy has begun leaving, so the field arrives as
  // a transition rather than as clutter behind the headline.
  { at: 178, v: 0, ease: 'hold' },
  { at: 208, v: 1, ease: 'out' },
  { at: 400, v: 1, ease: 'linear' },
  { at: 436, v: 0, ease: 'inOut' },
];

export const STATION_PRESENCE: NumberTrack = [
  { at: 0, v: 0 },
  { at: 790, v: 0, ease: 'hold' },
  { at: 848, v: 1, ease: 'inOut' },
  { at: 1050, v: 1, ease: 'linear' },
  // The ring eases out *behind* the can while the camera is still pushing in,
  // rather than vanishing at the chapter boundary. It keeps spinning the whole
  // way down (its rotation is scroll-driven), so the last thing the eye sees of
  // the station is still moving — which is what stops the handoff reading as a
  // cut.
  { at: 1104, v: 0.6, ease: 'inOut' },
  { at: 1148, v: 0.18, ease: 'linear' },
  { at: 1186, v: 0, ease: 'inOut' },
];

export const LIQUID_PRESENCE: NumberTrack = [
  { at: 0, v: 0 },
  { at: 1300, v: 0, ease: 'hold' },
  { at: 1352, v: 1, ease: 'inOut' },
  { at: 1450, v: 1, ease: 'linear' },
];

/** Star field brightness. Stars never fully disappear - they are the substrate. */
export const STARS_INTENSITY: NumberTrack = [
  { at: 0, v: 0.15 },
  { at: 40, v: 0.7, ease: 'out' },
  { at: 180, v: 1, ease: 'inOut' },
  { at: 420, v: 0.8, ease: 'inOut' },
  { at: 820, v: 0.55, ease: 'inOut' },
  { at: 1120, v: 0.3, ease: 'inOut' },
  { at: 1330, v: 0.12, ease: 'inOut' },
];

/** Studio key-light level. Chapter 05 lifts it so the can reads as a product. */
export const KEY_LIGHT: NumberTrack = [
  { at: 0, v: 0 },
  { at: 96, v: 0.2, ease: 'out' },
  { at: 152, v: 1, ease: 'expoOut' },
  { at: 1080, v: 1, ease: 'linear' },
  { at: 1180, v: 1.45, ease: 'inOut' },
  { at: 1320, v: 1.3, ease: 'linear' },
  { at: 1450, v: 0.9, ease: 'inOut' },
];

/* ---------------------------------------------------------------- */
/* CHAPTER 05 - OPEN & POUR HAND-OFF                                 */
/* ---------------------------------------------------------------- */

/**
 * The locked Open & Pour framing. The release is rendered live in the scene, so
 * these are the reference numbers the choreography and the development overlay
 * are checked against — not a plate specification.
 */
export const RELEASE_FRAMING = {
  cutPointVh: 1262,
  scrubStartVh: 1262,
  scrubEndVh: 1320,
  /** Where the release has fully resolved and the CTA takes over. */
  releaseEndVh: 1310,
  camera: { position: [0, 2.58, 3.42] as [number, number, number], fov: 30 },
  cameraTarget: [0, 1.05, 0] as [number, number, number],
  can: {
    position: [0, -0.12, 0] as [number, number, number],
    /** Euler Y in radians, normalised into 0..2pi for readability. */
    rotationY: 19.47 % (Math.PI * 2),
    rotationX: -0.05,
    scale: 1,
    tabLift: 1,
  },
} as const;

/* ---------------------------------------------------------------- */
/* CHAPTER 05 - RELEASE ENERGY                                       */
/* ---------------------------------------------------------------- */

/**
 * The release is rendered in the live scene, so these are ordinary tracks like
 * every other effect: pure functions of scroll position, sampled once per frame
 * and pushed straight into uniforms and transforms.
 */

/**
 * Violet swell under the *sealed* flap. It builds through the tension phase and
 * is gone by the time the score gives way — this is pressure showing through
 * the metal, never anything escaping it.
 */
export const RELEASE_PRESSURE: NumberTrack = [
  { at: 0, v: 0 },
  { at: 1192, v: 0, ease: 'hold' },
  { at: 1228, v: 0.84, ease: 'in' },
  // Still creeping upward through the dead hold. With the tab, the flap and the
  // camera all stationary between 1231 and 1242, this is the only thing on
  // screen that changes — which keeps the pause tense instead of dead.
  { at: 1242, v: 1, ease: 'linear' },
  // Gone across the break itself: the pressure does not fade, it escapes.
  { at: 1248, v: 0, ease: 'out' },
  { at: 1450, v: 0, ease: 'hold' },
];

/**
 * Pressure ring, fired from the aperture the instant the score breaks.
 *
 * The value is the ring's *expansion*, and `ReleaseBurst` fades it out as
 * `(1 - shock)^2` — so the ring is at its brightest and tightest at the bottom
 * of this track. Starting it at 1242 rather than ramping in from 1240 is what
 * puts its peak on the same frame as the cut-edge flash and the can recoil.
 */
export const RELEASE_SHOCK: NumberTrack = [
  { at: 0, v: 0 },
  { at: 1241, v: 0, ease: 'hold' },
  { at: 1242, v: 0.03, ease: 'linear' },
  { at: 1268, v: 1, ease: 'linear' },
  { at: 1450, v: 1, ease: 'hold' },
];

/**
 * Directional vapour burst. Starts a beat *after* the flap has actually opened,
 * so the eye reads the mechanism first and the escape second.
 */
export const RELEASE_VAPOR: NumberTrack = [
  { at: 0, v: 0 },
  // Mist starts the instant the score gives way, at the aperture. A 2 vh attack
  // — one third of the break — so the puff is at full strength while the flap
  // is still folding. That is the difference between a psht and a fade-in.
  { at: 1242, v: 0, ease: 'hold' },
  { at: 1244, v: 1, ease: 'out' },
  { at: 1256, v: 0.5, ease: 'linear' },
  { at: 1274, v: 0, ease: 'inOut' },
  { at: 1450, v: 0, ease: 'hold' },
];

/**
 * Master progress for the liquid. The core form grows along it and every
 * droplet reads its own launch window from it, so one track drives the whole
 * field and the whole field stays reversible.
 */
export const RELEASE_FLOW: NumberTrack = [
  { at: 0, v: 0 },
  // BEAT C — RELEASE. Fast expansion out of the break, then the body gives way
  // to droplets and the whole field is dissipating before the CTA takes over.
  { at: 1244, v: 0, ease: 'hold' },
  { at: 1262, v: 0.45, ease: 'out' },
  { at: 1286, v: 0.82, ease: 'linear' },
  { at: 1312, v: 1, ease: 'out' },
  { at: 1450, v: 1, ease: 'hold' },
];

/** Overall presence: in behind the break, out into the CTA's liquid field. */
export const RELEASE_PRESENCE: NumberTrack = [
  { at: 0, v: 0 },
  // Up with the vapour, not after it: the first droplets have to be visible
  // leaving the aperture while the mist is still bright.
  { at: 1244, v: 0, ease: 'hold' },
  { at: 1254, v: 1, ease: 'out' },
  { at: 1298, v: 1, ease: 'linear' },
  { at: 1318, v: 0, ease: 'inOut' },
  { at: 1450, v: 0, ease: 'hold' },
];

/** Flash pulses: [centre vh, rise, fall, strength]. */
export const FLASHES: [number, number, number, number][] = [
  [93, 5, 16, 1], // ignition
  [566, 4, 14, 0.72], // NOVA -> COMET swap
  [699, 4, 14, 0.72], // COMET -> VOID swap
  // Peaks 3 vh *after* the score parts. At 1242 this is exactly zero, so the
  // snap frame is a hard local flash on the metal against black; the scene-wide
  // lift belongs to what escapes, one beat later, not to a still-sealed can.
  [1245, 3, 11, 0.5], // the pressure escapes
];
