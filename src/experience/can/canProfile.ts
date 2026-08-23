import * as THREE from 'three';

/**
 * Lathe profiles for a sleek 355 ml beverage can.
 *
 * Height 2.579 (bottom -1.300, rim top 1.279), body diameter 1.112 → 1 : 2.32.
 * The overall animated height is unchanged from the previous build, so every
 * camera path and can keyframe stays valid; only the body got wider.
 *
 * Shape rules that make it read as a *can* and not an aerosol tin:
 *   - the sidewall is dead straight through ~81% of the height;
 *   - the shoulder taper occupies only the top 9.3%, and turns at a tight
 *     knuckle rather than easing away like a bottle;
 *   - the rolled top seam is its own geometry and stands proud of the neck, so
 *     it catches a separate highlight;
 *   - the base has a real contact ring and a concave recess inside it.
 *
 * Profiles are listed bottom-up as [radius, y].
 */

export const CAN_HEIGHT = 2.579;
export const CAN_RADIUS = 0.556;

/** Concave base and the lower rim, up to full body radius. */
export const BASE_PROFILE: [number, number][] = [
  [0.0, -1.19],
  [0.09, -1.194],
  [0.18, -1.206],
  [0.265, -1.226],
  [0.34, -1.252],
  [0.4, -1.278],
  [0.443, -1.295],
  [0.478, -1.3], // contact ring — the lowest point of the can
  [0.508, -1.294],
  [0.528, -1.278],
  [0.542, -1.252],
  [0.551, -1.212],
  [0.5545, -1.17],
  [0.556, -1.12],
];

/** Straight sidewall, then the shoulder taper into the neck. */
export const BODY_PROFILE: [number, number][] = [
  [0.556, -1.12],
  [0.556, 0.3],
  [0.556, 0.86],
  [0.556, 1.0], // knuckle: everything below this is perfectly straight
  [0.555, 1.028],
  [0.5515, 1.056],
  [0.5445, 1.084],
  [0.533, 1.112],
  [0.516, 1.14],
  [0.493, 1.166],
  [0.464, 1.19],
  [0.43, 1.211],
  [0.395, 1.226],
  [0.367, 1.235],
  [0.3585, 1.2405],
];

/** The rolled top seam. Stands ~0.02 proud of the neck. */
export const RIM_PROFILE: [number, number][] = [
  [0.3585, 1.2405],
  [0.37, 1.2455],
  [0.3775, 1.2545],
  [0.379, 1.265],
  [0.373, 1.274],
  [0.361, 1.279], // highest point of the can
  [0.348, 1.2775],
  [0.339, 1.2705],
  [0.3355, 1.26],
  [0.337, 1.25],
  [0.342, 1.243],
];

/** Recessed lid disc. */
export const LID_PROFILE: [number, number][] = [
  [0.342, 1.243],
  [0.333, 1.237],
  [0.318, 1.232],
  [0.28, 1.2285],
  [0.19, 1.2265],
  [0.095, 1.2275],
  [0.0, 1.2285],
];

/** Height of the lid surface — everything on the lid is placed against this. */
export const LID_Y = 1.2285;

/**
 * The lid pan is a shallow dish: ~1.2267 at the panel's outer edge, ~1.2285 at
 * the centre. These two heights place the scored panel flush inside that dish
 * and keep the score line reading on top of it at every stage of the press.
 */
export const PANEL_Y = 1.2258;
export const SCORE_Y = 1.2292;

/**
 * Printed sleeve.
 *
 * Runs almost the full sidewall, ending inside the straight section at both
 * ends. Its aspect matches LABEL_TEXTURE exactly so nothing is stretched around
 * the cylinder.
 */
export const LABEL = {
  bottom: -1.1,
  height: 2.0839,
  /** Fractionally proud of the aluminium, like a real printed sleeve. */
  radius: 0.5578,
} as const;

export function buildLathe(profile: [number, number][], segments = 160) {
  const points = profile.map(([x, y]) => new THREE.Vector2(x, y));
  const geometry = new THREE.LatheGeometry(points, segments);
  geometry.computeVertexNormals();
  return geometry;
}

/* ------------------------------------------------------------------ */
/* Lid hardware: stay-tab and scored opening panel                     */
/* ------------------------------------------------------------------ */

/**
 * Shapes are authored in the XY plane with the rivet at the origin, then
 * rotated onto the lid. `+Y` in shape space becomes `+Z` in the world, which is
 * the side the scored panel sits on — so the tab's nose points at the panel and
 * its finger opening points away from it, exactly like a real stay-tab.
 */
function layFlat(geometry: THREE.BufferGeometry, lift: number) {
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, lift, 0);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Modern stay-tab: a flat teardrop plate, narrow at the hinged rear where the
 * rivet holds it, widening to a rounded end with one oval finger opening.
 */
export function buildStayTab() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.082); // nose — this is what presses the scored panel
  shape.bezierCurveTo(0.03, 0.078, 0.041, 0.05, 0.042, 0.014);
  shape.bezierCurveTo(0.044, -0.03, 0.058, -0.07, 0.064, -0.115);
  shape.bezierCurveTo(0.069, -0.155, 0.058, -0.196, 0.02, -0.206);
  shape.bezierCurveTo(0.006, -0.209, -0.006, -0.209, -0.02, -0.206);
  shape.bezierCurveTo(-0.058, -0.196, -0.069, -0.155, -0.064, -0.115);
  shape.bezierCurveTo(-0.058, -0.07, -0.044, -0.03, -0.042, 0.014);
  shape.bezierCurveTo(-0.041, 0.05, -0.03, 0.078, 0, 0.082);

  const finger = new THREE.Path();
  finger.absellipse(0, -0.125, 0.036, 0.052, 0, Math.PI * 2, false, 0);
  shape.holes.push(finger);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.01,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 24,
    steps: 1,
  });
  layFlat(geometry, 0.014);
  // Sized against the lid: a real stay-tab spans a little over half the lid
  // diameter. Scaling in-plane leaves the plate's thickness alone.
  geometry.scale(1.15, 1, 1.15);
  geometry.computeVertexNormals();
  return geometry;
}

/** Outline of the scored opening panel, shared by the panel and its score line. */
function openingShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.02);
  shape.bezierCurveTo(0.03, 0.024, 0.052, 0.048, 0.06, 0.086);
  shape.bezierCurveTo(0.068, 0.126, 0.05, 0.166, 0.014, 0.174);
  shape.bezierCurveTo(0.005, 0.176, -0.005, 0.176, -0.014, 0.174);
  shape.bezierCurveTo(-0.05, 0.166, -0.068, 0.126, -0.06, 0.086);
  shape.bezierCurveTo(-0.052, 0.048, -0.03, 0.024, 0, 0.02);
  return shape;
}

/** The panel itself — sits flush with the lid until the tab presses on it. */
export function buildOpeningPanel() {
  const geometry = new THREE.ExtrudeGeometry(openingShape(), {
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 1,
    curveSegments: 24,
    steps: 1,
  });
  // Top face flush with the lid surface.
  return layFlat(geometry, 0.0015);
}

/** The score line: a hairline band following the panel's edge. */
export function buildScoreLine() {
  const outer = openingShape();
  const points = outer.getPoints(96);
  // Shrink about the panel's centroid to get the inner edge of the band.
  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  cx /= points.length;
  cy /= points.length;

  const inner = new THREE.Path(
    points.map((p) => new THREE.Vector2(cx + (p.x - cx) * 0.93, cy + (p.y - cy) * 0.93)),
  );
  const band = new THREE.Shape(points);
  band.holes.push(inner);

  const geometry = new THREE.ShapeGeometry(band, 24);
  // No lift: the score line is placed at SCORE_Y directly, and it stays with
  // the lid rather than travelling with the panel it outlines.
  return layFlat(geometry, 0);
}
