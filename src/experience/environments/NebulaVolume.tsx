import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Procedural nebula volumes.
 *
 * Three soft shader planes at different depths plus a sparse particle volume.
 * Deliberately faint: these are the one environment still open to an optional
 * art pass (see /public/assets/nebula-* and the README).
 *
 * Everything is driven by uniforms, so replacing this with textured plates
 * later is a swap of the fragment shader, not a rewrite of the chapter.
 */

const PLANES = [
  { z: -9, size: 26, rotation: 0.4, scale: 1.5, speed: 0.9 },
  { z: -17, size: 46, rotation: -0.9, scale: 1.0, speed: 0.55 },
  { z: -30, size: 78, rotation: 1.7, scale: 0.66, speed: 0.3 },
];

const PARTICLES = 700;

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
  uniform float uScale;
  uniform float uShape;   // 0 NOVA, 1 COMET, 2 VOID
  uniform float uLayer;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      total += noise(p) * amplitude;
      p *= 2.03;
      amplitude *= 0.5;
    }
    return total;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;

    // Per-flavour deformation: NOVA blooms, COMET streaks, VOID compresses.
    vec2 warped = uv;
    warped.x *= mix(1.0, 0.34, step(0.5, uShape) * step(uShape, 1.5));
    warped.y *= mix(1.0, 1.45, step(1.5, uShape));

    vec2 p = warped * uScale * 2.2 + vec2(uDrift, uDrift * 0.42 + uLayer * 13.0);
    float n = fbm(p + fbm(p * 0.6) * 0.9);
    n = pow(clamp(n, 0.0, 1.0), 1.55);

    float density = smoothstep(0.08, 0.86, n);

    // Falloff applied *after* the density threshold, so the plane's own edge
    // never shows as an arc. Reaches zero well inside the quad.
    float radial = smoothstep(0.74, 0.04, length(uv));
    radial *= radial;

    vec3 colour = mix(uDeep, uMid, smoothstep(0.0, 0.62, n));
    colour = mix(colour, uCore, smoothstep(0.72, 1.0, n) * 0.4);

    // Deliberately faint: this is atmosphere behind the product, and the
    // blacks in the frame have to stay black.
    float alpha = density * radial * uPresence * mix(0.115, 0.04, uLayer);
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(colour, alpha);
  }
`;

const particleVertex = /* glsl */ `
  attribute float aSeed;
  varying float vSeed;
  uniform float uPixelRatio;
  uniform float uDrift;
  void main() {
    vSeed = aSeed;
    vec3 p = position;
    p.x += sin(uDrift * 0.35 + aSeed * 24.0) * 0.9;
    p.y += cos(uDrift * 0.28 + aSeed * 17.0) * 0.7;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float depthCue = 1.0 + 5.0 / max(8.0, -mvPosition.z);
    gl_PointSize = (0.9 + aSeed * 1.8) * uPixelRatio * depthCue;
  }
`;

const particleFragment = /* glsl */ `
  varying float vSeed;
  uniform vec3 uCore;
  uniform vec3 uMid;
  uniform float uPresence;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float a = pow(clamp(1.0 - length(d) * 2.0, 0.0, 1.0), 2.2);
    if (a < 0.01) discard;
    vec3 colour = mix(uMid, uCore, vSeed);
    gl_FragColor = vec4(colour, a * uPresence * (0.25 + vSeed * 0.5));
  }
`;

export interface NebulaHandle {
  update(
    scrollVh: number,
    presence: number,
    shape: number,
    deep: THREE.Color,
    mid: THREE.Color,
    core: THREE.Color,
  ): void;
}

export const NebulaVolume = forwardRef<NebulaHandle>(function NebulaVolume(_, ref) {
  const groupRef = useRef<THREE.Group>(null);

  const built = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const materials = PLANES.map((plane, index) =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uDeep: { value: new THREE.Color('#081A66') },
          uMid: { value: new THREE.Color('#6B3DFF') },
          uCore: { value: new THREE.Color('#F1EEFF') },
          uPresence: { value: 0 },
          uDrift: { value: 0 },
          uScale: { value: plane.scale },
          uShape: { value: 0 },
          uLayer: { value: index / (PLANES.length - 1) },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    );

    const positions = new Float32Array(PARTICLES * 3);
    const seeds = new Float32Array(PARTICLES);
    for (let i = 0; i < PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.6 + Math.pow(Math.random(), 0.6) * 15;
      positions[i * 3 + 0] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.7;
      positions[i * 3 + 2] = -4 - Math.random() * 34;
      seeds[i] = Math.random();
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    particleGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);

    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uCore: { value: new THREE.Color('#F1EEFF') },
        uMid: { value: new THREE.Color('#6B3DFF') },
        uPresence: { value: 0 },
        uDrift: { value: 0 },
        uPixelRatio: { value: Math.min(1.5, window.devicePixelRatio) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry, materials, particleGeometry, particleMaterial };
  }, []);

  useEffect(
    () => () => {
      built.geometry.dispose();
      built.materials.forEach((m) => m.dispose());
      built.particleGeometry.dispose();
      built.particleMaterial.dispose();
    },
    [built],
  );

  useImperativeHandle(ref, () => ({
    update(scrollVhValue, presence, shape, deep, mid, core) {
      const visible = presence > 0.004;
      if (groupRef.current) groupRef.current.visible = visible;
      if (!visible) return;

      const drift = scrollVhValue * 0.006;
      for (let i = 0; i < built.materials.length; i++) {
        const u = built.materials[i].uniforms;
        u.uPresence.value = presence;
        u.uDrift.value = drift * PLANES[i].speed;
        u.uShape.value = shape;
        u.uDeep.value.copy(deep);
        u.uMid.value.copy(mid);
        u.uCore.value.copy(core);
      }
      const pu = built.particleMaterial.uniforms;
      pu.uPresence.value = presence;
      pu.uDrift.value = drift;
      pu.uMid.value.copy(mid);
      pu.uCore.value.copy(core);
    },
  }));

  return (
    <group ref={groupRef} visible={false} renderOrder={-1}>
      {PLANES.map((plane, i) => (
        <mesh
          key={i}
          geometry={built.geometry}
          material={built.materials[i]}
          position={[0, 0, plane.z]}
          rotation={[0, 0, plane.rotation]}
          scale={[plane.size, plane.size, 1]}
          renderOrder={-10 + i}
          frustumCulled={false}
        />
      ))}
      <points
        geometry={built.particleGeometry}
        material={built.particleMaterial}
        frustumCulled={false}
      />
    </group>
  );
});
