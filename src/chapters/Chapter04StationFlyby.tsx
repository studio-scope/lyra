import { motion } from 'motion/react';
import styles from './Chapters.module.css';
import local from './Chapter04StationFlyby.module.css';
import { ChapterSection, useBlockAt } from './ChapterSection';
import { COPY } from '../config/copy';
import { CHAPTERS } from '../config/timeline';

const { start, end } = CHAPTERS[3];

/**
 * HUD readout, revealed in staggered groups.
 *
 * Thin rules and mono type only — no glass cards, no rounded panels, no
 * decorative circles. The scan is a single short sweep, not a loop.
 */

const ROW_WINDOWS: [number, number, number, number][] = [
  [868, 884, 1032, 1052],
  [890, 906, 1032, 1052],
  [912, 928, 1032, 1052],
  [934, 950, 1032, 1052],
  [956, 972, 1032, 1052],
];

export function Chapter04StationFlyby() {
  const label = useBlockAt([842, 860, 1036, 1056], 16);
  const rows = [
    useBlockAt(ROW_WINDOWS[0], 12),
    useBlockAt(ROW_WINDOWS[1], 12),
    useBlockAt(ROW_WINDOWS[2], 12),
    useBlockAt(ROW_WINDOWS[3], 12),
    useBlockAt(ROW_WINDOWS[4], 12),
  ];
  // One short sweep as the readout completes, then it is gone.
  const scan = useBlockAt([958, 976, 992, 1010], 0);

  const [systemCheck, ...data] = COPY.station.readout;

  return (
    <ChapterSection start={start} end={end}>
      <motion.div
        className={styles.blockTopLeft}
        style={{ opacity: label.opacity, y: label.y }}
      >
        <span className={styles.chapterLabel}>{COPY.station.chapter}</span>
      </motion.div>

      <div className={local.readout}>
        <motion.div
          className={local.heading}
          style={{ opacity: rows[0].opacity, y: rows[0].y }}
        >
          <span className={local.headingText}>{systemCheck.label}</span>
          <motion.span className={local.scanLine} style={{ scaleX: scan.opacity }} />
        </motion.div>

        <dl className={local.list}>
          {data.map((row, i) => (
            <motion.div
              key={row.label}
              className={local.row}
              style={{ opacity: rows[i + 1].opacity, y: rows[i + 1].y }}
            >
              <dt className={local.rowLabel}>{row.label}</dt>
              <dd className={local.rowValue}>{row.value}</dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </ChapterSection>
  );
}
