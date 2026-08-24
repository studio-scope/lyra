import { useEffect, useRef } from 'react';
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
const { cutPointVh, scrubEndVh, videoEndVh, camera, cameraTarget, plate } =
  RELEASE_FRAMING;

/** Shipped plate. Path is relative to `public/`. */
const VIDEO_SRC = '/assets/open-pour/open-pour-final.mp4';
const VIDEO_FPS = plate.fps;
const VIDEO_LAST_FRAME = plate.frames - 1;
/** Half a frame: below this a seek would land on the frame already shown. */
const SEEK_EPSILON = 1 / (VIDEO_FPS * 2);

/**
 * Chapter 05 — Open & Pour.
 *
 * The live WebGL can stays authoritative right through this chapter. The plate
 * is an effects-only composite: it carries the violet zero-gravity liquid over
 * a frozen render of the same can, so the cut point is a crossfade between two
 * images of one product rather than a swap between two different ones.
 *
 * Press `V` for the annotated video-bounds overlay (off by default).
 */

/**
 * Drive the plate from scroll position alone.
 *
 * The video is never played: `currentTime` is written imperatively from the
 * scroll source, quantised to a source frame so a given scroll position always
 * resolves to the same frame going forwards and backwards. Nothing here calls
 * setState, so scrubbing costs zero React renders — the same rule the WebGL
 * side follows.
 */
function useScrubbedPlate(ref: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    let rafId = 0;
    let pending: number | null = null;
    let hasMetadata = video.readyState >= 1;

    const seek = (vh: number) => {
      const el = ref.current;
      if (!el || !hasMetadata) return;
      const duration = el.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const span = videoEndVh - cutPointVh;
      const raw = span > 0 ? (vh - cutPointVh) / span : 0;
      const progress = raw < 0 ? 0 : raw > 1 ? 1 : raw;

      const index = Math.round(progress * VIDEO_LAST_FRAME);
      const time = index / VIDEO_FPS;
      if (!Number.isFinite(time)) return;
      // Clamp inside the decoded range: seeking past the last frame leaves some
      // browsers showing nothing at all.
      const target = Math.min(Math.max(time, 0), duration);
      if (Math.abs(el.currentTime - target) < SEEK_EPSILON) return;
      try {
        el.currentTime = target;
      } catch {
        // Seeking can throw if the media is torn down mid-scroll; the next
        // scroll event re-issues it.
      }
    };

    /** Coalesce to one seek per frame — a fast flick fires many scroll events. */
    const schedule = (vh: number) => {
      pending = vh;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (pending !== null) seek(pending);
      });
    };

    const onLoaded = () => {
      hasMetadata = true;
      seek(scrollVh.get());
    };

    video.addEventListener('loadedmetadata', onLoaded);
    if (hasMetadata) seek(scrollVh.get());
    const unsubscribe = scrollVh.on('change', schedule);

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      unsubscribe();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ref]);
}

export function Chapter05Release() {
  const debug = useDebugControls();
  const videoRef = useRef<HTMLVideoElement>(null);
  useScrubbedPlate(videoRef);

  const label = useBlockAt([1096, 1114, 1236, 1252], 16);
  const headline = useBlockAt([1110, 1132, 1232, 1250], 24);

  /*
   * Short fade at the cut point only. The plate's first frame is a render of
   * the same can from the same camera, so this hides subpixel differences
   * without ever reading as a dissolve between two products. It fades back out
   * across `videoEndVh -> scrubEndVh`, while the CTA's liquid field is already
   * rising underneath.
   */
  const plateOpacity = useTransform(
    scrollVh,
    [cutPointVh - 3, cutPointVh + 3, videoEndVh, scrubEndVh],
    [0, 1, 1, 0],
    { clamp: true },
  );

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

      <motion.div className={local.plate} style={{ opacity: plateOpacity }}>
        <video
          ref={videoRef}
          className={local.video}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          disablePictureInPicture
          controls={false}
          tabIndex={-1}
        />
      </motion.div>

      {debug.videoBounds && <VideoBoundsOverlay />}
    </ChapterSection>
  );
}

/** Development-only annotation. Toggled with `V`, hidden by default. */
function VideoBoundsOverlay() {
  const scrub = useTransform(scrollVh, [cutPointVh, videoEndVh], [0, 1], {
    clamp: true,
  });
  const scrubPercent = useTransform(scrub, (v) => `${(v * 100).toFixed(1)}%`);
  const frame = useTransform(scrub, (v) =>
    String(Math.round(v * VIDEO_LAST_FRAME)).padStart(2, '0'),
  );
  const atStart = useTransform(scrollVh, (v) =>
    Math.abs(v - cutPointVh) < 3 ? 1 : 0.25,
  );

  return (
    <div className={local.debug}>
      <div className={local.debugFrame} />

      <motion.div className={local.debugStart} style={{ opacity: atStart }}>
        <span className={local.debugTag}>VIDEO CUT-IN</span>
      </motion.div>

      <dl className={local.debugSpec}>
        <Spec label="SCRUB RANGE" value={`${cutPointVh} → ${videoEndVh} VH`} />
        <Spec label="HANDOFF" value={`${videoEndVh} → ${scrubEndVh} VH`} />
        <Spec
          label="PLATE"
          value={`${plate.width}×${plate.height} · ${plate.fps}FPS · ${plate.frames}F`}
        />
        <Spec label="CAMERA" value={`[${camera.position.join(', ')}] FOV ${camera.fov}`} />
        <Spec label="TARGET" value={`[${cameraTarget.join(', ')}]`} />
        <div className={local.debugRow}>
          <dt className={local.debugKey}>FRAME</dt>
          <dd className={local.debugValue}>
            <motion.span>{frame}</motion.span>
          </dd>
        </div>
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
