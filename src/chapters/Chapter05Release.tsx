import { motion, useTransform } from 'motion/react';
import styles from './Chapters.module.css';
import local from './Chapter05Release.module.css';
import { ChapterSection, useBlockAt } from './ChapterSection';
import { COPY } from '../config/copy';
import { CHAPTERS } from '../config/timeline';
import { RELEASE_FRAMING } from '../config/choreography';
import { scrollVh } from '../hooks/useScroll';
import { useDebugControls } from '../hooks/useDebug';

const { start, end } = CHAPTERS[4];
const { cutPointVh, scrubEndVh, releaseEndVh, camera, cameraTarget } = RELEASE_FRAMING;

/**
 * Chapter 05 — Open & Pour.
 *
 * There is nothing to composite here. The tab lift, the flap break and the
 * energy release are all rendered in the live scene by `CanModel` and
 * `ReleaseBurst`, driven from the same scroll tracks as every other chapter.
 * This file only carries the chapter's copy and the development overlay, which
 * is why the can never changes sharpness, material or lighting at the cut.
 *
 * Press `V` for the annotated release overlay (off by default).
 */

export function Chapter05Release() {
  const debug = useDebugControls();

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

      {debug.videoBounds && <ReleaseOverlay />}
    </ChapterSection>
  );
}

/** Development-only annotation. Toggled with `V`, hidden by default. */
function ReleaseOverlay() {
  const progress = useTransform(scrollVh, [cutPointVh, releaseEndVh], [0, 1], {
    clamp: true,
  });
  const progressPercent = useTransform(progress, (v) => `${(v * 100).toFixed(1)}%`);
  const atStart = useTransform(scrollVh, (v) =>
    Math.abs(v - cutPointVh) < 3 ? 1 : 0.25,
  );

  return (
    <div className={local.debug}>
      <div className={local.debugFrame} />

      <motion.div className={local.debugStart} style={{ opacity: atStart }}>
        <span className={local.debugTag}>RELEASE REFERENCE FRAME</span>
      </motion.div>

      <dl className={local.debugSpec}>
        <Spec label="RELEASE" value={`${cutPointVh} → ${releaseEndVh} VH`} />
        <Spec label="HANDOFF" value={`${releaseEndVh} → ${scrubEndVh} VH`} />
        <Spec label="SOURCE" value="LIVE SCENE · NO PLATE" />
        <Spec label="CAMERA" value={`[${camera.position.join(', ')}] FOV ${camera.fov}`} />
        <Spec label="TARGET" value={`[${cameraTarget.join(', ')}]`} />
        <div className={local.debugRow}>
          <dt className={local.debugKey}>PROGRESS</dt>
          <dd className={local.debugValue}>
            <div className={local.scrubTrack}>
              <motion.span className={local.scrubFill} style={{ width: progressPercent }} />
            </div>
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className={local.debugRow}>
      <dt className={local.debugKey}>{label}</dt>
      <dd className={local.debugValue}>{value}</dd>
    </div>
  );
}
