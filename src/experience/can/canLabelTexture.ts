import * as THREE from 'three';
import { FLAVORS, type FlavorId } from '../../config/flavors';
import { GLOBAL } from '../../config/colors';
import { COPY } from '../../config/copy';
import {
  LYRA_WORDMARK_HEIGHT,
  LYRA_WORDMARK_PATH,
  LYRA_WORDMARK_RATIO,
  LYRA_WORDMARK_WIDTH,
} from '../../config/wordmark';

/**
 * Procedural can artwork. Nothing here is an image asset — the label is drawn
 * with Canvas2D, which is also why swapping flavors costs nothing but a texture
 * pointer.
 *
 * Three maps come out of one drawing pass:
 *
 *   - **colour**    what is printed;
 *   - **roughness** how it catches light. This is where the printed coating and
 *     the foil separate: the ground is a matte-ish coating, the wordmark and the
 *     flavour signature are polished;
 *   - **metalness** which parts are foil and which are ink. This is what makes
 *     the wordmark behave like pearl foil that responds to the strip lights and
 *     the camera angle, rather than white paint with a glow painted under it.
 *
 * The colour ground is the flavor's own body colour, so the printed sleeve and
 * the bare aluminium above and below it are the same tone and the sleeve edge
 * does not read as a seam across the can.
 *
 * Canvas aspect matches the unwrapped label band exactly (see LABEL in
 * canProfile.ts), so nothing is stretched around the cylinder.
 *
 * ## The packaging system
 *
 * The three flavors share ~80% of their language and differ only in a base tint
 * and one signature graphic in the lower third:
 *
 *   - identical ground treatment, identical hierarchy;
 *   - the **canonical LYRA vector** (config/wordmark.ts), vertical, pearl foil,
 *     identical scale and placement on all three. It is the dominant element;
 *   - `NAME / NN` near the top, `COSMIC ENERGY · 355 ML` near the bottom, both
 *     in the existing mono face — the wordmark is never used for micro labels;
 *   - one flavour signature, and only one. It replaced the old diagonal foil
 *     band rather than being added alongside it, so there is no second
 *     competing accent system.
 *
 * Everything is drawn from literal coordinates. There is no randomness anywhere
 * in this file, seeded or otherwise, so every reload produces identical bytes.
 */

export const LABEL_TEXTURE_WIDTH = 2048;
export const LABEL_TEXTURE_HEIGHT = 1218;

/** Per-flavor packaging. Same geometry and hierarchy, three real variants. */
interface FlavorSpec {
  /** Body colour the print sits on — matches the aluminium exactly. */
  ground: string;
  /** Secondary reflection tint, used in the ground's brushed variation. */
  groundTint: string;
  /** Signature ramp, dark → mid → bright. */
  accent: [string, string, string];
  /** Tonal field under the signature — the base tint, at printing strength. */
  field: string;
  /** Tint folded into the extremes of the wordmark's pearl gradient. */
  letterTint: string;
}

const SPEC: Record<FlavorId, FlavorSpec> = {
  nova: {
    // Near-black, restrained dark cobalt.
    ground: '#050512',
    groundTint: '#131140',
    accent: ['#1A2FB4', '#4053E8', '#93A2F5'],
    field: '#16227A',
    letterTint: '#CBD2F0',
  },
  comet: {
    // Near-black, restrained deep teal/navy.
    ground: '#020E14',
    groundTint: '#063243',
    accent: ['#046E86', '#12B6D8', '#93F0FF'],
    field: '#054A5E',
    letterTint: '#C2E6F0',
  },
  void: {
    // Near-black, restrained black-plum. The quietest of the three.
    ground: '#110412',
    groundTint: '#340937',
    accent: ['#43105A', '#7B1FAE', '#C94FE0'],
    field: '#3E0949',
    letterTint: '#E2C7EA',
  },
};

type Pass = 'color' | 'roughness' | 'metalness';

/**
 * Material identity of every mark on the sleeve, in one table.
 *
 * Roughness and metalness are what separate a printed coating from foil, and
 * keeping them here rather than inline is what stops the two maps drifting out
 * of agreement with each other.
 *
 * Values are 0..255 greyscale: roughness 0 = mirror, 255 = matte.
 */
const MATERIAL = {
  /** The printed body coating. Deliberately not very metallic. */
  ground: { roughness: 0x6e, metalness: 0x38 },
  /** Pearl foil. The wordmark, and nothing else, gets this. */
  foil: { roughness: 0x2a, metalness: 0xf2 },
  /** Flavour signature: foil, a step less polished than the wordmark. */
  signature: { roughness: 0x38, metalness: 0xe0 },
  /** Mono microtype — printed ink, barely metallic. */
  ink: { roughness: 0x5a, metalness: 0x30 },
} as const;

const grey = (v: number) => `#${v.toString(16).padStart(2, '0').repeat(3)}`;

/** Resolve the fill for a mark, given the pass being drawn. */
function passFill(pass: Pass, colour: string, material: { roughness: number; metalness: number }) {
  if (pass === 'color') return colour;
  return grey(pass === 'roughness' ? material.roughness : material.metalness);
}

/** Draw text with real letter-spacing, centred on `cx`. Returns total width. */
function trackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  tracking: number,
) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let x = cx - total / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, y);
    x += widths[i] + tracking;
  }
  return total;
}

/* ------------------------------------------------------------------ */
/* Brand mark                                                          */
/* ------------------------------------------------------------------ */

/** The wordmark's length as a fraction of the label height. */
// 0.64 of the label height. Raised from 0.60 when the mark was re-traced from
// the approved artwork: the real wordmark is 5.2646:1 where the old
// reconstruction was 4.41:1, so at equal length it sits ~19% narrower across
// the can. This is a uniform scale on the canonical artwork — never a stretch
// — and it keeps the mark clear of both the signature and the microcopy.
const BRAND_LENGTH = 0.64;
/**
 * Where the wordmark's centre sits on the sleeve.
 *
 * Raised off dead centre on purpose. The flavour signature owns the lower
 * third, and a centred mark of this length would have the signature running
 * straight through the L. Lifting it to 0.45 hands the two of them separate
 * zones — which is also why there is no need to fade or interrupt either one.
 */
const BRAND_CENTRE = 0.45;

/**
 * The canonical LYRA vector, rotated onto the can's axis.
 *
 * This is the *same path* the DOM renders — placement is a transform of the
 * canonical artwork, never a redraw and never a re-typesetting. `Path2D` is
 * used rather than loading the SVG as an `Image` on purpose: it is synchronous,
 * so a flavour swap can never show a frame with the mark missing.
 */
function drawWordmark(ctx: CanvasRenderingContext2D, spec: FlavorSpec, pass: Pass) {
  const w = LABEL_TEXTURE_WIDTH;
  const h = LABEL_TEXTURE_HEIGHT;
  const length = h * BRAND_LENGTH;
  const scale = length / LYRA_WORDMARK_WIDTH;

  ctx.save();
  ctx.translate(w * 0.5, h * BRAND_CENTRE);
  // -90° puts the word's baseline along the can's axis, reading upward.
  ctx.rotate(-Math.PI / 2);
  ctx.scale(scale, scale);
  ctx.translate(-LYRA_WORDMARK_WIDTH / 2, -LYRA_WORDMARK_HEIGHT / 2);

  if (pass === 'color') {
    // Warm silver → pearl white → warm silver, with the flavour tint only at
    // the extremes. A reflection ramp, not a colour wash, and no glow: the
    // brightness on the can comes from the strip lights hitting the foil.
    const g = ctx.createLinearGradient(0, 0, LYRA_WORDMARK_WIDTH, 0);
    g.addColorStop(0, spec.letterTint);
    g.addColorStop(0.2, '#E6E0D4');
    g.addColorStop(0.44, '#FFFDF8');
    g.addColorStop(0.6, '#F5F0E6');
    g.addColorStop(0.82, '#DCD5C7');
    g.addColorStop(1, spec.letterTint);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = passFill(pass, '', MATERIAL.foil);
  }

  // Even-odd, for the same reason the DOM path uses it: the winding that came
  // out of the trace is arbitrary and nonzero would fill the A's counter.
  ctx.fill(new Path2D(LYRA_WORDMARK_PATH), 'evenodd');
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Flavour signatures — one graphic each, lower third                  */
/* ------------------------------------------------------------------ */

/**
 * The tonal field every signature sits on.
 *
 * This is the flavour's base tint at printing strength, confined to the lower
 * third and falling to nothing well before the wordmark. It is what carries the
 * variant's identity across the surface without a second graphic; the signature
 * on top of it is the sharp part.
 */
function drawField(ctx: CanvasRenderingContext2D, spec: FlavorSpec, top: number, strength: number) {
  const w = LABEL_TEXTURE_WIDTH;
  const h = LABEL_TEXTURE_HEIGHT;
  const peak = Math.round(strength * 255).toString(16).padStart(2, '0');
  const g = ctx.createLinearGradient(0, top, 0, h);
  g.addColorStop(0, `${spec.field}00`);
  g.addColorStop(0.72, `${spec.field}${peak}`);
  g.addColorStop(1, `${spec.field}00`);
  ctx.fillStyle = g;
  ctx.fillRect(0, top, w, h - top);
}

/**
 * Build a filled ribbon through fractional coordinates, with a per-vertex half
 * width so the mark can taper.
 *
 * A constant-width stroke reads as a drawn line; a fracture has to open and
 * close. Offsets are taken perpendicular to the average of the two adjoining
 * segments, which keeps the outer corners sharp at the jogs.
 */
function taperedPath(pts: [number, number, number][]): Path2D {
  const w = LABEL_TEXTURE_WIDTH;
  const h = LABEL_TEXTURE_HEIGHT;
  const px = pts.map(([x, y]) => [x * w, y * h] as [number, number]);
  const normals: [number, number][] = px.map((_, i) => {
    const prev = px[Math.max(0, i - 1)];
    const next = px[Math.min(px.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  });
  const path = new Path2D();
  px.forEach(([x, y], i) => {
    const [nx, ny] = normals[i];
    const hw = pts[i][2];
    const ox = x + nx * hw;
    const oy = y + ny * hw;
    if (i === 0) path.moveTo(ox, oy);
    else path.lineTo(ox, oy);
  });
  for (let i = px.length - 1; i >= 0; i--) {
    const [x, y] = px[i];
    const [nx, ny] = normals[i];
    const hw = pts[i][2];
    path.lineTo(x - nx * hw, y - ny * hw);
  }
  path.closePath();
  return path;
}

/**
 * NOVA — the ignition fracture.
 *
 * One controlled diagonal break through the lower third, with two short spurs.
 * Irregular but designed: every vertex is a literal below, so it is the same
 * fracture on every render. Sharp mitres, no rounding — this is a break, not a
 * lightning bolt, and there are deliberately no disconnected shards.
 */
const NOVA_FRACTURE: [number, number, number][] = [
  [0.2, 0.722, 3],
  [0.335, 0.8, 30],
  [0.395, 0.762, 38],
  [0.53, 0.852, 36],
  [0.585, 0.818, 30],
  [0.7, 0.898, 20],
  [0.79, 0.93, 3],
];
/** One spur, off the fracture's first jog. Two would read as shards. */
const NOVA_SPUR: [number, number, number][] = [
  [0.335, 0.802, 15],
  [0.29, 0.752, 9],
  [0.264, 0.72, 2],
];

/**
 * COMET — the swept trajectory.
 *
 * One aerodynamic arc, drawn as a filled ribbon rather than a stroke so it can
 * taper: thick at the leading end, vanishing into the tail. Behind it, a single
 * restrained secondary line and a sparse particulate continuation. Smoother and
 * faster than NOVA by construction — one curve, no vertices.
 */
function cometArc(t: number): [number, number] {
  // Quadratic through (0.16,0.745) → control (0.52,0.94) → (0.86,0.80).
  const u = 1 - t;
  const x = u * u * 0.16 + 2 * u * t * 0.52 + t * t * 0.86;
  const y = u * u * 0.745 + 2 * u * t * 0.94 + t * t * 0.8;
  return [x, y];
}

const COMET_PARTICLES: [number, number, number][] = [
  [0.125, 0.734, 6],
  [0.098, 0.726, 5],
  [0.072, 0.72, 4],
  [0.142, 0.751, 4.5],
  [0.115, 0.761, 3.5],
  [0.052, 0.713, 3],
  [0.161, 0.767, 3],
];

/**
 * VOID — the broken orbital band.
 *
 * An eclipse band whose centre sits below the sleeve, so only its upper arc
 * crosses the lower third. Two deliberate interruptions break the ring — the
 * negative space is the point, and it is what stops it reading as a centred
 * circle. Quieter and darker than the other two.
 */
const VOID_ARCS: [number, number][] = [
  // [start, end] in radians on the ellipse. The gaps between them are the cut.
  [Math.PI * 1.05, Math.PI * 1.42],
  [Math.PI * 1.5, Math.PI * 1.83],
  [Math.PI * 1.9, Math.PI * 1.985],
];

function drawSignature(ctx: CanvasRenderingContext2D, flavor: FlavorId, pass: Pass) {
  const w = LABEL_TEXTURE_WIDTH;
  const h = LABEL_TEXTURE_HEIGHT;
  const spec = SPEC[flavor];

  // The tonal field is printed colour only — it must not read as foil.
  if (pass === 'color') {
    drawField(ctx, spec, h * 0.52, flavor === 'void' ? 0.13 : 0.16);
  }

  ctx.save();

  if (flavor === 'nova') {
    const g = ctx.createLinearGradient(w * 0.14, 0, w * 0.87, 0);
    g.addColorStop(0, `${spec.accent[0]}00`);
    g.addColorStop(0.16, spec.accent[0]);
    g.addColorStop(0.52, spec.accent[1]);
    g.addColorStop(0.84, spec.accent[2]);
    g.addColorStop(1, `${spec.accent[2]}00`);
    ctx.fillStyle = pass === 'color' ? g : passFill(pass, '', MATERIAL.signature);
    ctx.fill(taperedPath(NOVA_FRACTURE));
    // The spur is thinner and dies out, so the break has a hierarchy rather
    // than reading as one uniform zigzag.
    ctx.fill(taperedPath(NOVA_SPUR));
  } else if (flavor === 'comet') {
    // Tapered ribbon: sample the curve, offset perpendicular by a width that
    // falls away toward the tail, and fill the resulting outline.
    const STEPS = 96;
    const top: [number, number][] = [];
    const bottom: [number, number][] = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const [x, y] = cometArc(t);
      const [xn, yn] = cometArc(Math.min(1, t + 0.002));
      const dx = (xn - x) * w;
      const dy = (yn - y) * h;
      const len = Math.hypot(dx, dy) || 1;
      // Leading end thick, tail thin.
      const half = (8 + 58 * Math.pow(t, 1.25)) / 2;
      const nx = (-dy / len) * half;
      const ny = (dx / len) * half;
      top.push([x * w + nx, y * h + ny]);
      bottom.push([x * w - nx, y * h - ny]);
    }
    ctx.beginPath();
    ctx.moveTo(top[0][0], top[0][1]);
    for (const p of top) ctx.lineTo(p[0], p[1]);
    for (let i = bottom.length - 1; i >= 0; i--) ctx.lineTo(bottom[i][0], bottom[i][1]);
    ctx.closePath();
    if (pass === 'color') {
      const g = ctx.createLinearGradient(w * 0.11, 0, w * 0.89, 0);
      g.addColorStop(0, `${spec.accent[0]}00`);
      g.addColorStop(0.22, spec.accent[0]);
      g.addColorStop(0.62, spec.accent[1]);
      g.addColorStop(0.94, spec.accent[2]);
      g.addColorStop(1, `${spec.accent[2]}00`);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = passFill(pass, '', MATERIAL.signature);
    }
    ctx.fill();

    // One restrained secondary line, riding just above the main arc.
    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const [x, y] = cometArc(t);
      const px = x * w;
      const py = y * h - 30 - 8 * t;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineWidth = 5;
    ctx.strokeStyle =
      pass === 'color' ? `${spec.accent[2]}77` : passFill(pass, '', MATERIAL.signature);
    ctx.stroke();

    // Sparse particulate continuation off the tail. Fixed positions.
    ctx.fillStyle =
      pass === 'color' ? `${spec.accent[1]}CC` : passFill(pass, '', MATERIAL.signature);
    for (const [x, y, r] of COMET_PARTICLES) {
      ctx.beginPath();
      ctx.ellipse(x * w, y * h, r * 1.7, r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const cx = w * 0.5;
    const cy = h * 1.02;
    const rx = w * 0.29;
    const ry = h * 0.235;
    ctx.lineWidth = 46;
    ctx.lineCap = 'butt';
    if (pass === 'color') {
      const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      g.addColorStop(0, spec.accent[0]);
      g.addColorStop(0.42, spec.accent[1]);
      // One controlled magenta highlight, not a magenta band.
      g.addColorStop(0.68, spec.accent[2]);
      g.addColorStop(0.86, spec.accent[1]);
      g.addColorStop(1, spec.accent[0]);
      ctx.strokeStyle = g;
    } else {
      ctx.strokeStyle = passFill(pass, '', MATERIAL.signature);
    }
    for (const [from, to] of VOID_ARCS) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, from, to);
      ctx.stroke();
    }
    // A single inner hairline picks the band's leading edge out of the black.
    ctx.lineWidth = 4;
    ctx.strokeStyle =
      pass === 'color' ? `${spec.accent[2]}66` : passFill(pass, '', MATERIAL.signature);
    for (const [from, to] of VOID_ARCS) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry - 34, 0, from, to);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Back-of-can gloss                                                   */
/* ------------------------------------------------------------------ */

/**
 * Lyra, drawn as lines only — no star dots.
 *
 * Sits opposite the wordmark: half at each edge of the texture, so the figure
 * joins across the seam on the *back* of the can. It exists in the roughness map
 * alone, which is what makes it black on black until a highlight rakes across.
 * It is never in frame at the same time as the wordmark.
 */
const LYRA_FIGURE: [number, number][] = [
  [0.5, 0.18],
  [0.2, 0.31],
  [0.59, 0.4],
  [0.87, 0.62],
  [0.5, 0.78],
  [0.13, 0.63],
];
const LYRA_LINKS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 5],
  [5, 4],
  [4, 3],
  [3, 2],
];

function drawConstellationGloss(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const boxW = w * 0.3;
  const boxH = h * 0.62;
  const top = (h - boxH) / 2;

  for (const originX of [-boxW / 2, w - boxW / 2]) {
    ctx.beginPath();
    for (const [a, b] of LYRA_LINKS) {
      const pa = LYRA_FIGURE[a];
      const pb = LYRA_FIGURE[b];
      ctx.moveTo(originX + pa[0] * boxW, top + pa[1] * boxH);
      ctx.lineTo(originX + pb[0] * boxW, top + pb[1] * boxH);
    }
    ctx.stroke();
  }
}

/* ------------------------------------------------------------------ */

function drawLabel(ctx: CanvasRenderingContext2D, flavor: FlavorId, pass: Pass) {
  const w = LABEL_TEXTURE_WIDTH;
  const h = LABEL_TEXTURE_HEIGHT;
  const cfg = FLAVORS[flavor];
  const spec = SPEC[flavor];

  /* ---- ground ----------------------------------------------------- */
  if (pass === 'color') {
    ctx.fillStyle = spec.ground;
    ctx.fillRect(0, 0, w, h);
    // Vertical brushed variation carrying the secondary reflection tint. This
    // is the only place groundTint appears in the print.
    const brush = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const a = 0.028 + 0.028 * Math.sin(t * 41.3) * Math.cos(t * 17.7);
      const hex = Math.round(Math.max(0, a) * 255)
        .toString(16)
        .padStart(2, '0');
      brush.addColorStop(t, `${spec.groundTint}${hex}`);
    }
    ctx.fillStyle = brush;
    ctx.fillRect(0, 0, w, h);
  } else if (pass === 'roughness') {
    ctx.fillStyle = grey(MATERIAL.ground.roughness);
    ctx.fillRect(0, 0, w, h);
    // Fine vertical brush streaks in the coating.
    ctx.save();
    ctx.globalAlpha = 0.42;
    for (let x = 0; x < w; x += 3) {
      const v = MATERIAL.ground.roughness + Math.round(Math.sin(x * 0.7) * 5 + Math.sin(x * 0.13) * 6);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, 0, 2, h);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = grey(MATERIAL.ground.metalness);
    ctx.fillRect(0, 0, w, h);
  }

  /* ---- black-on-black constellation, roughness only ---------------- */
  if (pass === 'roughness') {
    ctx.save();
    // Barely above the satin ground: a spot-gloss, not a graphic.
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.26)';
    ctx.lineWidth = 6;
    drawConstellationGloss(ctx, w, h);
    ctx.restore();
  }

  /* ---- the flavour signature --------------------------------------- */
  drawSignature(ctx, flavor, pass);

  /* ---- LYRA: the canonical vector, on the can's axis ---------------- */
  drawWordmark(ctx, spec, pass);

  /* ---- flavour code, upper area ------------------------------------ */
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '500 34px "Geist Mono", monospace';
  ctx.fillStyle = passFill(pass, GLOBAL.offWhite, MATERIAL.ink);
  const codeY = h * 0.115;
  const codeWidth = trackedText(ctx, cfg.code, w * 0.5, codeY, 14);

  // A single accent tick, in the flavor's brightest signature colour.
  ctx.fillStyle = passFill(pass, spec.accent[2], MATERIAL.signature);
  ctx.fillRect(w * 0.5 - codeWidth / 2 - 30, codeY - 11, 5, 22);
  ctx.restore();

  /* ---- technical microcopy, printed once ---------------------------- */
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '400 22px "Geist Mono", monospace';
  ctx.fillStyle = passFill(pass, 'rgba(242, 239, 231, 0.66)', MATERIAL.ink);
  trackedText(ctx, COPY.label.microcopy, w * 0.5, h * 0.955, 6);
  ctx.restore();
}

function renderPass(flavor: FlavorId, pass: Pass): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_TEXTURE_WIDTH;
  canvas.height = LABEL_TEXTURE_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  drawLabel(ctx, flavor, pass);
  return canvas;
}

export interface LabelTextureSet {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
}

export function createLabelTextures(flavor: FlavorId, anisotropy: number): LabelTextureSet {
  const map = new THREE.CanvasTexture(renderPass(flavor, 'color'));
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = anisotropy;
  map.wrapS = THREE.RepeatWrapping;

  /*
   * Data maps run at **full resolution**, not half.
   *
   * They used to be halved on the grounds that they encode little. That was
   * true when the only hard-edged thing in them was a diagonal band. It is not
   * true now: the boundary between pearl foil and printed coating *is* the
   * wordmark's outline, and softening that boundary by 2x makes the mark read
   * as painted rather than foiled at exactly the moment the can is closest to
   * camera.
   */
  const roughnessMap = new THREE.CanvasTexture(renderPass(flavor, 'roughness'));
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = anisotropy;
  roughnessMap.wrapS = THREE.RepeatWrapping;

  const metalnessMap = new THREE.CanvasTexture(renderPass(flavor, 'metalness'));
  metalnessMap.colorSpace = THREE.NoColorSpace;
  metalnessMap.anisotropy = anisotropy;
  metalnessMap.wrapS = THREE.RepeatWrapping;

  return { map, roughnessMap, metalnessMap };
}

export function disposeLabelTextures(set: LabelTextureSet) {
  set.map.dispose();
  set.roughnessMap.dispose();
  set.metalnessMap.dispose();
}

/** Body colours, shared with CanModel so print and bare metal stay identical. */
export function bodyColours(flavor: FlavorId) {
  return { base: SPEC[flavor].ground, tint: SPEC[flavor].groundTint };
}

/**
 * The wordmark's aspect, re-exported so callers that need to reserve space for
 * it do not have to import the artwork module directly.
 */
export const WORDMARK_RATIO = LYRA_WORDMARK_RATIO;

/**
 * Vertical brushed-metal roughness for the bare aluminium.
 *
 * Lathe UVs run u around the circumference and v along the profile, so
 * variation in u alone produces streaks that run down the can's axis. One pixel
 * of height is all that needs to exist — the sampler repeats it.
 */
export function createBrushedRoughness(anisotropy: number): THREE.CanvasTexture {
  const width = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  // Base ~0.29 roughness, with a fine grain either side of it.
  for (let x = 0; x < width; x++) {
    const grain =
      Math.sin(x * 0.9) * 5 +
      Math.sin(x * 0.17 + 1.7) * 7 +
      Math.sin(x * 2.3 + 0.4) * 3;
    const v = Math.max(0, Math.min(255, Math.round(74 + grain)));
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, 0, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  return texture;
}
