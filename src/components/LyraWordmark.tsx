import styles from './LyraWordmark.module.css';
import { COPY } from '../config/copy';

/**
 * The LYRA wordmark — live type, never an image and never a symbol.
 *
 * Syncopate Bold: wide, geometric and heavy enough to hold a frame on its own,
 * which the previous thin treatment could not. Tracking is pulled to -0.075em
 * so the four letters lock into one mass instead of reading as four shapes,
 * and the 1.04 horizontal scale restores the width that tightening removes.
 *
 * No glow, no gradient, no shadow, no icon, no slash. Any bloom in frame
 * belongs to the environment behind it.
 *
 * The same treatment is used for the can label (see canLabelTexture.ts, which
 * draws this face into a CanvasTexture) so print and screen stay identical.
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
    <span
      className={[styles.wordmark, styles[size], className].filter(Boolean).join(' ')}
    >
      {COPY.brand}
    </span>
  );
}
