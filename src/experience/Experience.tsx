import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { SceneController } from './SceneController';
import { FLAVORS, type FlavorId } from '../config/flavors';
import { GLOBAL } from '../config/colors';
import styles from './Experience.module.css';

/**
 * One fixed full-viewport canvas for the entire site. The can, the trail and
 * every environment are mounted exactly once and live for the whole session.
 */

interface Props {
  flavor: FlavorId;
}

/** `?capture=1` — see the `preserveDrawingBuffer` note on the Canvas below. */
const CAPTURE_MODE =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('capture');

/**
 * Procedural studio environment. Rebaked only when the flavour changes — which
 * always happens inside a warp flash — so nothing is re-rendered per frame.
 */
function StudioEnvironment({ flavor }: { flavor: FlavorId }) {
  const palette = FLAVORS[flavor].palette;
  return (
    <Environment key={flavor} resolution={256} frames={1}>
      {/* A cylindrical metal product wants tall narrow strip lights, not broad
          softboxes: each strip becomes one crisp vertical specular band, which
          is what makes the silhouette read as aluminium. */}

      {/* Soft overhead, behind — gradients the shoulder without blowing it. */}
      <Lightformer
        form="rect"
        intensity={0.95}
        color="#FFF6E8"
        position={[0, 7, -4]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[11, 11, 1]}
      />
      {/* Neutral key strip, camera-left. */}
      <Lightformer
        form="rect"
        intensity={4.6}
        color="#FFFBF2"
        position={[-2.5, 0.2, 4.2]}
        rotation={[0, 0.52, 0]}
        scale={[0.72, 6.5, 1]}
      />
      {/* Neutral fill strip, camera-right. */}
      <Lightformer
        form="rect"
        intensity={2.4}
        color="#EFEDF5"
        position={[2.7, 0.4, 3.4]}
        rotation={[0, -0.62, 0]}
        scale={[0.48, 6.5, 1]}
      />
      {/* Flavour strips, wide of the can — the only chromatic reflections. */}
      <Lightformer
        form="rect"
        intensity={3.6}
        color={palette.ultraviolet}
        position={[-4.1, 0.6, -1.1]}
        rotation={[0, Math.PI / 2.3, 0]}
        scale={[0.55, 6.5, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.5}
        color={palette.cobalt}
        position={[4.1, -0.4, -1.3]}
        rotation={[0, -Math.PI / 2.3, 0]}
        scale={[0.45, 6.5, 1]}
      />
      {/* Deep black surround keeps the darks genuinely black. */}
      <mesh scale={40}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={GLOBAL.spaceBlack} side={THREE.BackSide} />
      </mesh>
    </Environment>
  );
}

export function Experience({ flavor }: Props) {
  return (
    <div className={styles.canvasLayer} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        // In capture mode the render loop is driven by hand through
        // `state.advance`, so a QA frame is deterministic and does not depend on
        // requestAnimationFrame running (it does not, in a background tab).
        frameloop={CAPTURE_MODE ? 'never' : 'always'}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          // Opt-in only (`?capture=1`): keeping the drawing buffer costs
          // performance, so the recording state never pays for it. With the
          // flag on, the canvas can be read back with toDataURL — which is how
          // reference stills and QA frames get captured.
          preserveDrawingBuffer: CAPTURE_MODE,
        }}
        camera={{ position: [0, -0.2, 2.4], fov: 30, near: 0.08, far: 320 }}
        onCreated={(state) => {
          state.gl.setClearColor(GLOBAL.spaceBlack, 1);
          state.scene.background = new THREE.Color(GLOBAL.spaceBlack);
          if (import.meta.env.DEV) {
            // Dev-only handle for visual QA. Stripped from production builds.
            (window as unknown as { __lyra?: unknown }).__lyra = state;
          }
        }}
      >
        <Suspense fallback={null}>
          <StudioEnvironment flavor={flavor} />
          <SceneController flavor={flavor} />
        </Suspense>

        <EffectComposer enableNormalPass={false} multisampling={4}>
          {/* Restrained: only genuine highlights bloom, blacks stay black. */}
          <Bloom
            intensity={0.38}
            luminanceThreshold={0.93}
            luminanceSmoothing={0.16}
            radius={0.45}
            mipmapBlur
          />
          <Vignette offset={0.3} darkness={0.62} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
