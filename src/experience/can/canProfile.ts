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

/**
 * Countersink ring only — the wall that drops from the rolled seam down to the
 * flat lid plate. The plate itself is no longer part of this lathe: it carries
 * a real drinking aperture, which a surface of revolution cannot express.
 */
export const LID_PROFILE: [number, number][] = [
  [0.342, 1.243],
  [0.333, 1.237],
  [0.318, 1.232],
  [0.3, 1.2298],
  [0.28, 1.2285],
];

/** Height of the lid surface — everything on the lid is placed against this. */
export const LID_Y = 1.2285;

/** Where the countersink hands over to the flat plate. */
export const LID_INNER_RADIUS = 0.28;
/** Sheet thickness. This is what the aperture's cut wall exposes. */
export const LID_THICKNESS = 0.011;

/**
 * Scored flap.
 *
 * The flap is a separate piece of sheet that plugs the aperture from just below
 * the lid surface. `PANEL_RECESS` is the step that reads as the score line while
 * the can is closed — deep enough to catch a shadow, shallow enough that it
 * never reads as a gap.
 */
export const PANEL_RECESS = 0.0018;
export const PANEL_THICKNESS = 0.005;

/**
 * The flap hinges on the aperture's near edge, so it swings down into the can
 * instead of sliding out of its own hole.
 */
export const APERTURE_HINGE_Z = 0.04;
/** Centre of the aperture along Z — the reference for scaling flap and score. */
const APERTURE_CENTRE_Z = 0.152;

/** Where the interior shell stops, just under the lid plate's underside. */
export const CAVITY_TOP_Y = 1.2185;

/* ---- stay-tab ---------------------------------------------------- */

export const TAB_THICKNESS = 0.008;
/** Standoff of the plate above the lid, as on a real end. */
export const TAB_PLATE_LIFT = 0.01;
/** Where the tab's formed nose starts to rise, measured from the rivet. */
export const TAB_FORM_START_Z = 0.01;
/**
 * Kept deliberately shallow. Enough form to read as a pressed plate and to hold
 * the nose off the lid for most of its travel; any more and the tab starts to
 * look bent rather than stamped.
 */
export const TAB_FORM_RISE = 0.2;

/** Full-lift tab angle, about the rivet. 0.55 rad = 31.5 degrees. */
export const TAB_MAX_ROTATION = 0.55;
/**
 * Flap travel once the score breaks. 1.15 rad = 66 degrees, far enough that the
 * flap clearly hangs inside the can rather than merely denting.
 */
export const PANEL_MAX_ROTATION = 1.15;

/**
 * How far the sealed flap bows *outward* under full tab tension, in radians.
 * A fifth of a degree — invisible as a pose, readable as pressure once the
 * strip light rakes across it, and it makes the snap that follows land.
 */
export const PANEL_PRELOAD = 0.0038;
/**
 * Normalised tab lift at which the nose has actually reached the flap. Below
 * this the aperture stays sealed, which is what keeps the closed state clean.
 */
export const PANEL_BREAK_AT = 0.42;

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
 * Modern stay-tab: a stamped teardrop plate with a narrow neck around the
 * rivet, a short solid nose over the aperture, and one oval finger opening.
 *
 * The plate is authored at final size — there is no post-scale, so the shape
 * coordinates below are directly comparable to the lid and aperture numbers.
 */
export function buildStayTab() {
  const shape = new THREE.Shape();
  // Short solid nose. This is the face that presses the scored flap.
  shape.moveTo(0, 0.105);
  shape.bezierCurveTo(0.02, 0.104, 0.034, 0.093, 0.04, 0.072);
  // Narrow neck, wrapping the rivet.
  shape.bezierCurveTo(0.046, 0.052, 0.052, 0.02, 0.052, -0.01);
  // Body opens out into the teardrop.
  shape.bezierCurveTo(0.052, -0.048, 0.072, -0.08, 0.08, -0.116);
  shape.bezierCurveTo(0.088, -0.156, 0.076, -0.212, 0.036, -0.236);
  shape.bezierCurveTo(0.022, -0.245, -0.022, -0.245, -0.036, -0.236);
  shape.bezierCurveTo(-0.076, -0.212, -0.088, -0.156, -0.08, -0.116);
  shape.bezierCurveTo(-0.072, -0.08, -0.052, -0.048, -0.052, -0.01);
  shape.bezierCurveTo(-0.052, 0.02, -0.046, 0.052, -0.04, 0.072);
  shape.bezierCurveTo(-0.034, 0.093, -0.02, 0.104, 0, 0.105);

  // One clean oval finger opening, set in the wide rear of the plate.
  const finger = new THREE.Path();
  finger.absellipse(0, -0.15, 0.044, 0.06, 0, Math.PI * 2, false, 0);
  shape.holes.push(finger);

  // The rivet passes through the plate; its head caps it from above.
  const rivetHole = new THREE.Path();
  rivetHole.absellipse(0, 0, 0.024, 0.024, 0, Math.PI * 2, false, 0);
  shape.holes.push(rivetHole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: TAB_THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.0022,
    bevelSize: 0.0022,
    bevelSegments: 2,
    curveSegments: 32,
    steps: 1,
  });
  layFlat(geometry, TAB_PLATE_LIFT);

  /*
   * Real stay-tabs are formed, not flat: the nose section rises away from the
   * lid. That form is load-bearing here — a perfectly flat plate pivoting about
   * the rivet would scythe straight through the solid lid between the rivet and
   * the aperture's near edge. Lifting the nose keeps the underside clear for the
   * whole of the tab's travel.
   */
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const z = position.getZ(i);
    if (z > TAB_FORM_START_Z) {
      position.setY(i, position.getY(i) + (z - TAB_FORM_START_Z) * TAB_FORM_RISE);
    }
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** The rivet: a fixed button on the lid. The tab turns around it. */
export function buildRivet() {
  return new THREE.CylinderGeometry(0.03, 0.024, 0.016, 24);
}

/**
 * The drinking aperture.
 *
 * Proportioned against the lid rather than picked by eye: the flat plate is
 * `LID_INNER_RADIUS * 2` across, and on a real end the opening runs a little
 * over 40% of that, from just clear of the rivet out to just short of the
 * countersink. Narrow at the rivet, widest two thirds of the way out.
 */
function apertureShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.04);
  shape.bezierCurveTo(0.042, 0.043, 0.08, 0.074, 0.093, 0.124);
  shape.bezierCurveTo(0.105, 0.168, 0.104, 0.216, 0.072, 0.248);
  shape.bezierCurveTo(0.048, 0.271, -0.048, 0.271, -0.072, 0.248);
  shape.bezierCurveTo(-0.104, 0.216, -0.105, 0.168, -0.093, 0.124);
  shape.bezierCurveTo(-0.08, 0.074, -0.042, 0.043, 0, 0.04);
  return shape;
}

/** Scale an aperture outline about its own centre, not about the rivet. */
function scaledAperture(k: number) {
  return apertureShape()
    .getPoints(128)
    .map(
      (p) =>
        new THREE.Vector2(p.x * k, APERTURE_CENTRE_Z + (p.y - APERTURE_CENTRE_Z) * k),
    );
}

/**
 * The flat lid plate, with the aperture as a genuine hole.
 *
 * Extruding a shape that carries a `holes` path gives real negative space, and
 * the extrusion's side walls become the aperture's cut edge and the visible
 * sheet thickness — no boolean operation, no decal, no polygon offset. The two
 * material groups `ExtrudeGeometry` emits are used to give that cut edge its own
 * brighter aluminium.
 */
export function buildLidTop() {
  const plate = new THREE.Shape();
  plate.absarc(0, 0, LID_INNER_RADIUS, 0, Math.PI * 2, false);
  plate.holes.push(new THREE.Path(apertureShape().getPoints(128)));

  const geometry = new THREE.ExtrudeGeometry(plate, {
    depth: LID_THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.0009,
    bevelSize: 0.0009,
    bevelSegments: 2,
    curveSegments: 128,
    steps: 1,
  });
  return layFlat(geometry, 0);
}

/**
 * The scored flap.
 *
 * Very slightly smaller than the aperture so its wall never lands coincident
 * with the lid's cut edge, and hinged on the aperture's near edge so it folds
 * down into the can rather than sliding out of its own opening.
 */
export function buildPanelFlap() {
  const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(scaledAperture(0.988)), {
    depth: PANEL_THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.0006,
    bevelSize: 0.0006,
    bevelSegments: 1,
    curveSegments: 128,
    steps: 1,
  });
  layFlat(geometry, 0);
  geometry.translate(0, 0, -APERTURE_HINGE_Z);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Score line: a hairline band tracing the aperture on the lid surface. It is a
 * remnant of the score, not the opening — the opening is the hole in the plate.
 */
export function buildScoreRing() {
  const band = new THREE.Shape(scaledAperture(1.035));
  band.holes.push(new THREE.Path(scaledAperture(1.004)));
  return layFlat(new THREE.ShapeGeometry(band, 24), 0);
}

/**
 * The inside of the can, seen through the aperture once the flap folds in.
 *
 * This is the body and base profiles inset by a wall thickness, not a cylinder
 * parked under the lid. That distinction is the whole point: a short cylinder
 * puts a lit surface a few hundredths behind the opening, which reads as a grey
 * plate rather than as a hole. Following the real profile gives a ray leaving
 * the aperture the full depth of the can to travel before it hits anything.
 */
export function buildCavityShell() {
  const INSET = 0.01;
  const profile: [number, number][] = [];
  for (const [r, y] of BASE_PROFILE) profile.push([Math.max(0, r - INSET), y + INSET]);
  for (const [r, y] of BODY_PROFILE) profile.push([Math.max(0, r - INSET), y]);
  // Stop below the lid plate so the shell can never poke through it.
  return buildLathe(
    profile.filter(([, y]) => y <= CAVITY_TOP_Y),
    96,
  );
}
