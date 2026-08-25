import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LID_Y } from '../can/canProfile';
import { PRODUCT_LAYER } from '../productLayer';
import { clamp01, smoothstep } from '../../config/easing';

/**
 * Chapter 05 — the energy release, built natively in the scene.
 *
 * This is not a fluid solver and not a plate. Every position, radius and
 * opacity below is a pure function of the scroll-driven tracks handed to
 * `update`, so scrubbing backwards reproduces the forward state exactly and a
 * reload lands on the same frame. Nothing is allocated per frame.
 *
 * The release lives in can space, mounted inside the can's rig, so it stays
 * welded to the real aperture no matter what the can is doing.
 */

/** Mouth of the real aperture, in can-local space. */
const APERTURE = new THREE.Vector3(0, LID_Y, 0.1526);

/**
 * The path the release follows: a loose asymmetric S rising out of the
 * opening. Deliberately short — the top of frame at this camera sits around
 * y = 1.99 in world space, and the rig offsets the can down by 0.12, so the
 * last control point still leaves roughly 100px of headroom at 1440x900.
 */
const PATH_POINTS = [
  new THREE.Vector3(0.0, 1.222, 0.15),
  new THREE.Vector3(0.03, 1.286, 0.176),
  new THREE.Vector3(0.078, 1.352, 0.166),
  new THREE.Vector3(0.096, 1.424, 0.118),
  new THREE.Vector3(0.056, 1.5, 0.076),
  new THREE.Vector3(-0.02, 1.566, 0.078),
  new THREE.Vector3(-0.078, 1.628, 0.132),
  new THREE.Vector3(-0.062, 1.69, 0.196),
];

const TUBULAR_SEGMENTS = 112;
const RADIAL_SEGMENTS = 14;
/** The core form only occupies the lower part of the path; droplets go on. */
const CORE_MAX_U = 0.26;
const DROPLET_COUNT = 9;

/**
 * Core radius along the path. It has to start narrow enough to pass through
 * the aperture (half-width 0.10), swell into a readable body, then taper.
 * Peak diameter is ~0.148 against a 1.112 can body — about 13%, inside the
 * 18% ceiling and well clear of a mushroom silhouette.
 */
function coreRadius(u: number) {
  // Widest just above the lip, then a fast taper: a surge leaving the can,
  // not a cable of constant section.
  const t = clamp01(u / CORE_MAX_U);
  const swell = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.38)), 1.5);
  return 0.009 + 0.04 * swell;
}

/** Deterministic PRNG — the release must be identical on every reload. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shockVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** A thin pressure ring: bright leading edge, soft trailing wake. */
const shockFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uProgress;
  uniform float uOpacity;
  uniform vec3 uCore;
  uniform vec3 uEdge;

  void main() {
    float r = length(vUv - 0.5) * 2.0;
    if (r > 1.0) discard;
    float edge = smoothstep(0.62, 0.99, r) * smoothstep(1.0, 0.93, r);
    float wake = smoothstep(0.2, 0.95, r) * 0.22;
    vec3 colour = mix(uEdge, uCore, edge);
    float alpha = (edge * 0.9 + wake) * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(colour, alpha);
  }
`;

/** Faint violet swell under the sealed flap, before anything breaks. */
const glowFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uOpacity;
  uniform vec3 uColour;

  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float falloff = pow(clamp(1.0 - r, 0.0, 1.0), 2.4);
    float alpha = falloff * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(uColour, alpha);
  }
`;

/**
 * Pressure vapour. Fine points rather than a sprite cloud: each one carries its
 * own direction and falls off on its own curve, so there is no circular sprite
 * boundary anywhere and nothing reads as generic smoke.
 */
const vaporVertex = /* glsl */ `
  attribute vec3 aDir;
  attribute float aSeed;
  attribute float aDrop;
  varying float vSeed;
  varying float vDrop;
  uniform float uProgress;
  uniform float uPixelRatio;

  void main() {
    vSeed = aSeed;
    vDrop = aDrop;
    // Hard initial expansion, then almost nothing: escaping pressure, not wind.
    float t = pow(clamp(uProgress, 0.0, 1.0), 0.42);
    vec3 p = position + aDir * t * (0.055 + aSeed * 0.17);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = mix(2.4 + aSeed * 3.6, 1.2 + aSeed * 1.0, aDrop);
    gl_PointSize = size * uPixelRatio * (9.0 / max(0.8, -mv.z));
  }
`;

const vaporFragment = /* glsl */ `
  varying float vSeed;
  varying float vDrop;
  uniform float uOpacity;
  uniform vec3 uVapor;
  uniform vec3 uDroplet;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d) * 2.0;
    // Soft for vapour, tight for a micro-droplet.
    float soft = pow(clamp(1.0 - r, 0.0, 1.0), mix(2.4, 1.15, vDrop));
    if (soft < 0.01) discard;
    vec3 colour = mix(uVapor, uDroplet, vDrop);
    float a = soft * uOpacity * mix(0.45 + vSeed * 0.55, 1.0, vDrop);
    if (a < 0.003) discard;
    gl_FragColor = vec4(colour, a);
  }
`;

const VAPOR_COUNT = 22;

export interface ReleaseBurstHandle {
  update(
    pressure: number,
    shock: number,
    vapor: number,
    flow: number,
    presence: number,
  ): void;
}

export const ReleaseBurst = forwardRef<ReleaseBurstHandle>(function ReleaseBurst(_, ref) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const dropsRef = useRef<THREE.InstancedMesh>(null);
  const shockRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const vaporRef = useRef<THREE.Points>(null);

  const built = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(PATH_POINTS, false, 'catmullrom', 0.4);

    /* ---- core form ------------------------------------------------- */
    // Built at unit radius, then each ring is scaled to the profile. Doing it
    // once on the CPU keeps the shader stock, so the liquid lights and
    // reflects exactly like the can does.
    const core = new THREE.TubeGeometry(curve, TUBULAR_SEGMENTS, 1, RADIAL_SEGMENTS, false);
    const pos = core.getAttribute('position') as THREE.BufferAttribute;
    const centre = new THREE.Vector3();
    const vertex = new THREE.Vector3();
    for (let i = 0; i <= TUBULAR_SEGMENTS; i++) {
      const u = i / TUBULAR_SEGMENTS;
      curve.getPointAt(u, centre);
      const r = coreRadius(u);
      for (let j = 0; j <= RADIAL_SEGMENTS; j++) {
        const index = i * (RADIAL_SEGMENTS + 1) + j;
        vertex.fromBufferAttribute(pos, index).sub(centre).multiplyScalar(r).add(centre);
        pos.setXYZ(index, vertex.x, vertex.y, vertex.z);
      }
    }
    pos.needsUpdate = true;
    core.computeVertexNormals();
    // Indices run along the path, so a draw range reveals the form growing out
    // of the aperture rather than fading in as a whole.
    const indicesPerRing = RADIAL_SEGMENTS * 6;
    const coreIndexCount = core.getIndex()!.count;

    /* ---- droplets --------------------------------------------------- */
    const droplet = new THREE.IcosahedronGeometry(1, 2);
    const rand = mulberry32(0x1e5a);
    const drops = Array.from({ length: DROPLET_COUNT }, (_, i) => {
      // Three size classes, then broken up so no two read as twins.
      const cls = i % 3;
      const base = cls === 0 ? 0.014 : cls === 1 ? 0.028 : 0.046;
      return {
        launch: 0.015 + rand() * 0.3,
        startU: 0.07 + rand() * 0.13,
        travel: 0.5 + rand() * 0.46,
        size: base * (0.7 + rand() * 0.62),
        aspect: new THREE.Vector3(
          0.86 + rand() * 0.3,
          1.04 + rand() * 0.26,
          0.86 + rand() * 0.3,
        ),
        // Its own divergence direction, biased sideways and forward. Without
        // this every droplet rides the same curve and they read as berries on
        // a stem rather than a field opening out in zero gravity.
        dir: new THREE.Vector3(
          (rand() - 0.5) * 2,
          (rand() - 0.5) * 0.5,
          (rand() - 0.5) * 2.4,
        ).normalize(),
        spreadAmp: 0.07 + rand() * 0.23,
        driftAmp: 0.012 + rand() * 0.03,
        driftFreq: 0.9 + rand() * 1.9,
        phase: rand() * Math.PI * 2,
        spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(2.4),
        tilt: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
      };
    });

    /* ---- shared liquid material ------------------------------------- */
    // Deep violet body with a cobalt sheen at grazing angles and a hard
    // clearcoat, so it reads wet against the same strip-light environment the
    // can uses. Not uniformly emissive: the highlights come from the scene.
    const liquid = new THREE.MeshPhysicalMaterial({
      color: '#3A0F6E',
      roughness: 0.15,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      sheen: 0.78,
      sheenColor: new THREE.Color('#3E7BFF'),
      sheenRoughness: 0.4,
      emissive: new THREE.Color('#25084A'),
      emissiveIntensity: 0.6,
      envMapIntensity: 1.7,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const shockGeometry = new THREE.PlaneGeometry(1, 1);
    const shockMaterial = new THREE.ShaderMaterial({
      vertexShader: shockVertex,
      fragmentShader: shockFragment,
      uniforms: {
        uProgress: { value: 0 },
        uOpacity: { value: 0 },
        uCore: { value: new THREE.Color('#C9A6FF') },
        uEdge: { value: new THREE.Color('#5A2EFF') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    /* ---- pressure vapour --------------------------------------------- */
    const vaporPositions = new Float32Array(VAPOR_COUNT * 3);
    const vaporDirs = new Float32Array(VAPOR_COUNT * 3);
    const vaporSeeds = new Float32Array(VAPOR_COUNT);
    const vaporDrop = new Float32Array(VAPOR_COUNT);
    for (let i = 0; i < VAPOR_COUNT; i++) {
      // Born inside the aperture's mouth, not on a ring around it.
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 0.028;
      vaporPositions[i * 3] = APERTURE.x + Math.cos(a) * r;
      vaporPositions[i * 3 + 1] = LID_Y + 0.004;
      vaporPositions[i * 3 + 2] = APERTURE.z + Math.sin(a) * r * 0.8;
      // Directional: up and out of the opening, with a real spread.
      const sa = rand() * Math.PI * 2;
      const spread = 0.35 + rand() * 0.75;
      vaporDirs[i * 3] = Math.cos(sa) * spread;
      vaporDirs[i * 3 + 1] = 1.0 + rand() * 0.7;
      vaporDirs[i * 3 + 2] = Math.sin(sa) * spread * 0.85;
      vaporSeeds[i] = rand();
      // A quarter of them are bright micro-droplets rather than vapour.
      vaporDrop[i] = rand() < 0.27 ? 1 : 0;
    }
    const vaporGeometry = new THREE.BufferGeometry();
    vaporGeometry.setAttribute('position', new THREE.BufferAttribute(vaporPositions, 3));
    vaporGeometry.setAttribute('aDir', new THREE.BufferAttribute(vaporDirs, 3));
    vaporGeometry.setAttribute('aSeed', new THREE.BufferAttribute(vaporSeeds, 1));
    vaporGeometry.setAttribute('aDrop', new THREE.BufferAttribute(vaporDrop, 1));
    vaporGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0.15), 2);
    const vaporMaterial = new THREE.ShaderMaterial({
      vertexShader: vaporVertex,
      fragmentShader: vaporFragment,
      uniforms: {
        uProgress: { value: 0 },
        uOpacity: { value: 0 },
        uVapor: { value: new THREE.Color('#6A4BD8') },
        uDroplet: { value: new THREE.Color('#C6A8FF') },
        uPixelRatio: { value: Math.min(1.5, window.devicePixelRatio) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const glowGeometry = new THREE.PlaneGeometry(1, 1);
    const glowMaterial = new THREE.ShaderMaterial({
      vertexShader: shockVertex,
      fragmentShader: glowFragment,
      uniforms: {
        uOpacity: { value: 0 },
        uColour: { value: new THREE.Color('#8B4BFF') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return {
      curve,
      core,
      coreIndexCount,
      indicesPerRing,
      droplet,
      drops,
      liquid,
      shockGeometry,
      shockMaterial,
      vaporGeometry,
      vaporMaterial,
      glowGeometry,
      glowMaterial,
      // Scratch, allocated once.
      dummy: new THREE.Object3D(),
      point: new THREE.Vector3(),
    };
  }, []);

  useEffect(
    () => () => {
      built.core.dispose();
      built.droplet.dispose();
      built.liquid.dispose();
      built.shockGeometry.dispose();
      built.shockMaterial.dispose();
      built.vaporGeometry.dispose();
      built.vaporMaterial.dispose();
      built.glowGeometry.dispose();
      built.glowMaterial.dispose();
    },
    [built],
  );

  // The release belongs to the product, so it takes the product light rig and
  // the same environment the can reflects.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.traverse((o) => o.layers.set(PRODUCT_LAYER));
  }, [built]);

  useImperativeHandle(
    ref,
    () => ({
      update(pressure, shock, vapor, flow, presence) {
        const group = groupRef.current;
        if (!group) return;
        group.visible =
          presence > 0.003 || pressure > 0.003 || shock > 0.003 || vapor > 0.003;

        // Every branch below runs whether or not the group is on screen. State
        // that is only refreshed while visible goes stale the moment you scroll
        // past it, and then scrubbing back lands on a different frame than
        // scrubbing forward did.
        built.liquid.opacity = 0.94 * presence;

        /* ---- core form: grows out of the aperture, then hands over ---- */
        const core = coreRef.current;
        if (core) {
          const reveal = clamp01(flow / CORE_MAX_U);
          const rings = Math.round(reveal * TUBULAR_SEGMENTS);
          const count = Math.min(built.coreIndexCount, rings * built.indicesPerRing);
          built.core.setDrawRange(0, count);
          core.visible = count > 0 && presence > 0.003;
        }

        /* ---- droplets ------------------------------------------------ */
        const drops = dropsRef.current;
        if (drops) {
          drops.visible = presence > 0.003;
          {
            const { dummy, point, curve } = built;
            for (let i = 0; i < DROPLET_COUNT; i++) {
              const d = built.drops[i];
              // Each droplet launches at its own moment and decelerates hard —
              // pressure-driven impulse, then suspension. No gravity term.
              const t = clamp01((flow - d.launch) / Math.max(0.08, 1 - d.launch));
              const eased = 1 - Math.pow(1 - t, 2.7);
              const u = Math.min(0.999, d.startU + eased * d.travel);
              curve.getPointAt(u, point);

              // Divergence grows faster than travel, so the field fans open as
              // it decelerates rather than staying strung along one line.
              point.addScaledVector(d.dir, Math.pow(eased, 1.25) * d.spreadAmp);
              const drift = eased * d.driftAmp;
              point.x += Math.sin(eased * d.driftFreq + d.phase) * drift;
              point.z += Math.cos(eased * d.driftFreq * 0.78 + d.phase) * drift * 0.72;

              dummy.position.copy(point);
              dummy.rotation.set(
                d.tilt.x + d.spin.x * eased,
                d.tilt.y + d.spin.y * eased,
                d.tilt.z + d.spin.z * eased,
              );
              // Pop in over the first slice of travel so nothing appears fully
              // formed out of nowhere.
              const s = d.size * smoothstep(0, 0.16, t);
              dummy.scale.set(s * d.aspect.x, s * d.aspect.y, s * d.aspect.z);
              dummy.updateMatrix();
              drops.setMatrixAt(i, dummy.matrix);
            }
            drops.instanceMatrix.needsUpdate = true;
          }
        }

        /* ---- pressure shockwave -------------------------------------- */
        const shockMesh = shockRef.current;
        if (shockMesh) {
          const spread = 0.13 + shock * 0.42;
          // A touch of ellipticity so it never reads as a clean CSS circle.
          shockMesh.scale.set(spread, spread * (0.82 + shock * 0.1), 1);
          built.shockMaterial.uniforms.uProgress.value = shock;
          built.shockMaterial.uniforms.uOpacity.value = (1 - shock) * (1 - shock) * 0.9;
          shockMesh.visible = shock > 0.004 && shock < 0.997;
        }

        /* ---- pressure vapour ----------------------------------------- */
        const vaporPoints = vaporRef.current;
        if (vaporPoints) {
          // Expansion runs on its own clock so the burst can outrun its own
          // fade — the puff is already wide by the time it goes.
          built.vaporMaterial.uniforms.uProgress.value = clamp01(1 - vapor) * 0.85 + 0.15;
          built.vaporMaterial.uniforms.uOpacity.value = vapor * 0.62;
          vaporPoints.visible = vapor > 0.004;
        }

        /* ---- pre-break pressure glow --------------------------------- */
        const glowMesh = glowRef.current;
        if (glowMesh) {
          const s = 0.17 + pressure * 0.05;
          glowMesh.scale.set(s, s * 0.62, 1);
          built.glowMaterial.uniforms.uOpacity.value = pressure * 0.42;
          glowMesh.visible = pressure > 0.004;
        }
      },
    }),
    [built],
  );

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={coreRef} geometry={built.core} material={built.liquid} frustumCulled={false} />

      <instancedMesh
        ref={dropsRef}
        args={[built.droplet, built.liquid, DROPLET_COUNT]}
        frustumCulled={false}
      />

      <points
        ref={vaporRef}
        geometry={built.vaporGeometry}
        material={built.vaporMaterial}
        frustumCulled={false}
        visible={false}
      />

      {/* Pressure ring, laid in the lid plane so the shallow release camera
          sees it as an expanding ellipse across the metal. */}
      <mesh
        ref={shockRef}
        geometry={built.shockGeometry}
        material={built.shockMaterial}
        position={[APERTURE.x, LID_Y + 0.006, APERTURE.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        frustumCulled={false}
      />

      {/* Swell under the sealed flap, before it gives way. */}
      <mesh
        ref={glowRef}
        geometry={built.glowGeometry}
        material={built.glowMaterial}
        position={[APERTURE.x, LID_Y + 0.004, APERTURE.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        frustumCulled={false}
      />
    </group>
  );
});
