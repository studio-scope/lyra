import * as THREE from 'three';
import { FLAVORS, type FlavorId } from '../../config/flavors';
import { GLOBAL } from '../../config/colors';
import { COPY } from '../../config/copy';

/**
 * Procedural can artwork. Nothing here is an image asset — the label is drawn
 * with Canvas2D, which is also why swapping flavors costs nothing but a texture
 * pointer.
 *
 * Three maps come out of one drawing pass:
 *
 *   - **colour**    what is printed;
 *   - **roughness** how it catches light. The foil band and the black-on-black
 *     constellation live almost entirely here;
 *   - **metalness** which parts are foil and which are ink. This is what makes
 *     the band behave like a metallic packaging material that responds to the
 *     lights and the camera angle, rather than an emissive stripe that glows on
 *     its own.
 *
 * The colour ground is the flavor's own body colour, so the printed sleeve and
 * the bare aluminium above and below it are the same tone and the sleeve edge
 * does not read as a seam across the can.
 *
 * Canvas aspect matches the unwrapped label band exactly (see LABEL in
 * canProfile.ts), so nothing is stretched around the cylinder.
 */

export const LABEL_TEXTURE_WIDTH = 2048;
export const LABEL_TEXTURE_HEIGHT = 1218;

/** Per-flavor packaging. Same geometry and hierarchy, three real variants. */
interface FoilSpec {
  /** Body colour the print sits on — matches the aluminium exactly. */
  ground: string;
  /** Secondary reflection tint, used in the ground's brushed variation. */
  groundTint: string;
  /** Foil ramp, dark → bright. */
  foil: [string, string, string];
  /** Band angle in degrees. Negative leans up to the right. */
  angle: number;
  /** Band thickness in texture pixels. */
  band: number;
  /** Fraction of the circumference the band wraps across. */
  wrap: number;
  /** Tint mixed into the LYRA lettering. */
  letterTint: string;
}

const FOIL: Record<FlavorId, FoilSpec> = {
  nova: {
    ground: '#09071B',
    groundTint: '#151142',
    foil: ['#2342FF', '#6B3DFF', '#A56BFF'],
    angle: -22,
    band: 96,
    wrap: 0.66,
    letterTint: '#CFC6F2',
  },
  comet: {
    ground: '#03161D',
    groundTint: '#063C49',
    foil: ['#046A72', '#0B7CFF', '#00D9FF'],
    // Sharper and thinner: COMET should read as the fastest of the three.
    angle: -32,
    band: 78,
    wrap: 0.6,
    letterTint: '#C4E7F2',
  },
  void: {
    ground: '#160619',
    groundTint: '#3B0A3F',
    foil: ['#5B146D', '#7127FF', '#D628FF'],
    // Shallower and wider: VOID sits heaviest.
    angle: -18,
    band: 132,
    wrap: 0.72,
    letterTint: '#E4C9EC',
  },
};

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

function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  const chars = [...text];
  return chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + tracking * (chars.length - 1);
}

/* ------------------------------------------------------------------ */
/* Brand lettering                                                     */
/* ------------------------------------------------------------------ */

const BRAND_TRACKING = -0.075;
/** LYRA's length as a fraction of the label height. */
const BRAND_LENGTH = 0.61;

function brandFont(size: number) {
  return `700 ${size}px Syncopate, "Geist Sans", sans-serif`;
}

/** Resolve the font size that makes LYRA exactly `targetLength` long. */
function fitBrand(ctx: CanvasRenderingContext2D, targetLength: number) {
  const probe = 200;
  ctx.font = brandFont(probe);
  const measured = trackedWidth(ctx, COPY.brand, probe * BRAND_TRACKING);
  if (measured <= 0) return probe;
  return Math.round((probe * targetLength) / measured);
}

/**
 * The diagonal foil band.
 *
 * Returns the line endpoints so the colour pass can build a gradient along the
 * exact same axis the other passes stroke.
 */
function foilBandLine(spec: FoilSpec, w: number, h: number) {
  const rad = (spec.angle * Math.PI) / 180;
  const length = w * spec.wrap;
  const cx = w * 0.5;
  // Sits below the wordmark's lower edge, so the band reads as a band rather
  // than as a stripe drawn through the letters.
  const cy = h * 0.8;
  const dx = (Math.cos(rad) * length) / 2;
  const dy = (Math.sin(rad) * length) / 2;
  return { x0: cx - dx, y0: cy - dy, x1: cx + dx, y1: cy + dy };
}

/**
 * Lyra, drawn as lines only — no star dots.
 *
 * Sits opposite the wordmark: half at each edge of the texture, so the figure
 * joins across the seam on the back of the can. It exists in the roughness map
 * alone, which is what makes it black on black until a highlight rakes across.
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

type Pass = 'color' | 'roughness' | 'metalness';

function drawLabel(ctx: CanvasRenderingContext2D, flavor: FlavorId, pass: Pass) {
  const w = LABEL_TEXTURE_WIDTH;
  const h = LABEL_TEXTURE_HEIGHT;
  const cfg = FLAVORS[flavor];
  const spec = FOIL[flavor];

  /* ---- ground ----------------------------------------------------- */
  if (pass === 'color') {
    ctx.fillStyle = spec.ground;
    ctx.fillRect(0, 0, w, h);
    // Vertical brushed variation carrying the secondary reflection tint. This
    // is the only place groundTint appears in the print.
    const brush = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const a = 0.05 + 0.05 * Math.sin(t * 41.3) * Math.cos(t * 17.7);
      const hex = Math.round(Math.max(0, a) * 255)
        .toString(16)
        .padStart(2, '0');
      brush.addColorStop(t, `${spec.groundTint}${hex}`);
    }
    ctx.fillStyle = brush;
    ctx.fillRect(0, 0, w, h);
  } else if (pass === 'roughness') {
    // Satin aluminium base: ~0.30 on a 0..1 scale.
    ctx.fillStyle = '#4D4D4D';
    ctx.fillRect(0, 0, w, h);
    // Fine vertical brush streaks.
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let x = 0; x < w; x += 3) {
      const v = 70 + Math.round(Math.sin(x * 0.7) * 5 + Math.sin(x * 0.13) * 6);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, 0, 2, h);
    }
    ctx.restore();
  } else {
    // Printed ink over metal: metallic, but not foil.
    ctx.fillStyle = '#5E5E5E';
    ctx.fillRect(0, 0, w, h);
  }

  /* ---- black-on-black constellation, roughness only ---------------- */
  if (pass === 'roughness') {
    ctx.save();
    // Barely above the satin ground: a spot-gloss, not a graphic.
    ctx.strokeStyle = 'rgba(96, 96, 96, 0.32)';
    ctx.lineWidth = 6;
    drawConstellationGloss(ctx, w, h);
    ctx.restore();
  }

  /* ---- foil band --------------------------------------------------- */
  const line = foilBandLine(spec, w, h);
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(line.x0, line.y0);
  ctx.lineTo(line.x1, line.y1);
  ctx.lineWidth = spec.band;
  if (pass === 'color') {
    const g = ctx.createLinearGradient(line.x0, line.y0, line.x1, line.y1);
    g.addColorStop(0, `${spec.foil[0]}00`);
    g.addColorStop(0.18, spec.foil[0]);
    g.addColorStop(0.5, spec.foil[1]);
    g.addColorStop(0.8, spec.foil[2]);
    g.addColorStop(1, `${spec.foil[2]}00`);
    ctx.strokeStyle = g;
  } else if (pass === 'roughness') {
    // Foil is markedly smoother than the print around it.
    ctx.strokeStyle = '#1F1F1F';
  } else {
    ctx.strokeStyle = '#FFFFFF';
  }
  ctx.stroke();

  // A hairline along the band's upper edge sharpens it.
  ctx.beginPath();
  ctx.moveTo(line.x0, line.y0 - spec.band / 2);
  ctx.lineTo(line.x1, line.y1 - spec.band / 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle =
    pass === 'color' ? `${spec.foil[2]}CC` : pass === 'roughness' ? '#141414' : '#FFFFFF';
  ctx.stroke();
  ctx.restore();

  /* ---- LYRA: one word, rotated 90 degrees -------------------------- */
  ctx.save();
  ctx.translate(w * 0.5, h * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const targetLength = h * BRAND_LENGTH;
  const fontSize = fitBrand(ctx, targetLength);
  ctx.font = brandFont(fontSize);
  const tracking = fontSize * BRAND_TRACKING;

  if (pass === 'color') {
    // Satin silver with the flavor's foil tint folded in — a reflection, not a
    // colour wash.
    const foilGrad = ctx.createLinearGradient(-targetLength / 2, 0, targetLength / 2, 0);
    foilGrad.addColorStop(0, spec.letterTint);
    foilGrad.addColorStop(0.26, GLOBAL.offWhite);
    foilGrad.addColorStop(0.5, '#FFFFFF');
    foilGrad.addColorStop(0.72, GLOBAL.offWhite);
    foilGrad.addColorStop(1, spec.letterTint);
    ctx.fillStyle = foilGrad;
  } else if (pass === 'roughness') {
    ctx.fillStyle = '#2E2E2E';
  } else {
    ctx.fillStyle = '#CCCCCC';
  }
  ctx.scale(1, 1.04);
  trackedText(ctx, COPY.brand, 0, 0, tracking);
  ctx.restore();

  /* ---- flavour code, upper area ------------------------------------ */
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '500 34px "Geist Mono", monospace';
  ctx.fillStyle =
    pass === 'color' ? GLOBAL.offWhite : pass === 'roughness' ? '#3A3A3A' : '#9A9A9A';
  const codeY = h * 0.115;
  const codeWidth = trackedText(ctx, cfg.code, w * 0.5, codeY, 14);

  // A single accent tick, in the flavor's brightest foil.
  ctx.fillStyle =
    pass === 'color' ? spec.foil[2] : pass === 'roughness' ? '#1F1F1F' : '#FFFFFF';
  ctx.fillRect(w * 0.5 - codeWidth / 2 - 30, codeY - 11, 5, 22);
  ctx.restore();

  /* ---- technical microcopy, printed once ---------------------------- */
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '400 22px "Geist Mono", monospace';
  ctx.fillStyle =
    pass === 'color'
      ? 'rgba(242, 239, 231, 0.66)'
      : pass === 'roughness'
        ? '#454545'
        : '#8A8A8A';
  trackedText(ctx, COPY.label.microcopy, w * 0.5, h * 0.928, 6);
  ctx.restore();
}

function renderPass(flavor: FlavorId, pass: Pass, scale = 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(LABEL_TEXTURE_WIDTH * scale);
  canvas.height = Math.round(LABEL_TEXTURE_HEIGHT * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
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

  // Data maps: linear, and half resolution is plenty for what they encode.
  const roughnessMap = new THREE.CanvasTexture(renderPass(flavor, 'roughness', 0.5));
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = anisotropy;
  roughnessMap.wrapS = THREE.RepeatWrapping;

  const metalnessMap = new THREE.CanvasTexture(renderPass(flavor, 'metalness', 0.5));
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
  return { base: FOIL[flavor].ground, tint: FOIL[flavor].groundTint };
}

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
