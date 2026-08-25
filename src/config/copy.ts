/** Every string that appears on screen. Nothing invented outside this file. */

export const COPY = {
  brand: 'LYRA',

  hud: {
    system: 'LYRA ENERGY',
  },

  ignition: {
    chapter: '01 / IGNITION',
    headline: 'ENERGY FROM ANOTHER SYSTEM.',
    /** The can that launches is NOVA; naming it here starts the flavour thread. */
    flavor: 'NOVA / 01',
    support: 'Scroll to ignite.',
  },

  asteroid: {
    chapter: '02 / ASTEROID RUN',
    headline: 'NO BRAKES. NO GRAVITY.',
    support: 'Full speed from ignition to the flavor system.',
  },

  nebulas: {
    chapter: '03 / FLAVOR NEBULAS',
    /**
     * `code` carries the flavour name and its sequence number; `headline` is the
     * variant's name in the brand voice; `support` is what it actually tastes
     * like. Two short lines each, maximum — edit these freely.
     */
    moments: [
      {
        code: 'NOVA / 01',
        headline: 'VIOLET IGNITION',
        support: 'Sharp citrus ignition with a dark berry finish.',
      },
      {
        code: 'COMET / 02',
        headline: 'COLD SPEED',
        support: 'Cold blue raspberry. Clean, fast and electric.',
      },
      {
        code: 'VOID / 03',
        headline: 'DARK MATTER',
        support: 'Black cherry and grape. Deep flavor, no soft landing.',
      },
    ],
  },

  station: {
    chapter: '04 / STATION FLYBY',
    /**
     * The product-information moment. Four facts a buyer actually wants, and
     * nothing invented: no signal strength, no origin coordinates, no telemetry.
     */
    readout: [
      { label: 'PRODUCT SPEC', value: '' },
      { label: 'CAFFEINE', value: '160 MG' },
      { label: 'SUGAR', value: 'ZERO' },
      { label: 'ENERGY', value: '10 KCAL' },
      { label: 'VOLUME', value: '355 ML' },
    ],
  },

  release: {
    chapter: '05 / OPEN & POUR',
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
