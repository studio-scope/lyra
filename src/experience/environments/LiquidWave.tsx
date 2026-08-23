import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * PLACEHOLDER ENVIRONMENT — Phase 1.
 *
 * A settled violet liquid surface suggested with gradients and soft shader
 * distortion, standing in for the Phase 2 CTA plate.
 *
 * This is a compositional plate, not a physical object, so it is pinned to the
 * camera and refitted to the frustum every frame. `SURFACE_HEIGHT` is then a
 * literal fraction of the viewport, which is the only way to guarantee the
 * waterline sits clear of the CTA copy at any camera position or aspect.
 */

/** Waterline height, as a fraction of the viewport measured from the bottom. */
const SURFACE_HEIGHT = 0.22;
const DISTANCE = 3;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uCore;
  uniform float uPresence;
  uniform float uDrift;
  uniform float uSurface;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 uv = vUv;

    // Long, slow swells — a settled surface, not a churning sea.
    float swell =
      sin(uv.x * 3.1 + uDrift * 0.6) * 0.014 +
      sin(uv.x * 6.7 - uDrift * 0.42) * 0.007 +
      noise(vec2(uv.x * 3.0, uDrift * 0.18)) * 0.016;

    float surface = uSurface + swell;

    // Brightest just under the waterline, falling away into the deep.
    float depth = smoothstep(surface, surface - 0.2, uv.y);
    float body = smoothstep(surface + 0.008, surface - 0.03, uv.y) * (1.0 - depth * 0.88);

    // A thin crest, kept dim so it never reads as a neon stripe.
    float crest = smoothstep(surface + 0.016, surface, uv.y) *
                  smoothstep(surface - 0.022, surface, uv.y);

    vec3 colour = mix(uMid, uDeep, depth);
    colour = mix(colour, uCore, crest * 0.3);

    // Falloff on every edge so the plate never shows as a rectangle or a band.
    float sides = smoothstep(0.0, 0.32, uv.x) * smoothstep(1.0, 0.68, uv.x);
    float bottom = smoothstep(-0.06, 0.1, uv.y);

    // Additive blending through ACES lifts mid values hard, so these
    // coefficients are lower than they look.
    float alpha = (body * 0.28 + crest * 0.3) * sides * bottom * uPresence;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(colour, alpha);
  }
`;

export interface LiquidHandle {
  update(
    scrollVh: number,
    presence: number,
    deep: THREE.Color,
    mid: THREE.Color,
    core: THREE.Color,
    camera: THREE.PerspectiveCamera,
  ): void;
}

export const LiquidWave = forwardRef<LiquidHandle>(function LiquidWave(_, ref) {
  const meshRef = useRef<THREE.Mesh>(null);

  const built = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uDeep: { value: new THREE.Color('#250036') },
        uMid: { value: new THREE.Color('#7127FF') },
        uCore: { value: new THREE.Color('#F6E8FF') },
        uPresence: { value: 0 },
        uDrift: { value: 0 },
        uSurface: { value: SURFACE_HEIGHT },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, []);

  useEffect(
    () => () => {
      built.geometry.dispose();
      built.material.dispose();
    },
    [built],
  );

  useImperativeHandle(ref, () => ({
    update(scrollVhValue, presence, deep, mid, core, camera) {
      const mesh = meshRef.current;
      if (!mesh) return;
      mesh.visible = presence > 0.004;
      if (!mesh.visible) return;

      const u = built.material.uniforms;
      u.uPresence.value = presence;
      u.uDrift.value = scrollVhValue * 0.05;
      u.uDeep.value.copy(deep);
      u.uMid.value.copy(mid);
      u.uCore.value.copy(core);

      // Pin to the camera and refit to the current frustum.
      mesh.quaternion.copy(camera.quaternion);
      mesh.position
        .set(0, 0, -DISTANCE)
        .applyQuaternion(camera.quaternion)
        .add(camera.position);
      const height = 2 * DISTANCE * Math.tan((camera.fov * Math.PI) / 360);
      mesh.scale.set(height * camera.aspect * 1.02, height * 1.02, 1);
      mesh.updateMatrixWorld();
    },
  }));

  return (
    <mesh
      ref={meshRef}
      geometry={built.geometry}
      material={built.material}
      renderOrder={-20}
      frustumCulled={false}
      visible={false}
    />
  );
});
