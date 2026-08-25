export type EaseName =
  | 'linear'
  | 'in'
  | 'out'
  | 'inOut'
  | 'expoOut'
  | 'expoIn'
  | 'backOut'
  | 'impact'
  | 'hold';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const EASING: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  expoOut: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -9 * t)),
  expoIn: (t) => (t <= 0 ? 0 : Math.pow(2, 9 * (t - 1))),
  // Restrained overshoot. Deliberately far below the default "back" constant
  // so impact moments settle instead of bouncing.
  backOut: (t) => {
    const c = 1.24;
    const p = t - 1;
    return 1 + (c + 1) * p * p * p + c * p * p;
  },
  /**
   * A mechanical break, not an ease. Used by the scored can flap and nothing
   * else.
   *
   * A damped spring: the value is already past its target by the time a
   * smoothstep would still be accelerating, overshoots ~7%, then is done. This
   * is what makes a scored panel read as *giving* rather than being lowered —
   * the whole event is over in the first third of the interval and the rest is
   * settle. Returns above 1 mid-flight, which is the point.
   *
   * The decay term is deliberately steep. At the original -6 the panel took a
   * ~12% overshoot and a visible second swing, which on a 66-degree travel is
   * about 8 degrees of afterswing — readable as rubber rather than as 0.2mm
   * aluminium. -7.6 keeps a single ~4.5-degree overshoot and kills the second
   * swing to half a degree, so the flap arrives, twitches once and stops.
   */
  impact: (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return 1 - Math.exp(-7.6 * t) * Math.cos(9 * t);
  },
  hold: () => 0,
};

export const ease = (name: EaseName, t: number) => EASING[name](clamp01(t));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const inverseLerp = (a: number, b: number, v: number) =>
  a === b ? 0 : clamp01((v - a) / (b - a));

export const smoothstep = (edge0: number, edge1: number, v: number) => {
  const t = inverseLerp(edge0, edge1, v);
  return t * t * (3 - 2 * t);
};

export { clamp01 };
