import { motion, useTransform } from 'motion/react';
import styles from './HudOverlay.module.css';
import { COPY } from '../config/copy';
import { CHAPTERS, type Chapter } from '../config/timeline';
import { FLAVORS, type FlavorId } from '../config/flavors';
import { scrollProgress, scrollVh } from '../hooks/useScroll';

/**
 * Persistent HUD.
 *
 * Four corner anchors, thin rules, mono type. It frames the composition and
 * never competes with it — no navigation bar, no panels.
 */

interface Props {
  chapter: Chapter;
  flavor: FlavorId;
}

const TOTAL = String(CHAPTERS.length).padStart(2, '0');

export function HudOverlay({ chapter, flavor }: Props) {
  const percent = useTransform(scrollProgress, (v) =>
    `${Math.round(v * 100)}`.padStart(2, '0'),
  );
  const barScale = useTransform(scrollProgress, (v) => v);
  /** The HUD fades up out of the dark with the first stars. */
  const enter = useTransform(scrollVh, [4, 26], [0, 1], { clamp: true });

  return (
    <motion.div className={styles.hud} style={{ opacity: enter }} aria-hidden="true">
      <div className={styles.topLeft}>
        <span className={styles.mono}>{COPY.hud.system}</span>
      </div>

      <div className={styles.topRight}>
        <span className={styles.mono}>
          {chapter.index} / {TOTAL}
        </span>
      </div>

      <div className={styles.bottomLeft}>
        <span className={styles.marker} />
        <span className={styles.mono}>{FLAVORS[flavor].code}</span>
        <span className={styles.divider} />
        <span className={styles.monoMuted}>{chapter.label}</span>
      </div>

      <div className={styles.bottomRight}>
        <span className={styles.monoMuted}>{COPY.hud.progress}</span>
        <span className={styles.track}>
          <motion.span className={styles.fill} style={{ scaleX: barScale }} />
        </span>
        <motion.span className={styles.mono}>{percent}</motion.span>
      </div>
    </motion.div>
  );
}
