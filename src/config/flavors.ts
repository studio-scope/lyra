import { COMET, NOVA, VOID } from './colors';

export type FlavorId = 'nova' | 'comet' | 'void';

/** The five roles every flavour palette fills, in the same order each time. */
export interface Palette {
  deep: string;
  cobalt: string;
  ultraviolet: string;
  luminous: string;
  core: string;
}

export interface FlavorConfig {
  id: FlavorId;
  /** Display name used on the label and in the HUD. */
  name: string;
  /** Two-digit index printed as `NAME / 01`. */
  index: string;
  code: string;
  /** Palette driving environment light, trail and nebula volume. */
  palette: Palette;
  /** Key light color for this chapter. */
  keyLight: string;
  /** Rim/accent light on the opposite side of the can. */
  rimLight: string;
  /** Base fog / environment tint. Kept very dark so blacks stay black. */
  ambient: string;
}

export const FLAVORS: Record<FlavorId, FlavorConfig> = {
  nova: {
    id: 'nova',
    name: 'NOVA',
    index: '01',
    code: 'NOVA / 01',
    palette: NOVA,
    keyLight: NOVA.ultraviolet,
    rimLight: NOVA.cobalt,
    ambient: NOVA.deep,
  },
  comet: {
    id: 'comet',
    name: 'COMET',
    index: '02',
    code: 'COMET / 02',
    palette: COMET,
    keyLight: COMET.ultraviolet,
    rimLight: COMET.cobalt,
    ambient: COMET.deep,
  },
  void: {
    id: 'void',
    name: 'VOID',
    index: '03',
    code: 'VOID / 03',
    palette: VOID,
    keyLight: VOID.ultraviolet,
    rimLight: VOID.cobalt,
    ambient: VOID.deep,
  },
};

export const FLAVOR_ORDER: FlavorId[] = ['nova', 'comet', 'void'];
