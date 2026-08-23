import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Radial streak overlay + flash core.
 *
 * A billboard pinned one unit in front of the camera and re-fitted every frame,
 * so it covers the frame at any FOV. Both effects are short spikes driven from
 * the timeline — there is deliberately no standing blur, no permanent chromatic
 * aberration and no white-out.
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uWarp;
  uniform float uFlash;
  uniform vec3 uStreak;
  uniform vec3 uFlashColour;
  uniform float uSeed;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float angle = atan(p.y, p.x) * 0.15915494 + 0.5;

    /* --- radial streaks: only in the outer field, stretched outward --- */
    float streakAlpha = 0.0;
    if (uWarp > 0.001) {
      float band = floor(angle * 210.0);
      float n = hash(vec2(band, uSeed));
      float m = hash(vec2(band * 1.7 + 3.0, uSeed + 5.0));
      float lines = pow(n, 5.0) + pow(m, 9.0) * 0.6;
      // Streaks start further out as the burst peaks, reading as forward speed.
      float inner = mix(0.62, 0.16, uWarp);
      float radial = smoothstep(inner, 1.05, r) * smoothstep(1.75, 0.85, r);
      streakAlpha = lines * radial * uWarp * 0.85;
    }

    /* --- compressed flash core -------------------------------------- */
    float flashAlpha = 0.0;
    if (uFlash > 0.001) {
      float core = pow(clamp(1.0 - r * 0.62, 0.0, 1.0), 3.4);
      float bleed = pow(clamp(1.0 - r * 0.34, 0.0, 1.0), 1.5) * 0.22;
      flashAlpha = (core + bleed) * uFlash;
    }

    vec3 colour = uStreak * streakAlpha + uFlashColour * flashAlpha;
    float alpha = streakAlpha + flashAlpha;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(colour, min(alpha, 1.0));
  }
`;

export interface WarpHandle {
  update(
    warp: number,
    flash: number,
    streak: THREE.Color,
    flashColour: THREE.Color,
    camera: THREE.PerspectiveCamera,
  ): void;
}

export const WarpField = forwardRef<WarpHandle>(function WarpField(_, ref) {
  const meshRef = useRef<THREE.Mesh>(null);

  const built = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uWarp: { value: 0 },
        uFlash: { value: 0 },
        uStreak: { value: new THREE.Color('#A56BFF') },
        uFlashColour: { value: new THREE.Color('#F1EEFF') },
        uSeed: { value: 11.3 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
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
    update(warp, flash, streak, flashColour, camera) {
      const mesh = meshRef.current;
      if (!mesh) return;
      const active = warp > 0.002 || flash > 0.002;
      mesh.visible = active;
      if (!active) return;

      const u = built.material.uniforms;
      u.uWarp.value = warp;
      u.uFlash.value = flash;
      u.uStreak.value.copy(streak);
      u.uFlashColour.value.copy(flashColour);

      // Pin one unit in front of the camera and refit to the current frustum.
      const distance = 1;
      mesh.quaternion.copy(camera.quaternion);
      mesh.position
        .set(0, 0, -distance)
        .applyQuaternion(camera.quaternion)
        .add(camera.position);
      const height = 2 * distance * Math.tan((camera.fov * Math.PI) / 360);
      mesh.scale.set(height * camera.aspect * 1.04, height * 1.04, 1);
      mesh.updateMatrixWorld();
    },
  }));

  return (
    <mesh
      ref={meshRef}
      geometry={built.geometry}
      material={built.material}
      renderOrder={100}
      frustumCulled={false}
      visible={false}
    />
  );
});
