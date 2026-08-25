import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { CanModel, type CanHandle } from './can/CanModel';
import { FlightTrail, type TrailHandle } from './effects/FlightTrail';
import { WarpField, type WarpHandle } from './effects/WarpField';
import { ReleaseParticles, type ReleaseParticlesHandle } from './effects/ReleaseParticles';
import { ReleaseBurst, type ReleaseBurstHandle } from './effects/ReleaseBurst';
import { StarLayers, type StarsHandle } from './environments/StarLayers';
import { LyraConstellation, type ConstellationHandle } from './environments/LyraConstellation';
import { AsteroidField, type AsteroidsHandle } from './environments/AsteroidField';
import { StationRing, type StationHandle } from './environments/StationRing';
import { NebulaVolume, type NebulaHandle } from './environments/NebulaVolume';
import { LiquidWave, type LiquidHandle } from './environments/LiquidWave';

import { scrollState } from '../hooks/useScroll';
import { sceneReadout } from '../hooks/useDebug';
import { FLAVORS, type FlavorId } from '../config/flavors';
import { flavorAt, pulse, sampleNumber, sampleVec3, type Vec3 } from '../config/timeline';
import { clamp01, smoothstep } from '../config/easing';
import * as K from '../config/choreography';
import { PRODUCT_LAYER } from './productLayer';

/**
 * The one place scroll becomes motion.
 *
 * Every track is sampled here and pushed straight into object transforms and
 * uniforms. Nothing in this file calls setState, so a full scroll of the site
 * costs zero React renders.
 */

const FLAVOR_SHAPE: Record<FlavorId, number> = { nova: 0, comet: 1, void: 2 };

/** Frame-rate independent damping. High lambda = tight to the scroll input. */
function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

interface Props {
  flavor: FlavorId;
}

export function SceneController({ flavor }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);

  const rigRef = useRef<THREE.Group>(null);
  const canRef = useRef<CanHandle>(null);
  const trailRef = useRef<TrailHandle>(null);
  const warpRef = useRef<WarpHandle>(null);
  const particlesRef = useRef<ReleaseParticlesHandle>(null);
  const burstRef = useRef<ReleaseBurstHandle>(null);
  const starsRef = useRef<StarsHandle>(null);
  const constellationRef = useRef<ConstellationHandle>(null);
  const asteroidsRef = useRef<AsteroidsHandle>(null);
  const stationRef = useRef<StationHandle>(null);
  const nebulaRef = useRef<NebulaHandle>(null);
  const liquidRef = useRef<LiquidHandle>(null);

  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const accentLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const productRigRef = useRef<THREE.Group>(null);
  const productTargetRef = useRef<THREE.Object3D>(null);
  const envAccentRef = useRef<THREE.DirectionalLight>(null);
  const envRimRef = useRef<THREE.DirectionalLight>(null);

  const productAmbientRef = useRef<THREE.AmbientLight>(null);

  useEffect(() => {
    // Aim every product light at a target inside the rig. A DirectionalLight's
    // target is not parented to the light by default, so without this the
    // rig's translation would swing the lighting angle instead of carrying it.
    const target = productTargetRef.current;
    if (!target) return;
    const lights = [keyLightRef.current, accentLightRef.current, rimLightRef.current];
    for (const light of lights) {
      if (!light) continue;
      light.target = target;
      // Restrict to the product layer: these are strong, and the environment
      // must keep the lighting it had before the rig existed.
      light.layers.set(PRODUCT_LAYER);
    }
    productAmbientRef.current?.layers.set(PRODUCT_LAYER);
    // The can lives on that layer, so the camera has to render it.
    camera.layers.enable(PRODUCT_LAYER);
  }, [camera]);

  /* Scratch objects — allocated once, never inside the frame loop. */
  const scratch = useMemo(
    () => ({
      canPos: [0, 0, 0] as Vec3,
      canRot: [0, 0, 0] as Vec3,
      camPos: [0, 0, 0] as Vec3,
      camTarget: [0, 0, 0] as Vec3,
      smoothCam: new THREE.Vector3(0, -0.2, 2.4),
      smoothTarget: new THREE.Vector3(0, -0.35, -6),
      colourCore: new THREE.Color(),
      colourEdge: new THREE.Color(),
      colourDeep: new THREE.Color(),
      colourMid: new THREE.Color(),
      colourAccent: new THREE.Color(),
      colourFlash: new THREE.Color(),
      lastVh: 0,
      started: false,
      fpsAccum: 0,
      fpsFrames: 0,
    }),
    [],
  );

  useFrame((_, delta) => {
    if (scrollState.hidden) return;
    const dt = Math.min(delta, 1 / 20);
    const vh = scrollState.vh;

    scrollState.velocity = vh - scratch.lastVh;
    scratch.lastVh = vh;

    /* ---- flavour palette (switched inside a flash, never mid-frame) --- */
    const activeFlavor = flavorAt(vh);
    const palette = FLAVORS[activeFlavor].palette;
    scratch.colourCore.set(palette.core);
    scratch.colourEdge.set(palette.cobalt);
    scratch.colourDeep.set(palette.deep);
    scratch.colourMid.set(palette.ultraviolet);
    scratch.colourAccent.set(palette.luminous);

    /* ---- flashes and warp ------------------------------------------- */
    let flash = 0;
    for (const [at, rise, fall, strength] of K.FLASHES) {
      flash = Math.max(flash, pulse(vh, at, rise, fall) * strength);
    }
    const warp = sampleNumber(K.WARP, vh);

    /* ---- camera ------------------------------------------------------ */
    sampleVec3(K.CAMERA_POSITION, vh, scratch.camPos);
    sampleVec3(K.CAMERA_TARGET, vh, scratch.camTarget);
    const fov = sampleNumber(K.CAMERA_FOV, vh);

    if (!scratch.started) {
      scratch.smoothCam.set(...scratch.camPos);
      scratch.smoothTarget.set(...scratch.camTarget);
      scratch.started = true;
    } else {
      // Stiff enough to stay locked to the scroll (~50 ms of settle), soft
      // enough to absorb wheel-step jitter.
      const lambda = 22;
      scratch.smoothCam.set(
        damp(scratch.smoothCam.x, scratch.camPos[0], lambda, dt),
        damp(scratch.smoothCam.y, scratch.camPos[1], lambda, dt),
        damp(scratch.smoothCam.z, scratch.camPos[2], lambda, dt),
      );
      scratch.smoothTarget.set(
        damp(scratch.smoothTarget.x, scratch.camTarget[0], lambda, dt),
        damp(scratch.smoothTarget.y, scratch.camTarget[1], lambda, dt),
        damp(scratch.smoothTarget.z, scratch.camTarget[2], lambda, dt),
      );
    }

    camera.position.copy(scratch.smoothCam);
    camera.lookAt(scratch.smoothTarget);
    if (Math.abs(camera.fov - fov) > 0.001) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    /* ---- the can ------------------------------------------------------ */
    sampleVec3(K.CAN_POSITION, vh, scratch.canPos);
    sampleVec3(K.CAN_ROTATION, vh, scratch.canRot);
    const scale = sampleNumber(K.CAN_SCALE, vh);
    // Recoil rides on top of the locked position track and returns to zero, so
    // the approved composition is reacted to rather than moved. ~3px on screen.
    const recoil = sampleNumber(K.CAN_RECOIL, vh);
    const rig = rigRef.current;
    if (rig) {
      rig.position.set(
        scratch.canPos[0],
        scratch.canPos[1] + recoil * 0.007,
        scratch.canPos[2] - recoil * 0.004,
      );
      rig.rotation.set(...scratch.canRot);
      rig.scale.setScalar(scale);
      rig.updateMatrixWorld();
    }

    const can = canRef.current;
    if (can) {
      can.setLidState(
        sampleNumber(K.TAB_LIFT, vh),
        sampleNumber(K.FLAP_BREAK, vh),
        sampleNumber(K.CUT_EDGE_FLASH, vh),
      );
      can.setOpacity(sampleNumber(K.CAN_OPACITY, vh));
    }

    /* ---- flight trail ------------------------------------------------ */
    // The trail resolves the can's path from the same position track, so its
    // head is on the can by construction and its length does not depend on how
    // fast the user is scrolling. A small speed term adds energy on top.
    if (trailRef.current) {
      const speed = clamp01(Math.abs(scrollState.velocity) * 0.4);
      const intensity = sampleNumber(K.TRAIL_INTENSITY, vh) * (0.78 + speed * 0.22);
      trailRef.current.update(
        vh,
        sampleNumber(K.TRAIL_DRIFT, vh),
        camera.position,
        intensity,
        scratch.colourAccent,
        scratch.colourEdge,
      );
    }

    /* ---- environments -------------------------------------------------*/
    starsRef.current?.update(vh, sampleNumber(K.STARS_INTENSITY, vh), scratch.colourAccent);

    constellationRef.current?.update(
      sampleNumber(K.CONSTELLATION_DRAW, vh),
      sampleNumber(K.CONSTELLATION_OPACITY, vh),
      sampleNumber(K.VEGA_ENERGY, vh),
      scratch.colourAccent,
    );

    asteroidsRef.current?.update(
      vh,
      sampleNumber(K.ASTEROIDS_PRESENCE, vh),
      scratch.colourMid,
    );

    stationRef.current?.update(vh, sampleNumber(K.STATION_PRESENCE, vh), scratch.colourAccent);

    nebulaRef.current?.update(
      vh,
      sampleNumber(K.NEBULA_PRESENCE, vh),
      FLAVOR_SHAPE[activeFlavor],
      scratch.colourDeep,
      scratch.colourMid,
      scratch.colourCore,
    );

    liquidRef.current?.update(
      vh,
      sampleNumber(K.LIQUID_PRESENCE, vh),
      scratch.colourDeep,
      scratch.colourMid,
      scratch.colourCore,
      camera,
    );

    /* ---- overlays ------------------------------------------------------*/
    scratch.colourFlash.set(vh < 200 ? palette.luminous : palette.core);
    warpRef.current?.update(warp, flash, scratch.colourAccent, scratch.colourFlash, camera);

    // The release is a scene effect like any other: sampled tracks in,
    // transforms and uniforms out, nothing per-frame allocated, no React.
    burstRef.current?.update(
      sampleNumber(K.RELEASE_PRESSURE, vh),
      sampleNumber(K.RELEASE_SHOCK, vh),
      sampleNumber(K.RELEASE_VAPOR, vh),
      sampleNumber(K.RELEASE_FLOW, vh),
      sampleNumber(K.RELEASE_PRESENCE, vh),
    );

    particlesRef.current?.update(
      smoothstep(K.RELEASE_FRAMING.cutPointVh - 14, K.RELEASE_FRAMING.cutPointVh + 26, vh),
      smoothstep(1238, 1256, vh) * (1 - smoothstep(1300, 1345, vh)),
      scratch.colourMid,
      scratch.colourCore,
    );

    /* ---- product light rig --------------------------------------------*/
    // Translate the rig onto the can. Position only: rotation would drag the
    // key light around the body as the can spins.
    if (productRigRef.current && rig) {
      productRigRef.current.position.copy(rig.position);
      productRigRef.current.updateMatrixWorld();
    }

    const key = sampleNumber(K.KEY_LIGHT, vh);
    if (keyLightRef.current) keyLightRef.current.intensity = 2.3 * key;
    if (accentLightRef.current) {
      accentLightRef.current.intensity = 2.1 * key;
      accentLightRef.current.color.set(FLAVORS[activeFlavor].keyLight);
    }
    if (rimLightRef.current) rimLightRef.current.intensity = 0.55 * key;

    // Environment lights keep their original flavour tinting.
    if (envAccentRef.current) envAccentRef.current.color.set(FLAVORS[activeFlavor].keyLight);
    if (envRimRef.current) envRimRef.current.color.set(FLAVORS[activeFlavor].rimLight);

    // Short exposure pulses only — the baseline never drifts.
    gl.toneMappingExposure = 1 + flash * 0.55 + warp * 0.18;

    /* ---- debug readout (plain object, no React involvement) ----------- */
    scratch.fpsAccum += delta;
    scratch.fpsFrames += 1;
    if (scratch.fpsAccum >= 0.5) {
      sceneReadout.fps = Math.round(scratch.fpsFrames / scratch.fpsAccum);
      scratch.fpsAccum = 0;
      scratch.fpsFrames = 0;
    }
    sceneReadout.canPosition[0] = scratch.canPos[0];
    sceneReadout.canPosition[1] = scratch.canPos[1];
    sceneReadout.canPosition[2] = scratch.canPos[2];
    sceneReadout.cameraPosition[0] = camera.position.x;
    sceneReadout.cameraPosition[1] = camera.position.y;
    sceneReadout.cameraPosition[2] = camera.position.z;
    sceneReadout.fov = camera.fov;
    sceneReadout.warp = warp;
  });

  return (
    <>
      {/* Environment lighting — unchanged from before the product rig, so the
          asteroid field and the station ring look exactly as they did. */}
      <ambientLight intensity={0.09} color="#C9C6D8" />
      <directionalLight position={[3.2, 5.4, 4.2]} color="#FFFBF2" intensity={1.35} />
      <directionalLight ref={envAccentRef} position={[-4.6, 1.4, -2.6]} intensity={2.4} />
      <directionalLight ref={envRimRef} position={[2.6, -2.2, -4.8]} intensity={1.9} />

      {/*
        Product light rig.

        The group is translated onto the can every frame (position only, never
        rotation), and every light aims at a target that lives inside it. The
        result is a lighting angle that is constant in world space but always
        pointed at the product — so the can keeps the same read whether it is
        crossing an empty starfield or passing in front of the station ring.
      */}
      <group ref={productRigRef}>
        <object3D ref={productTargetRef} />
        {/* The can is off layer 0, so it needs its own ambient. */}
        <ambientLight ref={productAmbientRef} intensity={0.16} color="#BFC4DC" />
        {/* Soft neutral key. This is the light that reveals the aluminium. */}
        <directionalLight
          ref={keyLightRef}
          position={[2.4, 3.0, 4.2]}
          color="#FFF4E8"
          intensity={0}
        />
        {/* Restrained flavour rim, opposite the key. */}
        <directionalLight ref={accentLightRef} position={[-3.4, 0.6, -3.6]} intensity={0} />
        {/* Faint cool fill so the shadow side keeps a readable edge without
            being lifted into grey. */}
        <directionalLight
          ref={rimLightRef}
          position={[-3.6, -1.0, 2.6]}
          color="#AEB6D8"
          intensity={0}
        />
      </group>

      <StarLayers ref={starsRef} />
      <LyraConstellation ref={constellationRef} />
      <NebulaVolume ref={nebulaRef} />
      <AsteroidField ref={asteroidsRef} />
      <StationRing ref={stationRef} />
      <LiquidWave ref={liquidRef} />

      <FlightTrail ref={trailRef} />

      <group ref={rigRef}>
        <CanModel ref={canRef} flavor={flavor} />
        <ReleaseParticles ref={particlesRef} />
        <ReleaseBurst ref={burstRef} />
      </group>

      <WarpField ref={warpRef} />
    </>
  );
}
