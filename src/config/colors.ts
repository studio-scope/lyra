/**
 * LYRA color tokens.
 * Single source of truth for both DOM (via CSS custom properties in styles/tokens.css)
 * and WebGL (consumed as hex numbers / THREE.Color inputs).
 */

export const GLOBAL = {
  spaceBlack: '#020205',
  midnightBlack: '#05050B',
  offWhite: '#F2EFE7',
  mutedWhite: 'rgba(242, 239, 231, 0.62)',
  uiLine: 'rgba(242, 239, 231, 0.16)',
} as const;

export const NOVA = {
  deep: '#081A66',
  cobalt: '#2342FF',
  ultraviolet: '#6B3DFF',
  luminous: '#A56BFF',
  core: '#F1EEFF',
} as const;

export const COMET = {
  deep: '#033E52',
  cobalt: '#0B7CFF',
  ultraviolet: '#00D9FF',
  luminous: '#5FE9FF',
  core: '#DDFBFF',
} as const;

export const VOID = {
  deep: '#250036',
  cobalt: '#7127FF',
  ultraviolet: '#D628FF',
  luminous: '#E778FF',
  core: '#F6E8FF',
} as const;

/** Chapter-01 pre-flavor palette: the ignition is always ultraviolet/cobalt. */
export const IGNITION = NOVA;
