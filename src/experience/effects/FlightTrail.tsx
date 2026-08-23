import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CAN_POSITION, CAN_SCALE } from '../../config/choreography';
import { sampleNumber, sampleVec3, type Vec3 } from '../../config/timeline';

/**
 * The can's flight trail — the continuity device for the whole experience.
 *
 * The ribbon is built by re-sampling the can's own position track at fixed
 * *scroll* intervals behind the current position, not by recording frames.
 * That matters:
 *
 *   - the trail has the same length whether you scroll slowly or flick;
 *   - it persists when the user stops to read, instead of collapsing;
 *   - scrubbing backward reverses it exactly, with no history to unwind;
 *   - fast scrolling can never tear it, because there is no per-frame history
 *     to skip over.
 *
 * Samples clamp at vh 0, which is the Vega ignition point — so the trail
 * literally originates there.
 */

const SAMPLES = 72;
/** Scroll distance the ribbon reaches back, in virtual vh. */
const TRAIL_VH = 18;
const STEP = TRAIL_VH / (SAMPLES - 1);
// Narrow on purpose: at the can's 0.96-unit diameter this reads as a thin
// exhaust streak rather than a neon cable.
const HEAD_WIDTH = 0.068;
/** Offset from the can's centre down to its base, in local units. */
const BASE_OFFSET = 1.22;

export interface TrailHandle {
  update(
    vh: number,
    /** World-frame flight speed in Z units per vh (see TRAIL_DRIFT). */
    drift: number,
    cameraPosition: THREE.Vector3,
    intensity: number,
    core: THREE.Color,
    edge: THREE.Color,
  ): void;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uCore;
  uniform vec3 uEdge;
  uniform float uIntensity;

  void main() {
    float along = 1.0 - vUv.x;                 // 1 at the can, 0 at the tail
    float across = abs(vUv.y - 0.5) * 2.0;
    float core = pow(max(0.0, 1.0 - across), 3.0);
    float body = pow(max(0.0, 1.0 - across), 1.15);
    float lengthFade = pow(along, 1.6);

    vec3 colour = mix(uEdge, uCore, core);
    float alpha = (body * 0.3 + core * 0.72) * lengthFade * uIntensity;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(colour * (0.45 + core * 0.95), alpha);
  }
`;

export const FlightTrail = forwardRef<TrailHandle>(function FlightTrail(_, ref) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(SAMPLES * 2 * 3);
    const uvs = new Float32Array(SAMPLES * 2 * 2);
    const indices: number[] = [];

    for (let i = 0; i < SAMPLES; i++) {
      const u = i / (SAMPLES - 1);
      uvs[i * 4 + 0] = u;
      uvs[i * 4 + 1] = 0;
      uvs[i * 4 + 2] = u;
      uvs[i * 4 + 3] = 1;
      if (i < SAMPLES - 1) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uCore: { value: new THREE.Color('#F1EEFF') },
        uEdge: { value: new THREE.Color('#2342FF') },
        uIntensity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    return { geometry: geo, material: mat };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  /** Path points, resolved fresh each frame. No allocation in the loop. */
  const path = useMemo(
    () => Array.from({ length: SAMPLES }, () => new THREE.Vector3()),
    [],
  );
  const scratch = useMemo(
    () => ({
      sample: [0, 0, 0] as Vec3,
      dir: new THREE.Vector3(),
      view: new THREE.Vector3(),
      side: new THREE.Vector3(),
    }),
    [],
  );

  useImperativeHandle(ref, () => ({
    update(vh, drift, cameraPosition, intensity, core, edge) {
      const mesh = meshRef.current;
      if (!mesh) return;

      material.uniforms.uIntensity.value = intensity;
      material.uniforms.uCore.value.copy(core);
      material.uniforms.uEdge.value.copy(edge);
      mesh.visible = intensity > 0.004;
      if (!mesh.visible) return;

      // Resolve the can's path behind the current scroll position.
      for (let i = 0; i < SAMPLES; i++) {
        const at = Math.max(0, vh - i * STEP);
        sampleVec3(CAN_POSITION, at, scratch.sample);
        const scale = sampleNumber(CAN_SCALE, at);
        // Older samples sit further back along the flight path, which in the
        // world frame means further along +Z behind the can.
        path[i].set(
          scratch.sample[0],
          scratch.sample[1] - BASE_OFFSET * scale,
          scratch.sample[2] + i * STEP * drift,
        );
      }

      const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
      const array = positions.array as Float32Array;
      const { dir, view, side } = scratch;

      for (let i = 0; i < SAMPLES; i++) {
        const p = path[i];
        const prev = path[Math.max(0, i - 1)];
        const next = path[Math.min(SAMPLES - 1, i + 1)];
        dir.subVectors(prev, next);
        if (dir.lengthSq() < 1e-10) dir.set(0, 1, 0);
        dir.normalize();

        view.subVectors(cameraPosition, p).normalize();
        side.crossVectors(dir, view);
        if (side.lengthSq() < 1e-10) side.set(1, 0, 0);
        side.normalize();

        const t = i / (SAMPLES - 1);
        const width = HEAD_WIDTH * Math.pow(1 - t, 1.25);
        const o = i * 6;
        array[o + 0] = p.x - side.x * width;
        array[o + 1] = p.y - side.y * width;
        array[o + 2] = p.z - side.z * width;
        array[o + 3] = p.x + side.x * width;
        array[o + 4] = p.y + side.y * width;
        array[o + 5] = p.z + side.z * width;
      }
      positions.needsUpdate = true;
    },
  }));

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={2}
      visible={false}
    />
  );
});
