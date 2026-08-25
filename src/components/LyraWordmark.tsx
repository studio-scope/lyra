import styles from './LyraWordmark.module.css';
import {
  LYRA_WORDMARK_HEIGHT,
  LYRA_WORDMARK_PATH,
  LYRA_WORDMARK_WIDTH,
} from '../config/wordmark';

/**
 * The LYRA wordmark — the canonical vector, never type and never an image.
 *
 * This used to set the word in Syncopate Bold. It no longer does: the mark is a
 * custom drawing (see `src/config/wordmark.ts`) and the same path is what the
 * can label draws into its texture, so the horizontal wordmark on screen and
 * the vertical one on the can are provably the same artwork.
 *
 * Sized by **width**, not font-size, and the viewBox carries the aspect — so
 * the mark scales as one object and the blade off the A can never be clipped by
 * a line-height. No glow, no gradient, no shadow, no icon, no slash: any bloom
 * in frame belongs to the environment behind it.
 */

interface Props {
  /**
   * `hero` — the chapter 01 reveal.
   * `cta`  — the closing lockup; the heaviest instance on the site.
   */
  size?: 'hero' | 'cta';
  className?: string;
}

export function LyraWordmark({ size = 'hero', className }: Props) {
  return (
    <svg
      className={[styles.wordmark, styles[size], className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${LYRA_WORDMARK_WIDTH} ${LYRA_WORDMARK_HEIGHT}`}
      role="img"
      aria-label="LYRA"
      focusable="false"
    >
      {/* Even-odd is required: the tracer's winding is arbitrary, and nonzero
          fills the A's triangular counter solid. */}
      <path d={LYRA_WORDMARK_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
