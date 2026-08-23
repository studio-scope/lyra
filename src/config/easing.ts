export type EaseName =
  | 'linear'
  | 'in'
  | 'out'
  | 'inOut'
  | 'expoOut'
  | 'expoIn'
  | 'backOut'
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
