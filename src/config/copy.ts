/** Every string that appears on screen. Nothing invented outside this file. */

export const COPY = {
  brand: 'LYRA',

  hud: {
    system: 'LYRA ENERGY',
  },

  ignition: {
    chapter: '01 / IGNITION',
    headline: 'ENERGY FROM ANOTHER SYSTEM.',
    support: 'Signal acquired. Scroll to ignite.',
  },

  asteroid: {
    chapter: '02 / ASTEROID RUN',
    headline: 'NO BRAKES. NO GRAVITY.',
    support: 'Built for the space between decisions.',
  },

  nebulas: {
    chapter: '03 / FLAVOR NEBULAS',
    moments: [
      {
        code: 'NOVA / 01',
        headline: 'VIOLET IGNITION',
        support: 'Bright pressure. Cold finish. Immediate impact.',
      },
      {
        code: 'COMET / 02',
        headline: 'COLD SPEED',
        support: 'Clean, electric and already gone.',
      },
      {
        code: 'VOID / 03',
        headline: 'DARK MATTER',
        support: 'Deep flavor for the final frontier.',
      },
    ],
  },

  station: {
    chapter: '04 / STATION FLYBY',
    readout: [
      { label: 'SYSTEM CHECK', value: '' },
      { label: 'CAFFEINE', value: '160 MG' },
      { label: 'VOLUME', value: '355 ML' },
      { label: 'SIGNAL', value: 'STABLE' },
      { label: 'ORIGIN', value: 'LYRA' },
    ],
  },

  release: {
    chapter: '05 / RELEASE',
    headline: 'RELEASE THE SIGNAL.',
  },

  cta: {
    headline: 'CHOOSE YOUR SIGNAL.',
    flavors: 'NOVA / COMET / VOID',
    button: 'FIND LYRA',
    support: 'ENERGY FROM ANOTHER SYSTEM',
  },

  /** Printed on the can label. */
  label: {
    microcopy: 'COSMIC ENERGY · 355 ML',
  },
} as const;
