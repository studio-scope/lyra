import type { ReactNode } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import styles from './Chapters.module.css';
import { scrollVh } from '../hooks/useScroll';

/**
 * A chapter's full-viewport stage.
 *
 * The stages are pinned for the whole of their scroll range and mapped to
 * global progress, with the page's scroll length supplied by a single spacer.
 * (A `position: sticky` element only stays pinned for `sectionHeight -
 * viewportHeight`, which would drop each chapter's copy 100vh early.)
 *
 * Stages outside their range are set to `visibility: hidden` so they cost
 * nothing to composite.
 */

const VISIBILITY_PAD = 14;

interface Props {
  start: number;
  end: number;
  children: ReactNode;
}

export function ChapterSection({ start, end, children }: Props) {
  const visibility = useTransform(scrollVh, (v) =>
    v >= start - VISIBILITY_PAD && v <= end + VISIBILITY_PAD ? 'visible' : 'hidden',
  );

  return (
    <motion.div className={styles.stage} style={{ visibility }}>
      <div className={styles.inner}>{children}</div>
    </motion.div>
  );
}

/**
 * Copy envelope for one block: fade and lift in, hold, then leave before the
 * chapter boundary so transitions are pure 3D.
 *
 * `stops` are fractions of the chapter's span: [enter start, enter end,
 * exit start, exit end].
 */
export function useBlock(
  start: number,
  end: number,
  stops: [number, number, number, number] = [0.07, 0.22, 0.7, 0.88],
  lift = 22,
) {
  const span = end - start;
  const points = stops.map((f) => start + span * f);
  const opacity = useTransform(scrollVh, points, [0, 1, 1, 0], { clamp: true });
  const y = useTransform(scrollVh, points, [lift, 0, 0, -lift * 0.55], { clamp: true });
  return { opacity, y };
}

/** Same envelope, entered `delay` (in chapter fractions) later. */
export function useStaggeredBlock(
  start: number,
  end: number,
  delay: number,
  stops: [number, number, number, number] = [0.07, 0.22, 0.7, 0.88],
  lift = 22,
) {
  return useBlock(start, end, [stops[0] + delay, stops[1] + delay, stops[2], stops[3]], lift);
}

/** Absolute-vh variant, for moments that do not align to a chapter's span. */
export function useBlockAt(
  points: [number, number, number, number],
  lift = 22,
): BlockMotion {
  const opacity = useTransform(scrollVh, points, [0, 1, 1, 0], { clamp: true });
  const y = useTransform(scrollVh, points, [lift, 0, 0, -lift * 0.55], { clamp: true });
  return { opacity, y };
}

export type BlockMotion = { opacity: MotionValue<number>; y: MotionValue<number> };
