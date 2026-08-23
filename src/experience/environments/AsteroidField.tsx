import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Procedural asteroid field.
 *
 * Four base shapes, each a low-detail icosphere pushed around by a fixed sum of
 * sinusoids — deterministic, so the silhouette is identical every run, and
 * non-indexed, so `computeVertexNormals` leaves the faceting rocks want.
 *
 * Every shape is drawn once through an InstancedMesh. The field streams toward
 * the camera and wraps; nothing is allocated per frame.
 */

const SHAPES = 4;
const PER_SHAPE = 30;
const FIELD_DEPTH = 150;
/** Nothing spawns closer than this, so no rock ever swallows the frame. */
const Z_NEAR = -1.5;

function makeAsteroidGeometry(variant: number) {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const phase = variant * 1.9;

  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const n = v.clone().normalize();
    // Position-only displacement keeps shared corners identical: no cracks.
    const d =
      1 +
      0.24 * Math.sin(3.1 * n.x + phase) * Math.cos(2.3 * n.y + phase * 0.6) +
      0.17 * Math.sin(4.7 * n.z + 0.9 + phase) * Math.cos(3.3 * n.x) +
      0.11 * Math.sin(6.1 * n.y + 2.2 - phase) +
      0.07 * Math.cos(8.3 * n.z + phase * 1.4);
    v.copy(n).multiplyScalar(d);
    // A different squash per variant so none of them read as a sphere.
    v.x *= 1 - 0.16 * variant;
    v.y *= 0.78 + 0.14 * variant;
    v.z *= 1.14 - 0.09 * variant;
    position.setXYZ(i, v.x, v.y, v.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

interface Instance {
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
  spin: THREE.Euler;
  spinRate: number;
}

export interface AsteroidsHandle {
  update(scrollVh: number, presence: number, rim: THREE.Color): void;
}

export const AsteroidField = forwardRef<AsteroidsHandle>(function AsteroidField(_, ref) {
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const groupRef = useRef<THREE.Group>(null);

  const { geometries, materials, instances } = useMemo(() => {
    const geos = Array.from({ length: SHAPES }, (_, i) => makeAsteroidGeometry(i));
    const mats = Array.from({ length: SHAPES }, (_, i) => {
      // Deliberately near-black: asteroids are silhouette and rim light only.
      // They must never compete with the can for attention.
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.66 + i * 0.012, 0.14 + i * 0.03, 0.026 + i * 0.006),
        roughness: 0.9 + i * 0.025,
        metalness: 0.06,
        envMapIntensity: 0.16,
        flatShading: true,
      });
      return material;
    });

    const groups: Instance[][] = [];
    for (let s = 0; s < SHAPES; s++) {
      const list: Instance[] = [];
      for (let i = 0; i < PER_SHAPE; i++) {
        // Hollow corridor: nothing spawns on the flight axis, so the can always
        // separates from the background.
        const angle = Math.random() * Math.PI * 2;
        const radius = 5.2 + Math.pow(Math.random(), 0.7) * 14;
        list.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius * 0.66,
          z: Z_NEAR - Math.random() * FIELD_DEPTH,
          scale: 0.24 + Math.pow(Math.random(), 2.1) * 1.5,
          // Mild speed spread on top of true perspective parallax.
          speed: 0.6 + Math.random() * 0.7,
          spin: new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
          ),
          spinRate: (Math.random() - 0.5) * 0.0016,
        });
      }
      groups.push(list);
    }

    return { geometries: geos, materials: mats, instances: groups };
  }, []);

  useEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
    [geometries, materials],
  );

  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      quaternion: new THREE.Quaternion(),
      euler: new THREE.Euler(),
      position: new THREE.Vector3(),
      scale: new THREE.Vector3(),
    }),
    [],
  );

  useImperativeHandle(ref, () => ({
    update(scrollVhValue, presence, rim) {
      const visible = presence > 0.004;
      if (groupRef.current) groupRef.current.visible = visible;
      if (!visible) return;

      for (let s = 0; s < SHAPES; s++) {
        const mesh = meshRefs.current[s];
        if (!mesh) continue;
        const list = instances[s];
        materials[s].emissive.copy(rim);
        materials[s].emissiveIntensity = 0.018 * presence;

        for (let i = 0; i < list.length; i++) {
          const inst = list[i];
          const travelled = inst.z + scrollVhValue * inst.speed * 0.26;
          const z = ((travelled - Z_NEAR) % FIELD_DEPTH + FIELD_DEPTH) % FIELD_DEPTH
            + Z_NEAR - FIELD_DEPTH;

          scratch.position.set(inst.x, inst.y, z);
          scratch.euler.set(
            inst.spin.x + scrollVhValue * inst.spinRate,
            inst.spin.y + scrollVhValue * inst.spinRate * 1.3,
            inst.spin.z,
          );
          scratch.quaternion.setFromEuler(scratch.euler);
          const s3 = inst.scale * presence;
          scratch.scale.set(s3, s3, s3);
          scratch.matrix.compose(scratch.position, scratch.quaternion, scratch.scale);
          mesh.setMatrixAt(i, scratch.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
  }));

  return (
    <group ref={groupRef} visible={false}>
      {geometries.map((geometry, i) => (
        <instancedMesh
          key={i}
          ref={(node) => {
            meshRefs.current[i] = node;
          }}
          args={[geometry, materials[i], PER_SHAPE]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
});
