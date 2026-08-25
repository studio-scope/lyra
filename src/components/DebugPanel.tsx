import { useEffect, useState } from 'react';
import styles from './DebugPanel.module.css';
import { sceneReadout } from '../hooks/useDebug';
import { scrollState } from '../hooks/useScroll';
import { chapterAt, flavorAt, TOTAL_VH } from '../config/timeline';
import { RELEASE_FRAMING } from '../config/choreography';

/**
 * Development readout. Hidden by default — `D` toggles it.
 *
 * Polls at 8 Hz from plain mutable objects; it never subscribes to the frame
 * loop, so having it open does not change what it is measuring.
 */

const fmt = (v: number, digits = 2) => v.toFixed(digits);

export function DebugPanel() {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 125);
    return () => window.clearInterval(id);
  }, []);

  const vh = scrollState.vh;
  const chapter = chapterAt(vh);
  const flavor = flavorAt(vh);
  const inScrub = vh >= RELEASE_FRAMING.scrubStartVh && vh <= RELEASE_FRAMING.scrubEndVh;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>LYRA · DEV</span>
        <span className={styles.hint}>D PANEL</span>
      </div>

      <Row label="PROGRESS" value={`${fmt(scrollState.progress * 100, 1)}%`} />
      <Row label="SCROLL" value={`${fmt(vh, 1)} / ${TOTAL_VH} VH`} />
      <Row label="VELOCITY" value={`${fmt(scrollState.velocity, 2)} VH/F`} />
      <Row label="CHAPTER" value={`${chapter.index} ${chapter.label}`} />
      <Row label="FLAVOR" value={flavor.toUpperCase()} />
      <Row label="FPS" value={String(sceneReadout.fps)} />
      <Row
        label="CAN"
        value={sceneReadout.canPosition.map((v) => fmt(v)).join(' ')}
      />
      <Row
        label="CAMERA"
        value={sceneReadout.cameraPosition.map((v) => fmt(v)).join(' ')}
      />
      <Row label="FOV" value={fmt(sceneReadout.fov, 1)} />
      <Row label="WARP" value={fmt(sceneReadout.warp)} />

      <div className={styles.section}>OPEN &amp; POUR</div>
      <Row
        label="RELEASE"
        value={`${RELEASE_FRAMING.cutPointVh} → ${RELEASE_FRAMING.releaseEndVh} VH`}
      />
      <Row label="IN RANGE" value={inScrub ? 'YES' : 'NO'} highlight={inScrub} />
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.key}>{label}</span>
      <span className={highlight ? styles.valueActive : styles.value}>{value}</span>
    </div>
  );
}
