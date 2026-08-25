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
 *
 * **Shape rule:** there is no path and no tube. An earlier build swept a
 * TubeGeometry along a long spline, which read as a rope with the droplets
 * strung along it like berries on a stem. Here the body is one compact lobed
 * mass sitting on the opening, and every droplet flies its own straight
 * trajectory out of the aperture. Nothing shares a curve, so nothing can line
 * up into a strand.
 */

/** Mouth of the real aperture, in can-local space. */
const APERTURE = new THREE.Vector3(0, LID_Y, 0.1526);

const DROPLET_COUNT = 11;
const VAPOR_COUNT = 34;

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

/**
 * The main mass: swells out of the opening, then collapses as the droplets
 * carry the volume away. Peaks early and is gone well before the CTA.
 */
function bodyScale(flow: number) {
  const rise = smoothstep(0, 0.16, flow);
  const fall = 1 - smoothstep(0.34, 0.78, flow);
  return rise * fall;
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
 * Pressure mist. Fine points rather than a sprite cloud: each one carries its
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
    vec3 p = position + aDir * t * (0.04 + aSeed * 0.13);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = mix(2.0 + aSeed * 3.0, 1.1 + aSeed * 0.9, aDrop);
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
    // Soft for mist, tight for a micro-droplet.
    float soft = pow(clamp(1.0 - r, 0.0, 1.0), mix(2.4, 1.15, vDrop));
    if (soft < 0.01) discard;
    vec3 colour = mix(uVapor, uDroplet, vDrop);
    float a = soft * uOpacity * mix(0.45 + vSeed * 0.55, 1.0, vDrop);
    if (a < 0.003) discard;
    gl_FragColor = vec4(colour, a);
  }
`;

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
  const bodyRef = useRef<THREE.Mesh>(null);
  const dropsRef = useRef<THREE.InstancedMesh>(null);
  const shockRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const vaporRef = useRef<THREE.Points>(null);

  const built = useMemo(() => {
    const rand = mulberry32(0x1e5a);

    /* ---- the fluid body -------------------------------------------- */
    // A lobed, deliberately off-centre mass. Displacement is a function of the
    // vertex direction alone, so shared vertices stay welded and the silhouette
    // is identical on every run.
    const body = new THREE.IcosahedronGeometry(1, 4);
    {
      const pos = body.getAttribute('position') as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).normalize();
        const d =
          1 +
          0.22 * Math.sin(2.7 * v.x + 1.1) * Math.cos(2.1 * v.z) +
          0.15 * Math.sin(3.9 * v.y + 0.6) +
          0.09 * Math.cos(5.3 * v.x + 2.4) * Math.sin(4.1 * v.z);
        v.multiplyScalar(d);
        // Broader than tall, and pushed off-axis: a surge leaning out of the
        // opening rather than a symmetric fountain head.
        v.x *= 1.18;
        v.y *= 0.78;
        v.z *= 1.06;
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      pos.needsUpdate = true;
      body.computeVertexNormals();
    }

    /* ---- droplets --------------------------------------------------- */
    const droplet = new THREE.IcosahedronGeometry(1, 2);
    const drops = Array.from({ length: DROPLET_COUNT }, (_, i) => {
      // Three size classes, then broken up so no two read as twins.
      const cls = i % 3;
      const base = cls === 0 ? 0.013 : cls === 1 ? 0.024 : 0.038;

      // Its own straight trajectory out of the mouth. Biased upward, but with
      // enough lateral spread that the field opens into a cone instead of a
      // column — and asymmetric, so one side throws further than the other.
      const azimuth = rand() * Math.PI * 2;
      const lateral = 0.34 + rand() * 0.85;
      const bias = 0.28 * Math.cos(azimuth); // breaks the symmetry
      const dir = new THREE.Vector3(
        Math.cos(azimuth) * lateral + bias,
        0.72 + rand() * 0.85,
        Math.sin(azimuth) * lateral * 0.82 + 0.12,
      ).normalize();

      return {
        launch: rand() * 0.24,
        dir,
        speed: 0.2 + rand() * 0.44,
        size: base * (0.72 + rand() * 0.6),
        aspect: new THREE.Vector3(
          0.86 + rand() * 0.3,
          1.04 + rand() * 0.26,
          0.86 + rand() * 0.3,
        ),
        wobbleAmp: 0.008 + rand() * 0.02,
        wobbleFreq: 1.1 + rand() * 2.2,
        phase: rand() * Math.PI * 2,
        spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(2.6),
        tilt: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
      };
    });

    // The first drops out of the aperture are the ones the pressure actually
    // threw, so they leave first and they leave heavier. Applied to whichever
    // three the seeded layout launched first rather than to fixed indices, so
    // the weight always lands on the leading edge of the burst.
    //
    // Their launch windows are pinned to the very start of the flow: the whole
    // point of the beat is that you can see three droplets come *out of the
    // opening* while the mist is still bright, rather than finding them already
    // mid-air once the puff has cleared. Count, speed, direction and lifetime
    // are untouched, so the field is no taller, no fuller and no longer.
    [...drops]
      .sort((a, b) => a.launch - b.launch)
      .slice(0, 3)
      .forEach((d, rank) => {
        d.size *= 1.5 - rank * 0.09;
        d.launch = rank * 0.025;
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

    /* ---- pressure mist ----------------------------------------------- */
    const vaporPositions = new Float32Array(VAPOR_COUNT * 3);
    const vaporDirs = new Float32Array(VAPOR_COUNT * 3);
    const vaporSeeds = new Float32Array(VAPOR_COUNT);
    const vaporDrop = new Float32Array(VAPOR_COUNT);
    for (let i = 0; i < VAPOR_COUNT; i++) {
      // Born inside the aperture's mouth, not on a ring around it.
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 0.026;
      vaporPositions[i * 3] = APERTURE.x + Math.cos(a) * r;
      vaporPositions[i * 3 + 1] = LID_Y + 0.004;
      vaporPositions[i * 3 + 2] = APERTURE.z + Math.sin(a) * r * 0.8;
      // Directional: up and out of the opening, with a real spread.
      const sa = rand() * Math.PI * 2;
      const spread = 0.4 + rand() * 0.8;
      vaporDirs[i * 3] = Math.cos(sa) * spread;
      vaporDirs[i * 3 + 1] = 1.0 + rand() * 0.7;
      vaporDirs[i * 3 + 2] = Math.sin(sa) * spread * 0.85;
      vaporSeeds[i] = rand();
      // A quarter of them are bright micro-droplets rather than mist.
      vaporDrop[i] = rand() < 0.27 ? 1 : 0;
    }
    const vaporGeometry = new THREE.BufferGeometry();
    vaporGeometry.setAttribute('position', new THREE.BufferAttribute(vaporPositions, 3));
    vaporGeometry.setAttribute('aDir', new THREE.BufferAttribute(vaporDirs, 3));
    vaporGeometry.setAttribute('aSeed', new THREE.BufferAttribute(vaporSeeds, 1));
    vaporGeometry.setAttribute('aDrop', new THREE.BufferAttribute(vaporDrop, 1));
    vaporGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.35, 0.15), 1.2);
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
      body,
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
      built.body.dispose();
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

        /* ---- fluid body: swells on the lip, then gives way ------------ */
        const body = bodyRef.current;
        if (body) {
          const s = bodyScale(flow);
          // Peak diameter ~0.21 against a 1.112 can body: about 19%. Slightly
          // broader than the aperture it is coming out of, and nowhere near
          // wide enough to cover the lid.
          const r = 0.094 * s;
          body.scale.set(r * 1.1, r, r);
          // Rises just clear of the lip as it expands — it is leaving the can,
          // not sitting on it.
          body.position.set(
            APERTURE.x + 0.012 * s,
            LID_Y + 0.012 + flow * 0.055,
            APERTURE.z + 0.008 * s,
          );
          body.visible = s > 0.004 && presence > 0.003;
        }

        /* ---- droplets: each on its own straight trajectory ------------ */
        const drops = dropsRef.current;
        if (drops) {
          drops.visible = presence > 0.003;
          const { dummy, point } = built;
          for (let i = 0; i < DROPLET_COUNT; i++) {
            const d = built.drops[i];
            const t = clamp01((flow - d.launch) / Math.max(0.1, 1 - d.launch));
            // Near-linear: zero gravity, so once a droplet is out it keeps
            // going. Just enough deceleration to keep the field in frame.
            const eased = 1 - Math.pow(1 - t, 1.35);
            const travel = eased * d.speed;

            point.copy(APERTURE).addScaledVector(d.dir, travel);
            // A little tumble on the way out, so the field is not a clean fan.
            const wobble = eased * d.wobbleAmp;
            point.x += Math.sin(eased * d.wobbleFreq + d.phase) * wobble;
            point.z += Math.cos(eased * d.wobbleFreq * 0.78 + d.phase) * wobble * 0.72;

            dummy.position.copy(point);
            dummy.rotation.set(
              d.tilt.x + d.spin.x * eased,
              d.tilt.y + d.spin.y * eased,
              d.tilt.z + d.spin.z * eased,
            );
            // Pop in over the first slice of travel so nothing appears fully
            // formed out of nowhere, and thin out again as the field spends
            // itself before the CTA.
            const life = smoothstep(0, 0.14, t) * (1 - smoothstep(0.72, 1, t));
            const s = d.size * life;
            dummy.scale.set(s * d.aspect.x, s * d.aspect.y, s * d.aspect.z);
            dummy.updateMatrix();
            drops.setMatrixAt(i, dummy.matrix);
          }
          drops.instanceMatrix.needsUpdate = true;
        }

        /* ---- pressure shockwave -------------------------------------- */
        const shockMesh = shockRef.current;
        if (shockMesh) {
          // Compact: it reads as a pressure ring on the metal, not a halo
          // around the whole lid.
          const spread = 0.11 + shock * 0.3;
          // A touch of ellipticity so it never reads as a clean CSS circle.
          shockMesh.scale.set(spread, spread * (0.82 + shock * 0.1), 1);
          built.shockMaterial.uniforms.uProgress.value = shock;
          // Hot at the bottom of the track, gone quickly. The ring is the
          // loudest thing in the frame for about one vh and then it is not.
          built.shockMaterial.uniforms.uOpacity.value = (1 - shock) * (1 - shock) * 1.3;
          shockMesh.visible = shock > 0.004 && shock < 0.997;
        }

        /* ---- pressure mist ------------------------------------------- */
        const vaporPoints = vaporRef.current;
        if (vaporPoints) {
          // Expansion runs on its own clock so the burst can outrun its own
          // fade — the puff is already wide by the time it goes.
          const expansion = clamp01(1 - vapor) * 0.85 + 0.15;
          built.vaporMaterial.uniforms.uProgress.value = expansion;
          // The first puff — tight, dense, still on the metal — runs far hotter
          // than the dispersed mist it becomes, and the boost decays over a
          // narrower band so it reads as a burst rather than a bright cloud.
          // Keyed off the expansion rather than off scroll position, so it is
          // spent by the time the cloud has opened up and the approved tail is
          // untouched. Same particles, same duration; only the front gets it.
          const punch = 1 + 0.85 * (1 - smoothstep(0.15, 0.4, expansion));
          built.vaporMaterial.uniforms.uOpacity.value = vapor * 0.66 * punch;
          vaporPoints.visible = vapor > 0.004;
        }

        /* ---- pre-break pressure glow --------------------------------- */
        const glowMesh = glowRef.current;
        if (glowMesh) {
          const s = 0.17 + pressure * 0.05;
          glowMesh.scale.set(s, s * 0.62, 1);
          built.glowMaterial.uniforms.uOpacity.value = pressure * 0.58;
          glowMesh.visible = pressure > 0.004;
        }
      },
    }),
    [built],
  );

  return (
    <group ref={groupRef} visible={false}>
      {/* The fluid body. Position and scale are set every frame from `flow`. */}
      <mesh ref={bodyRef} geometry={built.body} material={built.liquid} frustumCulled={false} />

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
