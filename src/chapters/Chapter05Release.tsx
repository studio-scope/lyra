import { motion } from 'motion/react';
import styles from './Chapters.module.css';
import { ChapterSection, useBlockAt } from './ChapterSection';
import { COPY } from '../config/copy';
import { CHAPTERS } from '../config/timeline';

const { start, end } = CHAPTERS[4];

/**
 * Chapter 05 — Open & Pour.
 *
 * The tab lift, the flap break and the energy release are all rendered in the
 * live scene by `CanModel` and `ReleaseBurst`, driven from the same scroll
 * tracks as every other chapter. Nothing is composited, so this file carries
 * only the chapter copy.
 */

export function Chapter05Release() {
  // Both blocks are clear of the frame before the score gives way at 1233, so
  // nothing the can throws can ever cross the headline.
  const label = useBlockAt([1096, 1114, 1204, 1226], 16);
  const headline = useBlockAt([1110, 1132, 1200, 1224], 24);

  return (
    <ChapterSection start={start} end={end}>
      <motion.div
        className={styles.blockTopLeft}
        style={{ opacity: label.opacity, y: label.y }}
      >
        <span className={styles.chapterLabel}>{COPY.release.chapter}</span>
      </motion.div>

      <motion.div
        className={styles.blockTopCenter}
        style={{ opacity: headline.opacity, y: headline.y }}
      >
        <h2 className={styles.headline}>{COPY.release.headline}</h2>
      </motion.div>
    </ChapterSection>
  );
}
