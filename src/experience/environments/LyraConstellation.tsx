import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * A controlled, stylised Lyra: the small triangle at the top and the
 * parallelogram below it. Vega is the dominant node and doubles as the
 * ignition point the can launches from.
 *
 * No labels — the shape carries the reference on its own.
 */

// Sized so the whole figure — small triangle plus parallelogram — sits inside
// the opening frame with margin, rather than running off the bottom.
const SCALE = 1.55;

/** Star field coordinates, already centred on the constellation's centroid. */
const STARS: { name: string; x: number; y: number; mag: number }[] = [
  { name: 'vega', x: -0.125, y: 1.555, mag: 1 },
  { name: 'epsilon', x: -1.075, y: 0.975, mag: 0.46 },
  { name: 'zeta', x: 0.155, y: 0.695, mag: 0.5 },
  { name: 'delta', x: 1.025, y: -0.365, mag: 0.42 },
  { name: 'gamma', x: 0.595, y: -1.795, mag: 0.54 },
  { name: 'beta', x: -0.575, y: -1.065, mag: 0.48 },
];

const LINKS: [number, number][] = [
  [0, 1], // Vega — Epsilon
  [0, 2], // Vega — Zeta
  [1, 2], // Epsilon — Zeta
  [2, 5], // Zeta — Beta
  [5, 4], // Beta — Gamma
  [4, 3], // Gamma — Delta
  [3, 2], // Delta — Zeta
];

/**
 * World position of Vega — the can's origin point and the trail's source.
 * Offset upward so the figure hangs below it and lands centred in frame.
 */
export const VEGA_POSITION = new THREE.Vector3(0, 1.6, -26);

const GROUP_POSITION = new THREE.Vector3(
  VEGA_POSITION.x - STARS[0].x * SCALE,
  VEGA_POSITION.y - STARS[0].y * SCALE,
  VEGA_POSITION.z,
);

const lineVertex = /* glsl */ `
  attribute float aDistance;
  attribute float aOrder;
  varying float vDistance;
  varying float vOrder;
  void main() {
    vDistance = aDistance;
    vOrder = aOrder;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lineFragment = /* glsl */ `
  varying float vDistance;
  varying float vOrder;
  uniform float uDraw;
  uniform float uOpacity;
  uniform vec3 uColour;

  void main() {
    // Segments draw in sequence, each one wiping from its start.
    float local = clamp(uDraw * 7.0 - vOrder, 0.0, 1.0);
    if (vDistance > local) discard;
    float head = smoothstep(local, local - 0.22, vDistance);
    float alpha = uOpacity * (0.34 + head * 0.66);
    gl_FragColor = vec4(uColour, alpha);
  }
`;

const starVertex = /* glsl */ `
  attribute float aMag;
  varying float vMag;
  uniform float uPixelRatio;
  uniform float uVega;
  void main() {
    vMag = aMag;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float dominant = step(0.99, aMag);
    float size = mix(19.0, 30.0 + uVega * 34.0, dominant) * aMag;
    gl_PointSize = size * uPixelRatio * (26.0 / max(1.0, -mvPosition.z));
  }
`;

const starFragment = /* glsl */ `
  varying float vMag;
  uniform float uOpacity;
  uniform float uVega;
  uniform vec3 uColour;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d) * 2.0;
    float core = pow(clamp(1.0 - r, 0.0, 1.0), 3.0);
    float halo = pow(clamp(1.0 - r, 0.0, 1.0), 2.3) * 0.22;
    float dominant = step(0.99, vMag);
    float energy = mix(0.0, uVega, dominant);
    float a = (core + halo * (0.4 + energy)) * uOpacity;
    if (a < 0.004) discard;
    vec3 colour = mix(vec3(0.95, 0.94, 0.91), uColour, 0.35 + energy * 0.5);
    gl_FragColor = vec4(colour * (1.0 + energy * 1.6), a);
  }
`;

export interface ConstellationHandle {
  update(draw: number, opacity: number, vega: number, colour: THREE.Color): void;
}

export const LyraConstellation = forwardRef<ConstellationHandle>(
  function LyraConstellation(_, ref) {
    const groupRef = useRef<THREE.Group>(null);

    const built = useMemo(() => {
      /* lines */
      const positions: number[] = [];
      const distances: number[] = [];
      const orders: number[] = [];
      LINKS.forEach(([a, b], index) => {
        const sa = STARS[a];
        const sb = STARS[b];
        positions.push(sa.x * SCALE, sa.y * SCALE, 0, sb.x * SCALE, sb.y * SCALE, 0);
        distances.push(0, 1);
        orders.push(index, index);
      });
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3),
      );
      lineGeometry.setAttribute(
        'aDistance',
        new THREE.Float32BufferAttribute(distances, 1),
      );
      lineGeometry.setAttribute('aOrder', new THREE.Float32BufferAttribute(orders, 1));

      const lineMaterial = new THREE.ShaderMaterial({
        vertexShader: lineVertex,
        fragmentShader: lineFragment,
        uniforms: {
          uDraw: { value: 0 },
          uOpacity: { value: 0 },
          uColour: { value: new THREE.Color('#A56BFF') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      /* stars */
      const starPositions: number[] = [];
      const mags: number[] = [];
      for (const s of STARS) {
        starPositions.push(s.x * SCALE, s.y * SCALE, 0);
        mags.push(s.mag);
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(starPositions, 3),
      );
      starGeometry.setAttribute('aMag', new THREE.Float32BufferAttribute(mags, 1));

      const starMaterial = new THREE.ShaderMaterial({
        vertexShader: starVertex,
        fragmentShader: starFragment,
        uniforms: {
          uOpacity: { value: 0 },
          uVega: { value: 0 },
          uColour: { value: new THREE.Color('#A56BFF') },
          uPixelRatio: { value: Math.min(1.5, window.devicePixelRatio) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      return { lineGeometry, lineMaterial, starGeometry, starMaterial };
    }, []);

    useEffect(
      () => () => {
        built.lineGeometry.dispose();
        built.lineMaterial.dispose();
        built.starGeometry.dispose();
        built.starMaterial.dispose();
      },
      [built],
    );

    useImperativeHandle(ref, () => ({
      update(draw, opacity, vega, colour) {
        const visible = opacity > 0.003;
        if (groupRef.current) groupRef.current.visible = visible;
        if (!visible) return;
        built.lineMaterial.uniforms.uDraw.value = draw;
        built.lineMaterial.uniforms.uOpacity.value = opacity * 0.38;
        built.lineMaterial.uniforms.uColour.value.copy(colour);
        built.starMaterial.uniforms.uOpacity.value = opacity;
        built.starMaterial.uniforms.uVega.value = vega;
        built.starMaterial.uniforms.uColour.value.copy(colour);
      },
    }));

    return (
      <group ref={groupRef} position={GROUP_POSITION} visible={false}>
        <lineSegments geometry={built.lineGeometry} material={built.lineMaterial} />
        <points geometry={built.starGeometry} material={built.starMaterial} />
      </group>
    );
  },
);
