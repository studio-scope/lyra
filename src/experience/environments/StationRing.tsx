import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Procedural station ring.
 *
 * A dark torus hull, a thinner inner ring, six spokes, and two instanced
 * passes: structural modules and operational lights. It reads as silhouette
 * plus a thin line of light — the can stays the subject.
 */

const RADIUS = 9.2;
const MODULES = 56;
const LIGHTS = 96;

export interface StationHandle {
  update(scrollVh: number, presence: number, accent: THREE.Color): void;
}

export const StationRing = forwardRef<StationHandle>(function StationRing(_, ref) {
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const moduleRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);

  const built = useMemo(() => {
    const hull = new THREE.TorusGeometry(RADIUS, 0.62, 14, 128);
    const inner = new THREE.TorusGeometry(RADIUS - 1.55, 0.1, 8, 128);
    const spoke = new THREE.BoxGeometry(RADIUS - 1.0, 0.26, 0.5);
    const moduleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const lightGeometry = new THREE.PlaneGeometry(1, 1);

    const hullMaterial = new THREE.MeshStandardMaterial({
      color: '#0C0C13',
      metalness: 0.86,
      roughness: 0.56,
    });
    const structureMaterial = new THREE.MeshStandardMaterial({
      color: '#101019',
      metalness: 0.8,
      roughness: 0.62,
    });
    const moduleMaterial = new THREE.MeshStandardMaterial({
      color: '#131320',
      metalness: 0.82,
      roughness: 0.58,
    });
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: '#00D9FF',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    return {
      hull,
      inner,
      spoke,
      moduleGeometry,
      lightGeometry,
      hullMaterial,
      structureMaterial,
      moduleMaterial,
      lightMaterial,
    };
  }, []);

  useEffect(
    () => () => {
      built.hull.dispose();
      built.inner.dispose();
      built.spoke.dispose();
      built.moduleGeometry.dispose();
      built.lightGeometry.dispose();
      built.hullMaterial.dispose();
      built.structureMaterial.dispose();
      built.moduleMaterial.dispose();
      built.lightMaterial.dispose();
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
      built.lightMaterial.opacity = 0.85 * presence;
      const dim = 0.25 + presence * 0.75;
      built.hullMaterial.color.setRGB(0.047 * dim, 0.047 * dim, 0.075 * dim);
    },
  }));

  return (
    <group ref={groupRef} position={[0, -1.2, -28]} visible={false}>
      <group ref={spinRef} rotation={[-0.42, 0.18, 0]}>
        <mesh geometry={built.hull} material={built.hullMaterial} />
        <mesh geometry={built.inner} material={built.structureMaterial} />
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
          ref={moduleRef}
          args={[built.moduleGeometry, built.moduleMaterial, MODULES]}
          frustumCulled={false}
        />
        <instancedMesh
          ref={lightRef}
          args={[built.lightGeometry, built.lightMaterial, LIGHTS]}
          frustumCulled={false}
          renderOrder={1}
        />
      </group>
    </group>
  );
});
