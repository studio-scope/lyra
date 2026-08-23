import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BASE_PROFILE,
  BODY_PROFILE,
  LABEL,
  LID_PROFILE,
  LID_Y,
  PANEL_Y,
  RIM_PROFILE,
  SCORE_Y,
  buildLathe,
  buildOpeningPanel,
  buildScoreLine,
  buildStayTab,
} from './canProfile';
import {
  bodyColours,
  createBrushedRoughness,
  createLabelTextures,
  disposeLabelTextures,
} from './canLabelTexture';
import type { FlavorId } from '../../config/flavors';
import { useFontsReady } from '../../hooks/useFonts';
import { PRODUCT_LAYER } from '../productLayer';

/**
 * The one physical can. Mounted exactly once, for the whole site.
 *
 * A flavour change swaps the label textures and retints the aluminium — the
 * geometry, the materials and the object identity are untouched, which is what
 * keeps the flight trail attached and the silhouette continuous across
 * chapters.
 */

export interface CanHandle {
  group: THREE.Group | null;
  setTabLift(v: number): void;
  setOpacity(v: number): void;
}

interface Props {
  flavor: FlavorId;
}

export const CanModel = forwardRef<CanHandle, Props>(function CanModel({ flavor }, ref) {
  const groupRef = useRef<THREE.Group>(null);
  const tabRef = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  // Grazing angles across a cylinder are exactly the case anisotropic filtering
  // exists for; without it the label smears at the silhouette edges.
  const anisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);
  // If Syncopate lands after boot, the label is redrawn rather than left with a
  // fallback face baked into the texture.
  const fontsReady = useFontsReady();

  /* ---- geometry: built once, reused for the whole session --------- */
  const geometries = useMemo(
    () => ({
      base: buildLathe(BASE_PROFILE, 160),
      body: buildLathe(BODY_PROFILE, 160),
      rim: buildLathe(RIM_PROFILE, 160),
      lid: buildLathe(LID_PROFILE, 160),
      label: new THREE.CylinderGeometry(LABEL.radius, LABEL.radius, LABEL.height, 160, 1, true),
      tab: buildStayTab(),
      panel: buildOpeningPanel(),
      score: buildScoreLine(),
    }),
    [],
  );

  useEffect(
    () => () => Object.values(geometries).forEach((g) => g.dispose()),
    [geometries],
  );

  /* ---- textures ----------------------------------------------------*/
  const labelTextures = useMemo(
    () => createLabelTextures(flavor, anisotropy),
    [flavor, anisotropy, fontsReady],
  );
  useEffect(() => () => disposeLabelTextures(labelTextures), [labelTextures]);

  /** Vertical brush on the bare aluminium above and below the sleeve. */
  const brushed = useMemo(() => createBrushedRoughness(anisotropy), [anisotropy]);
  useEffect(() => () => brushed.dispose(), [brushed]);

  /* ---- materials --------------------------------------------------*/
  const materials = useMemo(() => {
    // Tinted satin aluminium. Roughness comes from the brushed map; `sheen`
    // carries the flavour's secondary reflection tint at grazing angles, which
    // is what keeps the body from reading as flat black.
    const aluminium = new THREE.MeshPhysicalMaterial({
      metalness: 0.88,
      roughness: 0.29,
      roughnessMap: brushed,
      clearcoat: 0.42,
      clearcoatRoughness: 0.2,
      sheen: 0.35,
      sheenRoughness: 0.55,
      envMapIntensity: 0.85,
    });
    // The rolled seam sits a step brighter than the body — enough to tell the
    // eye this is a can and not a tube, not so much that it reads as a chrome
    // ring floating above the lid.
    const rimMetal = new THREE.MeshPhysicalMaterial({
      color: '#4A4A55',
      metalness: 0.92,
      roughness: 0.43,
      clearcoat: 0.22,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.55,
    });
    // Brushed dark titanium lid.
    // Brushed dark titanium. The brush map runs radially on a lathe lid, which
    // is how a real can end is finished, and it stops the lid reading as a
    // black hole inside the rim.
    const lidMetal = new THREE.MeshPhysicalMaterial({
      color: '#3B3B46',
      metalness: 0.88,
      roughness: 0.52,
      roughnessMap: brushed,
      envMapIntensity: 0.9,
    });
    // Tab and rivet run markedly lighter than the lid so the tab stays legible
    // against it in the Release close-up.
    const tabMetal = new THREE.MeshPhysicalMaterial({
      color: '#6B6B79',
      metalness: 0.95,
      roughness: 0.32,
      envMapIntensity: 0.9,
    });
    const rivetMetal = new THREE.MeshPhysicalMaterial({
      color: '#7C7C8B',
      metalness: 0.96,
      roughness: 0.28,
      envMapIntensity: 0.9,
    });
    // The scored panel and its score line are coplanar with the lid, so both
    // carry a polygon offset. Without it they z-fight the lid and vanish, and
    // the panel would disappear underneath it the moment it is pressed.
    const panel = new THREE.MeshPhysicalMaterial({
      color: '#2A2A33',
      metalness: 0.88,
      roughness: 0.56,
      envMapIntensity: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    // The score line has to stay visible against the lid, or the opening reads
    // as a smudge rather than a scored panel.
    const score = new THREE.MeshBasicMaterial({
      color: '#141419',
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });

    // Printed sleeve. `roughness` and `metalness` both sit at 1 so the
    // generated maps are the sole authority — that is what lets the foil band
    // behave as metal while the ink around it does not.
    const label = new THREE.MeshPhysicalMaterial({
      metalness: 1,
      roughness: 1,
      clearcoat: 0.4,
      clearcoatRoughness: 0.18,
      sheen: 0.3,
      sheenRoughness: 0.55,
      envMapIntensity: 0.95,
    });

    return { aluminium, rimMetal, lidMetal, tabMetal, rivetMetal, panel, score, label };
  }, [brushed]);

  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  useEffect(() => {
    materials.label.map = labelTextures.map;
    materials.label.roughnessMap = labelTextures.roughnessMap;
    materials.label.metalnessMap = labelTextures.metalnessMap;
    materials.label.needsUpdate = true;
  }, [materials, labelTextures]);

  /** Retint the bare aluminium to match the print for this flavour. */
  useEffect(() => {
    const { base, tint } = bodyColours(flavor);
    materials.aluminium.color.set(base);
    materials.aluminium.sheenColor.set(tint);
    materials.label.sheenColor.set(tint);
  }, [materials, flavor]);

  // Move every part of the can onto the product layer, so only the product
  // rig lights it. Nothing else in the scene is on this layer.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.traverse((o) => o.layers.set(PRODUCT_LAYER));
  }, [geometries, materials]);

  /* ---- imperative controls used by the scene controller ---------- */
  const opacityRef = useRef(1);
  useImperativeHandle(
    ref,
    () => ({
      get group() {
        return groupRef.current;
      },
      setTabLift(v: number) {
        // Pure rotation about the rivet — no translation at all, so the tab
        // pivots on the lid the way a real stay-tab does instead of rising off
        // it. 0.55 rad is 31.5 degrees at full lift.
        if (tabRef.current) tabRef.current.rotation.x = v * 0.55;
        // The nose dents the scored panel by roughly two degrees — enough to
        // read as pressed, small enough that the panel stays inside the lid
        // dish instead of sinking under it. Phase 1 stops here: it never opens.
        if (panelRef.current) panelRef.current.rotation.x = v * 0.038;
      },
      setOpacity(v: number) {
        if (Math.abs(v - opacityRef.current) < 0.001) return;
        opacityRef.current = v;
        const transparent = v < 0.999;
        for (const m of Object.values(materials)) {
          if (m.transparent !== transparent) {
            m.transparent = transparent;
            m.needsUpdate = true;
          }
          m.opacity = v;
          m.depthWrite = !transparent;
        }
        if (groupRef.current) groupRef.current.visible = v > 0.002;
      },
    }),
    [materials],
  );

  return (
    <group ref={groupRef}>
      <mesh geometry={geometries.base} material={materials.aluminium} />
      <mesh geometry={geometries.body} material={materials.aluminium} />
      <mesh geometry={geometries.rim} material={materials.rimMetal} />
      <mesh geometry={geometries.lid} material={materials.lidMetal} />

      {/* Printed sleeve. Rotated so the artwork's centre faces +Z, which is
          what the rotation keyframes treat as "label square to camera". */}
      <mesh
        geometry={geometries.label}
        material={materials.label}
        position={[0, LABEL.bottom + LABEL.height / 2, 0]}
        rotation={[0, Math.PI, 0]}
      />

      {/* Scored opening panel: flush with the lid, hinged at its inner edge so
          the tab's nose can depress it. The score line stays with the lid — it
          is the outline the panel is pressed into, not part of the panel. */}
      <group ref={panelRef} position={[0, PANEL_Y, 0]}>
        <mesh geometry={geometries.panel} material={materials.panel} />
      </group>
      <mesh
        geometry={geometries.score}
        material={materials.score}
        position={[0, SCORE_Y, 0]}
      />

      {/* Stay-tab. The group sits on the rivet, so `rotation.x` swings the
          finger end up and the nose down about that single point — the tab
          never leaves the lid. */}
      <group ref={tabRef} position={[0, LID_Y, 0]}>
        <mesh geometry={geometries.tab} material={materials.tabMetal} />
        <mesh position={[0, 0.012, 0]} material={materials.rivetMetal}>
          <cylinderGeometry args={[0.026, 0.03, 0.026, 20]} />
        </mesh>
      </group>

    </group>
  );
});
