import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Procedural station ring.
 *
 * The silhouette is unchanged: one dark torus hull, a thinner inner ring, six
 * spokes. What was missing was **hierarchy** — hull, structure and modules were
 * three near-identical greys, so it read as placeholder geometry rather than
 * something engineered.
 *
 * Three things were added, and deliberately only three:
 *
 *   1. a secondary inner truss ring with its own radial struts, set back in Z,
 *      so the ring has an inside rather than being a bare annulus;
 *   2. sparse detail modules — antenna masts and docking nodes — at a different
 *      material tone from the structural boxes;
 *   3. a two-tier light hierarchy: dim static navigation ticks, plus a short
 *      travelling scan arc whose position is a pure function of scroll.
 *
 * Everything below is index-derived, so the layout is deterministic and the
 * instance matrices are written once rather than per frame. The station stays
 * secondary to the can: no material here is brighter than the product.
 */

const RADIUS = 9.2;
const MODULES = 56;
const LIGHTS = 96;
/** Detail family 2: masts and nodes. Kept sparse on purpose. */
const DETAILS = 22;
/** Inner truss struts. */
const STRUTS = 18;

/** Ticks in the travelling scan arc. Short: it is an indicator, not a chase. */
const SCAN_LENGTH = 9;

/** One dial for the whole station's loudness, for the restraint pass. */
const STATION_GAIN = 0.75;

export interface StationHandle {
  update(scrollVh: number, presence: number, accent: THREE.Color): void;
}

export const StationRing = forwardRef<StationHandle>(function StationRing(_, ref) {
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const moduleRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const detailRef = useRef<THREE.InstancedMesh>(null);
  const strutRef = useRef<THREE.InstancedMesh>(null);
  const scanRef = useRef<THREE.InstancedMesh>(null);

  const built = useMemo(() => {
    const hull = new THREE.TorusGeometry(RADIUS, 0.62, 14, 128);
    const inner = new THREE.TorusGeometry(RADIUS - 1.55, 0.1, 8, 128);
    // The secondary truss: a second thin ring further in and set back, which is
    // what gives the ring an interior instead of a hole.
    const truss = new THREE.TorusGeometry(RADIUS - 2.85, 0.055, 6, 96);
    const spoke = new THREE.BoxGeometry(RADIUS - 1.0, 0.26, 0.5);
    const moduleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const detailGeometry = new THREE.BoxGeometry(1, 1, 1);
    const strutGeometry = new THREE.BoxGeometry(1, 1, 1);
    const lightGeometry = new THREE.PlaneGeometry(1, 1);

    /* ---- material hierarchy: three distinct tiers, not three greys ---- */

    // Tier 1 — the hull. Darkest and roughest: it is mass, and it reads as
    // silhouette against the starfield.
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: '#0A0A10',
      metalness: 0.72,
      roughness: 0.74,
    });

    // Tier 2 — structure. Slightly cooler and tighter, so spokes and rings
    // separate from the hull under the same light instead of merging into it.
    const structureMaterial = new THREE.MeshStandardMaterial({
      color: '#12131F',
      metalness: 0.88,
      roughness: 0.42,
    });

    // Tier 3 — machined detail. The only genuinely reflective tier, which is
    // what makes the small parts read as engineered hardware.
    const detailMaterial = new THREE.MeshStandardMaterial({
      color: '#1B1D2C',
      metalness: 0.95,
      roughness: 0.28,
    });

    // Structural modules stay matte; they are hull furniture, not hardware.
    const moduleMaterial = new THREE.MeshStandardMaterial({
      color: '#0E0F18',
      metalness: 0.78,
      roughness: 0.66,
    });

    // Navigation ticks: dim, static, thin.
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: '#00D9FF',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // The travelling scan: same geometry, own material so it can be brighter
    // than the ticks without lifting all 96 of them.
    const scanMaterial = new THREE.MeshBasicMaterial({
      color: '#6E8CFF',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    return {
      hull, inner, truss, spoke,
      moduleGeometry, detailGeometry, strutGeometry, lightGeometry,
      hullMaterial, structureMaterial, detailMaterial, moduleMaterial,
      lightMaterial, scanMaterial,
    };
  }, []);

  useEffect(
    () => () => {
      built.hull.dispose();
      built.inner.dispose();
      built.truss.dispose();
      built.spoke.dispose();
      built.moduleGeometry.dispose();
      built.detailGeometry.dispose();
      built.strutGeometry.dispose();
      built.lightGeometry.dispose();
      built.hullMaterial.dispose();
      built.structureMaterial.dispose();
      built.detailMaterial.dispose();
      built.moduleMaterial.dispose();
      built.lightMaterial.dispose();
      built.scanMaterial.dispose();
    },
    [built],
  );

  /* Instance layouts are static — computed once, uploaded once. */
  useEffect(() => {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3();

    if (moduleRef.current) {
      for (let i = 0; i < MODULES; i++) {
        const a = (i / MODULES) * Math.PI * 2;
        const outward = i % 3 === 0 ? 0.95 : -0.85;
        position.set(
          Math.cos(a) * (RADIUS + outward),
          Math.sin(a) * (RADIUS + outward),
          ((i * 37) % 7) * 0.16 - 0.55,
        );
        euler.set(0, 0, a);
        quaternion.setFromEuler(euler);
        const long = i % 4 === 0;
        scale.set(long ? 1.9 : 0.7, long ? 0.42 : 0.9, long ? 0.66 : 1.15);
        matrix.compose(position, quaternion, scale);
        moduleRef.current.setMatrixAt(i, matrix);
      }
      moduleRef.current.instanceMatrix.needsUpdate = true;
    }

    /* Detail family: alternating antenna masts and docking nodes. Only 22 of
       them around a 58-unit circumference, so they punctuate rather than
       clutter, and they sit at angles the modules do not occupy. */
    if (detailRef.current) {
      for (let i = 0; i < DETAILS; i++) {
        const a = ((i + 0.5) / DETAILS) * Math.PI * 2;
        const mast = i % 2 === 0;
        const out = mast ? 1.42 : 0.72;
        position.set(
          Math.cos(a) * (RADIUS + out),
          Math.sin(a) * (RADIUS + out),
          mast ? 0.1 : ((i * 53) % 5) * 0.2 - 0.4,
        );
        euler.set(0, 0, a);
        quaternion.setFromEuler(euler);
        // Masts are long and needle-thin; nodes are squat blocks.
        if (mast) scale.set(1.15, 0.06, 0.06);
        else scale.set(0.44, 0.5, 0.62);
        matrix.compose(position, quaternion, scale);
        detailRef.current.setMatrixAt(i, matrix);
      }
      detailRef.current.instanceMatrix.needsUpdate = true;
    }

    /* Inner truss struts: short radial ties between the inner ring and the
       truss ring. They read as engineering, and they give the ring's interior
       a mid-depth layer instead of empty space. */
    if (strutRef.current) {
      for (let i = 0; i < STRUTS; i++) {
        const a = (i / STRUTS) * Math.PI * 2;
        const rMid = RADIUS - 2.2;
        position.set(Math.cos(a) * rMid, Math.sin(a) * rMid, -0.18);
        euler.set(0, 0, a);
        quaternion.setFromEuler(euler);
        scale.set(1.35, 0.045, 0.045);
        matrix.compose(position, quaternion, scale);
        strutRef.current.setMatrixAt(i, matrix);
      }
      strutRef.current.instanceMatrix.needsUpdate = true;
    }

    if (lightRef.current) {
      for (let i = 0; i < LIGHTS; i++) {
        const a = (i / LIGHTS) * Math.PI * 2;
        position.set(Math.cos(a) * (RADIUS + 0.63), Math.sin(a) * (RADIUS + 0.63), 0.34);
        euler.set(0, 0, a);
        quaternion.setFromEuler(euler);
        const tall = i % 8 === 0;
        scale.set(tall ? 0.09 : 0.05, tall ? 0.52 : 0.2, 1);
        matrix.compose(position, quaternion, scale);
        lightRef.current.setMatrixAt(i, matrix);
      }
      lightRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  /* Scratch objects for the scan arc, allocated once. */
  const scan = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      euler: new THREE.Euler(),
      scale: new THREE.Vector3(),
    }),
    [],
  );

  useImperativeHandle(ref, () => ({
    update(scrollVhValue, presence, accent) {
      const visible = presence > 0.004;
      if (groupRef.current) groupRef.current.visible = visible;
      if (!visible) return;
      if (spinRef.current) {
        spinRef.current.rotation.z = scrollVhValue * 0.0022;
        spinRef.current.rotation.x = -0.42 + Math.sin(scrollVhValue * 0.0009) * 0.05;
      }

      built.lightMaterial.color.copy(accent);
      // The static ticks are navigation markers, not decoration: dim enough
      // that the eye reads them as a line, not as individual lamps.
      built.lightMaterial.opacity = 0.5 * presence * STATION_GAIN;
      built.scanMaterial.opacity = 0.72 * presence * STATION_GAIN;

      const dim = 0.25 + presence * 0.75;
      built.hullMaterial.color.setRGB(0.038 * dim, 0.038 * dim, 0.062 * dim);

      /* A short arc of brighter ticks travelling around the ring. Its head is
         a pure function of scroll, so it runs backwards when you scrub back
         and lands on the same segment every time. */
      const mesh = scanRef.current;
      if (mesh) {
        const head = (scrollVhValue * 0.055) % LIGHTS;
        const { matrix, position, quaternion, euler, scale } = scan;
        for (let i = 0; i < SCAN_LENGTH; i++) {
          const idx = Math.floor(head - i + LIGHTS) % LIGHTS;
          const a = (idx / LIGHTS) * Math.PI * 2;
          // Trailing ticks shrink, so the arc has a direction.
          const falloff = 1 - i / SCAN_LENGTH;
          position.set(Math.cos(a) * (RADIUS + 0.63), Math.sin(a) * (RADIUS + 0.63), 0.36);
          euler.set(0, 0, a);
          quaternion.setFromEuler(euler);
          scale.set(0.075 * falloff, 0.46 * falloff, 1);
          matrix.compose(position, quaternion, scale);
          mesh.setMatrixAt(i, matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
  }));

  return (
    <group ref={groupRef} position={[0, -1.2, -28]} visible={false}>
      <group ref={spinRef} rotation={[-0.42, 0.18, 0]}>
        <mesh geometry={built.hull} material={built.hullMaterial} />
        <mesh geometry={built.inner} material={built.structureMaterial} />
        <mesh geometry={built.truss} material={built.structureMaterial} position={[0, 0, -0.18]} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            geometry={built.spoke}
            material={built.structureMaterial}
            rotation={[0, 0, (i / 6) * Math.PI * 2]}
            position={[
              Math.cos((i / 6) * Math.PI * 2) * ((RADIUS - 1.0) / 2),
              Math.sin((i / 6) * Math.PI * 2) * ((RADIUS - 1.0) / 2),
              0,
            ]}
          />
        ))}
        <instancedMesh
          ref={strutRef}
          args={[built.strutGeometry, built.structureMaterial, STRUTS]}
          frustumCulled={false}
        />
        <instancedMesh
          ref={moduleRef}
          args={[built.moduleGeometry, built.moduleMaterial, MODULES]}
          frustumCulled={false}
        />
        <instancedMesh
          ref={detailRef}
          args={[built.detailGeometry, built.detailMaterial, DETAILS]}
          frustumCulled={false}
        />
        <instancedMesh
          ref={lightRef}
          args={[built.lightGeometry, built.lightMaterial, LIGHTS]}
          frustumCulled={false}
          renderOrder={1}
        />
        <instancedMesh
          ref={scanRef}
          args={[built.lightGeometry, built.scanMaterial, SCAN_LENGTH]}
          frustumCulled={false}
          renderOrder={2}
        />
      </group>
    </group>
  );
});

