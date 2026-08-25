import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * The suspended particle cue at the Chapter 05 cut point.
 *
 * Not a spray and not a simulation — a small volume of particles that lifts
 * off the lid and then hangs, marking the exact frame the Phase 2 Open & Pour
 * plate takes over.
 */

const COUNT = 150;

const vertexShader = /* glsl */ `
  attribute vec3 aDirection;
  attribute float aSeed;
  varying float vSeed;
  uniform float uRelease;
  uniform float uPixelRatio;

  void main() {
    vSeed = aSeed;
    // Fast lift, then almost nothing: the cue settles rather than dissipates.
    float t = pow(uRelease, 0.55);
    vec3 p = position + aDirection * t * (0.1 + aSeed * 0.2);
    p.y += t * (0.06 + aSeed * 0.15);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (1.0 + aSeed * 1.9) * uPixelRatio * (8.0 / max(0.8, -mvPosition.z));
  }
`;

const fragmentShader = /* glsl */ `
  varying float vSeed;
  uniform float uOpacity;
  uniform vec3 uColour;
  uniform vec3 uCore;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float a = pow(clamp(1.0 - length(d) * 2.0, 0.0, 1.0), 2.6);
    if (a < 0.01) discard;
    vec3 colour = mix(uColour, uCore, vSeed);
    gl_FragColor = vec4(colour, a * uOpacity * (0.35 + vSeed * 0.65));
  }
`;

export interface ReleaseParticlesHandle {
  update(release: number, opacity: number, colour: THREE.Color, core: THREE.Color): void;
}

export const ReleaseParticles = forwardRef<ReleaseParticlesHandle>(
  function ReleaseParticles(_, ref) {
    const pointsRef = useRef<THREE.Points>(null);

    const built = useMemo(() => {
      const positions = new Float32Array(COUNT * 3);
      const directions = new Float32Array(COUNT * 3);
      const seeds = new Float32Array(COUNT);

      // Seeded, not `Math.random`: the cue has to land on the same pixels on
      // every reload, or a QA capture of Chapter 05 is never reproducible.
      let state = 0x9e3779b9;
      const rand = () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };

      for (let i = 0; i < COUNT; i++) {
        const angle = rand() * Math.PI * 2;
        const radius = Math.sqrt(rand()) * 0.24;
        positions[i * 3 + 0] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = 1.25 + rand() * 0.03;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        const spread = 0.5 + rand() * 0.6;
        directions[i * 3 + 0] = Math.cos(angle) * spread;
        directions[i * 3 + 1] = 0.9 + rand() * 0.8;
        directions[i * 3 + 2] = Math.sin(angle) * spread;
        seeds[i] = rand();
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aDirection', new THREE.BufferAttribute(directions, 3));
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0), 3);

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uRelease: { value: 0 },
          uOpacity: { value: 0 },
          uColour: { value: new THREE.Color('#7127FF') },
          uCore: { value: new THREE.Color('#F6E8FF') },
          uPixelRatio: { value: Math.min(1.5, window.devicePixelRatio) },
        },
        transparent: true,
        depthWrite: false,
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
      update(release, opacity, colour, core) {
        const points = pointsRef.current;
        if (!points) return;
        points.visible = opacity > 0.004;
        if (!points.visible) return;
        const u = built.material.uniforms;
        u.uRelease.value = release;
        u.uOpacity.value = opacity;
        u.uColour.value.copy(colour);
        u.uCore.value.copy(core);
      },
    }));

    return (
      <points
        ref={pointsRef}
        geometry={built.geometry}
        material={built.material}
        frustumCulled={false}
        visible={false}
      />
    );
  },
);
