import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Procedural nebula volumes.
 *
 * Three planes, but **not three copies of one shape** — that was the previous
 * version's problem, and it is why the chapter read as one large radial
 * gradient. Each plane now has a distinct structural job:
 *
 *   role 0, near  — filaments: ridged noise, sharp, sparse, highest contrast;
 *   role 1, mid   — body: domain-warped fbm carrying the mass of the form;
 *   role 2, far   — haze: very low frequency, very faint, pure depth.
 *
 * They sit at different z and drift at different rates, so the parallax is real
 * rather than implied.
 *
 * Two things keep black dominant. A low-frequency **coverage mask** confines
 * each layer to selected regions instead of filling the viewport, and the
 * radial falloff is **broken by noise** so no layer ever shows a clean arc or
 * reads as a circle stacked over another circle.
 *
 * Everything is a pure function of scroll position and a fixed seed, so reverse
 * scrubbing reproduces the frame exactly.
 */

const PLANES = [
  { z: -9, size: 26, rotation: 0.4, scale: 1.5, speed: 0.9 },
  { z: -17, size: 46, rotation: -0.9, scale: 1.0, speed: 0.55 },
  { z: -30, size: 78, rotation: 1.7, scale: 0.66, speed: 0.3 },
];

const PARTICLES = 700;

/** Deterministic PRNG — the dust must be identical on every reload. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uCore;
  uniform float uPresence;
  uniform float uDrift;
  uniform float uScale;
  uniform float uShape;   // 0 NOVA, 1 COMET, 2 VOID
  uniform float uRole;    // 0 filaments, 1 body, 2 haze
  uniform float uGain;    // restraint multiplier

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

  float fbm(vec2 p, int octaves) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      total += noise(p) * amplitude;
      p *= 2.03;
      amplitude *= 0.5;
    }
    return total;
  }

  /** Ridged noise: creases instead of blobs. This is what makes filaments. */
  float ridged(vec2 p, int octaves) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      float n = 1.0 - abs(noise(p) * 2.0 - 1.0);
      total += n * n * amplitude;
      p *= 2.11;
      amplitude *= 0.5;
    }
    return total;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;

    /* ---- per-flavour space deformation ----------------------------- */
    // NOVA compresses toward the centre (ignition pressure), COMET stretches
    // hard along X (high-speed passage), VOID opens out and slows down.
    vec2 q = uv;
    float isNova  = 1.0 - step(0.5, uShape);
    float isComet = step(0.5, uShape) * (1.0 - step(1.5, uShape));
    float isVoid  = step(1.5, uShape);

    q *= mix(1.0, 1.34, isNova);
    q.x *= mix(1.0, 0.30, isComet);
    q.y *= mix(1.0, 1.18, isComet);
    q *= mix(1.0, 0.86, isVoid);

    float drift = uDrift;
    vec2 flow = vec2(drift, drift * 0.38 + uRole * 11.0);
    // COMET's flow is lateral, which turns its stretched cells into passage.
    flow.x += drift * isComet * 1.9;

    vec2 p = q * uScale * 2.2 + flow;

    /* ---- structure, by role ---------------------------------------- */
    float n;
    if (uRole < 0.5) {
      // Filaments. Domain-warped ridges, thresholded hard so only the
      // brightest creases survive as thin bright strands.
      vec2 w = p * 1.35;
      w += vec2(fbm(p * 0.7, 3), fbm(p * 0.7 + 5.2, 3)) * 1.15;
      n = ridged(w, 4);
      n = smoothstep(0.34, 0.74, n);
      n = pow(n, mix(1.0, 0.78, isNova));
    } else if (uRole < 1.5) {
      // Body. The mass of the cloud, domain-warped so it is never symmetric.
      vec2 w = p + fbm(p * 0.6, 3) * 0.95;
      n = fbm(w, 4);
      n = smoothstep(0.30, 0.60, n);
    } else {
      // Haze. Low frequency only — this layer exists to separate depth.
      n = fbm(p * 0.42, 2);
      n = smoothstep(0.26, 0.62, n);
    }

    /* ---- coverage: selected regions, never the whole frame ---------- */
    // Without this the layer fills the viewport and black stops being the
    // dominant colour. The threshold is the single strongest restraint here.
    float cov = fbm(q * 0.85 + vec2(uRole * 7.3, drift * 0.22), 3);
    float coverage = smoothstep(0.30, 0.56, cov);

    /* ---- irregular falloff: no clean arcs, no stacked circles ------- */
    float r = length(uv * vec2(1.0, 1.12));
    r += (fbm(uv * 1.7 + uRole * 3.1, 3) - 0.5) * 0.62;
    float edge = smoothstep(1.05, 0.20, r);
    edge *= edge;

    float density = n * coverage * edge;

    /* ---- VOID: a real pocket of negative space, off axis ------------ */
    float hole = 1.0;
    if (isVoid > 0.5) {
      vec2 c = uv - vec2(-0.22, 0.05);
      float hr = length(c * vec2(1.0, 1.25));
      hr += (fbm(uv * 2.3, 3) - 0.5) * 0.30;
      hole = smoothstep(0.10, 0.62, hr);
    }
    density *= hole;

    /* ---- colour ------------------------------------------------------ */
    vec3 colour = mix(uDeep, uMid, smoothstep(0.0, 0.58, n));
    // Localised glow: the core tint only appears where the structure is
    // genuinely dense, which keeps it a highlight rather than a wash.
    float hot = smoothstep(0.74, 1.0, n) * mix(0.30, 0.52, isNova);
    colour = mix(colour, uCore, hot);

    // Per-role, per-flavour intensity. Filaments carry the contrast, haze is
    // barely there. NOVA is the brightest of the three, VOID the darkest.
    float roleGain = uRole < 0.5 ? 0.155 : (uRole < 1.5 ? 0.130 : 0.068);
    float flavourGain = mix(1.0, 1.12, isNova) * mix(1.0, 0.80, isVoid);

    float alpha = density * uPresence * roleGain * flavourGain * uGain;
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
  uniform float uGain;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float a = pow(clamp(1.0 - length(d) * 2.0, 0.0, 1.0), 2.2);
    if (a < 0.01) discard;
    vec3 colour = mix(uMid, uCore, vSeed);
    gl_FragColor = vec4(colour, a * uPresence * (0.22 + vSeed * 0.42) * uGain);
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

/**
 * One dial for the whole environment's loudness, so a restraint pass is a
 * single number rather than a hunt through per-layer constants.
 */
const NEBULA_GAIN = 0.75;

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
          uRole: { value: index },
          uGain: { value: NEBULA_GAIN },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    );

    // Seeded, not Math.random: an unseeded dust field changes on every reload
    // and makes any QA capture of this chapter unreproducible.
    const rand = mulberry32(0x4c59a2);
    const positions = new Float32Array(PARTICLES * 3);
    const seeds = new Float32Array(PARTICLES);
    for (let i = 0; i < PARTICLES; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 2.6 + Math.pow(rand(), 0.6) * 15;
      positions[i * 3 + 0] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.7;
      positions[i * 3 + 2] = -4 - rand() * 34;
      seeds[i] = rand();
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
        uGain: { value: NEBULA_GAIN },
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
