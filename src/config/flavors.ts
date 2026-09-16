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
    code: 'NOVA',
    palette: NOVA,
    keyLight: NOVA.ultraviolet,
    rimLight: NOVA.cobalt,
    ambient: NOVA.deep,
  },
  comet: {
    id: 'comet',
    name: 'COMET',
    code: 'COMET',
    palette: COMET,
    keyLight: COMET.ultraviolet,
    rimLight: COMET.cobalt,
    ambient: COMET.deep,
  },
  void: {
    id: 'void',
    name: 'VOID',
    code: 'VOID',
    palette: VOID,
    keyLight: VOID.ultraviolet,
    rimLight: VOID.cobalt,
    ambient: VOID.deep,
  },
};

export const FLAVOR_ORDER: FlavorId[] = ['nova', 'comet', 'void'];
