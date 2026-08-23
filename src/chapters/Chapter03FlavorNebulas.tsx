import { motion, useTransform } from 'motion/react';
import styles from './Chapters.module.css';
import local from './Chapter03FlavorNebulas.module.css';
import { ChapterSection, useBlockAt } from './ChapterSection';
import { COPY } from '../config/copy';
import { CHAPTERS } from '../config/timeline';

const { start, end } = CHAPTERS[2];

/**
 * Three moments, one chapter.
 *
 * Each moment reads on the opposite side from the can (NOVA right / copy left,
 * COMET left / copy right, VOID centred / copy low-left), so the composition
 * changes with the colour rather than only the colour changing.
 */

interface MomentProps {
  index: 0 | 1 | 2;
  /** [enter start, enter end, exit start, exit end] in vh. */
  window: [number, number, number, number];
  side: 'left' | 'right' | 'bottomLeft';
}

function Moment({ index, window: w, side }: MomentProps) {
  const copy = COPY.nebulas.moments[index];
  const stagger = 8;
  const code = useBlockAt(w, 14);
  const headline = useBlockAt(
    [w[0] + stagger, w[1] + stagger, w[2], w[3]],
    24,
  );
  const support = useBlockAt(
    [w[0] + stagger * 2, w[1] + stagger * 2, w[2] - 4, w[3] - 4],
    18,
  );

  const blockClass =
    side === 'left'
      ? styles.blockLeft
      : side === 'right'
        ? styles.blockRight
        : styles.blockBottomLeft;
  const ruleClass = side === 'right' ? styles.ruleRight : styles.rule;
  const supportClass = side === 'right' ? styles.supportRight : styles.support;

  return (
    <div className={blockClass}>
      <motion.div style={{ opacity: code.opacity, y: code.y }}>
        <span className={styles.flavorCode}>{copy.code}</span>
      </motion.div>

      <motion.h2
        className={styles.headlineSmall}
        style={{ opacity: headline.opacity, y: headline.y }}
      >
        {copy.headline}
      </motion.h2>

      <motion.div style={{ opacity: support.opacity, y: support.y }}>
        <div className={ruleClass} />
        <p className={supportClass}>{copy.support}</p>
      </motion.div>
    </div>
  );
}

export function Chapter03FlavorNebulas() {
  // The chapter label rides the whole chapter; the moments swap beneath it.
  const label = useBlockAt([432, 450, 800, 818], 16);

  return (
    <ChapterSection start={start} end={end}>
      <motion.div
        className={styles.blockTopLeft}
        style={{ opacity: label.opacity, y: label.y }}
      >
        <span className={styles.chapterLabel}>{COPY.nebulas.chapter}</span>
      </motion.div>

      {/* Windows end before each warp so the swap itself is pure 3D. */}
      <Moment index={0} window={[452, 472, 536, 552]} side="left" />
      <Moment index={1} window={[588, 606, 668, 684]} side="right" />
      <Moment index={2} window={[722, 740, 796, 816]} side="bottomLeft" />

      <div className={local.index}>
        <MomentTicks />
      </div>
    </ChapterSection>
  );
}

/** A restrained 01 / 02 / 03 progress index, bottom-right. */
function MomentTicks() {
  const visible = useBlockAt([440, 458, 796, 816], 10);
  const active = [
    useBlockAt([452, 462, 546, 556], 0).opacity,
    useBlockAt([588, 598, 678, 688], 0).opacity,
    useBlockAt([722, 732, 806, 818], 0).opacity,
  ];
  // Inactive rows stay legible but recessive; the active one comes forward.
  const labelOpacity = [
    useTransform(active[0], [0, 1], [0.3, 1]),
    useTransform(active[1], [0, 1], [0.3, 1]),
    useTransform(active[2], [0, 1], [0.3, 1]),
  ];

  return (
    <motion.div className={local.ticks} style={{ opacity: visible.opacity, y: visible.y }}>
      {COPY.nebulas.moments.map((moment, i) => (
        <div key={moment.code} className={local.tickRow}>
          <span className={local.tickTrack}>
            <motion.span className={local.tickBar} style={{ scaleX: active[i] }} />
          </span>
          <motion.span className={local.tickLabel} style={{ opacity: labelOpacity[i] }}>
            {moment.code}
          </motion.span>
        </div>
      ))}
    </motion.div>
  );
}
