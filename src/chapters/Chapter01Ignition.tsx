import { motion, useTransform } from 'motion/react';
import styles from './Chapters.module.css';
import local from './Chapter01Ignition.module.css';
import { ChapterSection, useStaggeredBlock } from './ChapterSection';
import { LyraWordmark } from '../components/LyraWordmark';
import { COPY } from '../config/copy';
import { CHAPTERS } from '../config/timeline';
import { scrollVh } from '../hooks/useScroll';

const { start, end } = CHAPTERS[0];

export function Chapter01Ignition() {
  /**
   * The wordmark impact. Scrubbed, not sprung: the overshoot is baked into the
   * keyframes so it stays locked to the wheel in both directions, with none of
   * the settle lag a low-stiffness spring would add.
   */
  const markOpacity = useTransform(
    scrollVh,
    [136, 145, 168, 180],
    [0, 1, 1, 0],
    { clamp: true },
  );
  const markScale = useTransform(scrollVh, [140, 152, 161, 172], [1.16, 0.985, 1.004, 1], {
    clamp: true,
  });
  const markY = useTransform(scrollVh, [140, 152, 161], [26, -3, 0], { clamp: true });
  /**
   * Blur belongs to the impact and nothing else. It peaks at 6px and is gone by
   * vh 146 — a hair before the opacity ramp completes — so the mark is never
   * held in a soft, half-opaque state, and every readable frame after the
   * settle is exactly zero blur.
   */
  const markFilter = useTransform(
    useTransform(scrollVh, [138, 146], [6, 0], { clamp: true }),
    (v: number) => `blur(${v.toFixed(2)}px)`,
  );

  const label = useStaggeredBlock(start, end, 0, [0.03, 0.11, 0.92, 1]);
  // Reads immediately after the wordmark lands, and holds to the boundary.
  const headline = useStaggeredBlock(start, end, 0, [0.855, 0.915, 0.955, 1]);

  /** The scroll invitation is only true while nothing has happened yet. */
  const promptOpacity = useTransform(scrollVh, [6, 24, 62, 82], [0, 1, 1, 0], {
    clamp: true,
  });

  return (
    <ChapterSection start={start} end={end}>
      <motion.div
        className={styles.blockTopLeft}
        style={{ opacity: label.opacity, y: label.y }}
      >
        <span className={styles.chapterLabel}>{COPY.ignition.chapter}</span>
      </motion.div>

      <motion.div
        className={local.mark}
        style={{ opacity: markOpacity, scale: markScale, y: markY, filter: markFilter }}
      >
        <LyraWordmark size="hero" />
      </motion.div>

      <motion.div className={local.prompt} style={{ opacity: promptOpacity }}>
        <span className={local.promptText}>{COPY.ignition.support}</span>
      </motion.div>

      <motion.div
        className={styles.blockBottomLeft}
        style={{ opacity: headline.opacity, y: headline.y }}
      >
        <span className={styles.flavorCode}>{COPY.ignition.flavor}</span>
        <h1 className={styles.headline}>{COPY.ignition.headline}</h1>
      </motion.div>
    </ChapterSection>
  );
}
