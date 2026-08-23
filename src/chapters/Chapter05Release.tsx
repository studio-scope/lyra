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
const { cutPointVh, scrubStartVh, scrubEndVh, camera, cameraTarget, plate } =
  RELEASE_FRAMING;

/**
 * Chapter 05 — Open & Pour.
 *
 * Phase 1 stops at the cut point: the can is brought to a locked close-up, the
 * seal breaks, and the frame hands over to a placeholder plate that preserves
 * the exact framing the Phase 2 video must start on.
 *
 * Press `V` for the annotated video-bounds overlay (off by default).
 */

export function Chapter05Release() {
  const debug = useDebugControls();

  const label = useBlockAt([1096, 1114, 1236, 1252], 16);
  const headline = useBlockAt([1110, 1132, 1232, 1250], 24);

  /** The plate takes over at the cut point and holds to the chapter end. */
  const plateOpacity = useTransform(
    scrollVh,
    [cutPointVh - 6, cutPointVh + 16, scrubEndVh - 10, scrubEndVh],
    [0, 1, 1, 0],
    { clamp: true },
  );
  const plateScale = useTransform(
    scrollVh,
    [cutPointVh - 6, cutPointVh + 16],
    [1.035, 1],
    { clamp: true },
  );
  /** Scrub position inside the future video's range. */
  const scrub = useTransform(scrollVh, [scrubStartVh, scrubEndVh], [0, 1], {
    clamp: true,
  });
  const scrubPercent = useTransform(scrub, (v) => `${(v * 100).toFixed(1)}%`);
  const scrubReadout = useTransform(scrub, (v) => `${(v * 100).toFixed(0)}%`);

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

      {/* Phase 1 placeholder plate. Deliberately transparent: the locked can
          framing behind it IS the start frame the video has to match. */}
      <motion.div
        className={local.plate}
        style={{ opacity: plateOpacity, scale: plateScale }}
      >
        <div className={local.frame} data-aspect={plate.aspect}>
          <span className={local.corner} data-corner="tl" />
          <span className={local.corner} data-corner="tr" />
          <span className={local.corner} data-corner="bl" />
          <span className={local.corner} data-corner="br" />

          <div className={local.frameHeader}>
            <span className={local.frameTitle}>OPEN &amp; POUR</span>
            <span className={local.frameMeta}>PLATE PENDING · PHASE 2</span>
          </div>

          <div className={local.frameFooter}>
            <span className={local.frameMeta}>
              START FRAME · VH {cutPointVh}
            </span>
            <div className={local.scrubTrack}>
              <motion.span className={local.scrubFill} style={{ width: scrubPercent }} />
            </div>
            <motion.span className={local.frameMeta}>{scrubReadout}</motion.span>
          </div>
        </div>
      </motion.div>

      {debug.videoBounds && <VideoBoundsOverlay />}
    </ChapterSection>
  );
}

/** Development-only annotation. Toggled with `V`, hidden by default. */
function VideoBoundsOverlay() {
  const scrub = useTransform(scrollVh, [scrubStartVh, scrubEndVh], [0, 1], {
    clamp: true,
  });
  const scrubPercent = useTransform(scrub, (v) => `${(v * 100).toFixed(1)}%`);
  const atStart = useTransform(scrollVh, (v) =>
    Math.abs(v - cutPointVh) < 3 ? 1 : 0.25,
  );

  return (
    <div className={local.debug}>
      <div className={local.debugFrame} />

      <motion.div className={local.debugStart} style={{ opacity: atStart }}>
        <span className={local.debugTag}>INTENDED START FRAME</span>
      </motion.div>

      {/* End-frame direction: the pour continues downward out of frame. */}
      <div className={local.debugEnd}>
        <span className={local.debugTag}>END FRAME DIRECTION ↓ POUR EXITS LOW</span>
      </div>

      <dl className={local.debugSpec}>
        <Spec label="SCRUB RANGE" value={`${scrubStartVh} → ${scrubEndVh} VH`} />
        <Spec label="PLATE" value={`${plate.width}×${plate.height} · ${plate.aspect} · ${plate.fps}FPS`} />
        <Spec label="CAMERA" value={`[${camera.position.join(', ')}] FOV ${camera.fov}`} />
        <Spec label="TARGET" value={`[${cameraTarget.join(', ')}]`} />
        <Spec
          label="CAN"
          value={`Y ${RELEASE_FRAMING.can.rotationY.toFixed(3)} RAD · TAB ${RELEASE_FRAMING.can.tabLift}`}
        />
        <div className={local.debugRow}>
          <dt className={local.debugKey}>SCRUB</dt>
          <dd className={local.debugValue}>
            <div className={local.scrubTrack}>
              <motion.span className={local.scrubFill} style={{ width: scrubPercent }} />
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
