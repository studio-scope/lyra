import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Three star depth layers.
 *
 * Each layer streams toward the camera at its own rate and wraps in the vertex
 * shader, so the field is effectively infinite for zero CPU cost. The parallax
 * between layers is what sells depth during the asteroid run.
 */

interface LayerSpec {
  count: number;
  spread: number;
  zNear: number;
  zFar: number;
  speed: number;
  size: number;
  brightness: number;
}

/** `size` is in CSS pixels — stars are effectively at infinity, so they are
 *  sized per layer rather than by perspective attenuation. */
const LAYERS: LayerSpec[] = [
  { count: 1100, spread: 110, zNear: -40, zFar: -130, speed: 0.055, size: 1.35, brightness: 0.5 },
  { count: 620, spread: 66, zNear: -18, zFar: -62, speed: 0.15, size: 1.85, brightness: 0.72 },
  { count: 260, spread: 44, zNear: -3, zFar: -26, speed: 0.36, size: 2.5, brightness: 0.95 },
];

const vertexShader = /* glsl */ `
  attribute float aSeed;
  varying float vSeed;
  uniform float uScroll;
  uniform float uSpeed;
  uniform float uZMin;
  uniform float uSpan;
  uniform float uSize;
  uniform float uPixelRatio;

  void main() {
    vSeed = aSeed;
    vec3 p = position;
    float z = p.z + uScroll * uSpeed;
    p.z = mod(z - uZMin, uSpan) + uZMin;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Near-constant screen size with a light depth cue. Full perspective
    // attenuation across this z range would turn the near layer into blobs.
    float depthCue = 1.0 + 9.0 / max(10.0, -mvPosition.z);
    gl_PointSize = uSize * uPixelRatio * depthCue * (0.72 + aSeed * 0.6);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vSeed;
  uniform float uIntensity;
  uniform float uBrightness;
  uniform vec3 uTint;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = dot(d, d) * 4.0;
    // Crisp core, very short falloff — stars, not glow blobs.
    float a = clamp(1.0 - r, 0.0, 1.0);
    a = pow(a, 2.4);
    if (a < 0.01) discard;
    vec3 colour = mix(vec3(0.95, 0.94, 0.91), uTint, vSeed * 0.45);
    gl_FragColor = vec4(colour, a * uIntensity * uBrightness);
  }
`;

export interface StarsHandle {
  update(scrollVh: number, intensity: number, tint: THREE.Color): void;
}

export const StarLayers = forwardRef<StarsHandle>(function StarLayers(_, ref) {
  // Everything the update loop touches comes out of this memo directly.
  // Writing the materials into a ref from inside the factory would be a
  // render-time side effect, and StrictMode's double invocation can leave the
  // ref holding a different set of materials than the ones actually committed
  // to the scene — which silently freezes every uniform at its initial value.
  const layers = useMemo(() => {
    return LAYERS.map((spec) => {
      const positions = new Float32Array(spec.count * 3);
      const seeds = new Float32Array(spec.count);
      const span = spec.zNear - spec.zFar; // positive
      for (let i = 0; i < spec.count; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * spec.spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spec.spread * 0.72;
        positions[i * 3 + 2] = spec.zFar + Math.random() * span;
        seeds[i] = Math.random();
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uScroll: { value: 0 },
          uSpeed: { value: spec.speed },
          uZMin: { value: spec.zFar },
          uSpan: { value: span },
          uSize: { value: spec.size },
          uPixelRatio: { value: Math.min(1.5, window.devicePixelRatio) },
          uIntensity: { value: 0 },
          uBrightness: { value: spec.brightness },
          uTint: { value: new THREE.Color('#A56BFF') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      return { geometry, material };
    });
  }, []);

  useEffect(
    () => () =>
      layers.forEach(({ geometry, material }) => {
        geometry.dispose();
        material.dispose();
      }),
    [layers],
  );

  useImperativeHandle(ref, () => ({
    update(scrollVhValue, intensity, tint) {
      for (const { material } of layers) {
        material.uniforms.uScroll.value = scrollVhValue;
        material.uniforms.uIntensity.value = intensity;
        material.uniforms.uTint.value.copy(tint);
      }
    },
  }));

  return (
    <group>
      {layers.map(({ geometry, material }, i) => (
        <points key={i} geometry={geometry} material={material} frustumCulled={false} />
      ))}
    </group>
  );
});
