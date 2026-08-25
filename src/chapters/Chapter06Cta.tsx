import { motion } from 'motion/react';
import styles from './Chapters.module.css';
import local from './Chapter06Cta.module.css';
import { ChapterSection, useBlockAt } from './ChapterSection';
import { LyraWordmark } from '../components/LyraWordmark';
import { COPY } from '../config/copy';
import { CHAPTERS } from '../config/timeline';

const { start, end } = CHAPTERS[5];

/**
 * Closing composition: centred wordmark, flavour codes, one CTA, and a lot of
 * black. No card, no container — the negative space is the layout.
 */

export function Chapter06Cta() {
  // Exit stops sit past the end of the timeline: the CTA is the final frame of
  // the recording and must still be on screen at the very bottom of the page.
  // Nothing starts reading until the product is out of the centre of frame:
  // the can is clear at 1342, so the wordmark begins there. The cascade is
  // tightened rather than pushed back, so the settled composition still
  // resolves by ~1408 exactly as before.
  const mark = useBlockAt([1342, 1362, 1600, 1610], 26);
  const headline = useBlockAt([1352, 1372, 1600, 1610], 22);
  const flavors = useBlockAt([1362, 1382, 1600, 1610], 18);
  const cta = useBlockAt([1372, 1394, 1600, 1610], 16);
  const support = useBlockAt([1384, 1408, 1600, 1610], 12);

  return (
    <ChapterSection start={start} end={end}>
      <div className={styles.blockCenter}>
        <motion.div style={{ opacity: mark.opacity, y: mark.y }}>
          <LyraWordmark size="cta" />
        </motion.div>

        <motion.h2
          className={local.headline}
          style={{ opacity: headline.opacity, y: headline.y }}
        >
          {COPY.cta.headline}
        </motion.h2>

        <motion.p
          className={local.flavors}
          style={{ opacity: flavors.opacity, y: flavors.y }}
        >
          {COPY.cta.flavors}
        </motion.p>

        <motion.div
          className={local.ctaWrap}
          style={{ opacity: cta.opacity, y: cta.y }}
        >
          <button type="button" className={local.cta}>
            <span>{COPY.cta.button}</span>
            <span className={local.ctaRule} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.p
          className={local.support}
          style={{ opacity: support.opacity, y: support.y }}
        >
          {COPY.cta.support}
        </motion.p>
      </div>
    </ChapterSection>
  );
}
