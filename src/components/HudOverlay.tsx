import { motion, useTransform } from 'motion/react';
import styles from './HudOverlay.module.css';
import { COPY } from '../config/copy';
import { scrollProgress, scrollVh } from '../hooks/useScroll';

/**
 * Persistent HUD.
 *
 * Two anchors, not four: the brand label top-left and the progress meter
 * bottom-right. The top-right and bottom-left corners are deliberately empty —
 * the chapter counter and the flavor/status readout were duplicating what the
 * chapter copy and the can itself already say, and the whitespace frames the
 * composition better than more mono type would.
 */

export function HudOverlay() {
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

      <div className={styles.bottomRight}>
        <span className={styles.track}>
          <motion.span className={styles.fill} style={{ scaleX: barScale }} />
        </span>
        <motion.span className={styles.mono}>{percent}</motion.span>
      </div>
    </motion.div>
  );
}
