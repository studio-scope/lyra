import { motion } from 'motion/react';
import styles from './Chapters.module.css';
import { ChapterSection, useBlockAt } from './ChapterSection';
import { COPY } from '../config/copy';
import { CHAPTERS } from '../config/timeline';

const { start, end } = CHAPTERS[1];

export function Chapter02AsteroidRun() {
  // The copy holds only while the can is choreographed to the right-hand side
  // of the frame (see CAN_POSITION, vh 250–330).
  const label = useBlockAt([196, 214, 336, 352], 18);
  const headline = useBlockAt([206, 226, 336, 352], 26);
  const support = useBlockAt([220, 240, 332, 348], 20);

  return (
    <ChapterSection start={start} end={end}>
      <div className={styles.blockLeft}>
        <motion.div style={{ opacity: label.opacity, y: label.y }}>
          <span className={styles.chapterLabel}>{COPY.asteroid.chapter}</span>
        </motion.div>

        <motion.h2
          className={styles.headline}
          style={{ opacity: headline.opacity, y: headline.y }}
        >
          {COPY.asteroid.headline}
        </motion.h2>

        <motion.div style={{ opacity: support.opacity, y: support.y }}>
          <div className={styles.rule} />
          <p className={styles.support}>{COPY.asteroid.support}</p>
        </motion.div>
      </div>
    </ChapterSection>
  );
}
