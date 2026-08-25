import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  APERTURE_HINGE_Z,
  BASE_PROFILE,
  BODY_PROFILE,
  LABEL,
  LID_PROFILE,
  LID_Y,
  PANEL_MAX_ROTATION,
  PANEL_PRELOAD,
  PANEL_RECESS,
  RIM_PROFILE,
  TAB_MAX_ROTATION,
  buildCavityShell,
  buildLathe,
  buildLidTop,
  buildPanelFlap,
  buildRivet,
  buildScoreRing,
  buildStayTab,
} from './canProfile';
import { clamp01, ease } from '../../config/easing';
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
  /**
   * The tab and the flap are driven separately. Deriving one from the other
   * forces the break to inherit the tab's pacing, and the break has to be much
   * faster than the lift that causes it.
   */
  setLidState(tabLift: number, flapBreak: number, cutEdgeFlash: number): void;
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
      // The countersink ring; the flat plate that carries the aperture is
      // separate, because a lathe cannot express a hole.
      lid: buildLathe(LID_PROFILE, 160),
      lidTop: buildLidTop(),
      label: new THREE.CylinderGeometry(LABEL.radius, LABEL.radius, LABEL.height, 160, 1, true),
      tab: buildStayTab(),
      rivet: buildRivet(),
      panel: buildPanelFlap(),
      score: buildScoreRing(),
      cavity: buildCavityShell(),
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
    // The scored flap is the same sheet as the lid. It needs no polygon offset
    // any more: it sits inside a real hole, a hair below the lid surface.
    const panel = new THREE.MeshPhysicalMaterial({
      color: '#33333D',
      metalness: 0.88,
      roughness: 0.54,
      envMapIntensity: 0.7,
    });
    // Freshly cut aluminium on the aperture wall. Brighter than the lid so the
    // opening reads as a real edge with thickness behind it.
    const cutEdge = new THREE.MeshPhysicalMaterial({
      color: '#B6B6C4',
      metalness: 0.95,
      roughness: 0.22,
      envMapIntensity: 1,
      // Driven by CUT_EDGE_FLASH at the break; zero at every other moment.
      emissive: new THREE.Color('#9FB4FF'),
      emissiveIntensity: 0,
    });
    // Score line. It sits physically above the lid, so no offset trickery.
    const score = new THREE.MeshBasicMaterial({
      color: '#141419',
      side: THREE.DoubleSide,
    });
    /*
     * The inside of the can. `BackSide`, because we are looking at the inner
     * face of a shell.
     *
     * Deliberately unlit. There is no shadow map in this scene, so a lit
     * material here receives the full product key as though the lid were not
     * above it — and because the lid around it is metal, and metal has almost
     * no diffuse, a lit cavity comes out *brighter* than the lid it is cut
     * into. The opening then reads as a pale patch instead of a hole. An unlit
     * near-black is the honest stand-in for the shadow the scene cannot cast.
     */
    const interior = new THREE.MeshBasicMaterial({
      color: '#0C0C12',
      side: THREE.BackSide,
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

    return {
      aluminium,
      rimMetal,
      lidMetal,
      tabMetal,
      rivetMetal,
      panel,
      cutEdge,
      score,
      interior,
      label,
    };
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
      setLidState(tabLift: number, flapBreak: number, cutEdgeFlash: number) {
        // Not `clamp01`. TAB_LIFT overshoots slightly past 1 on the frame the
        // score parts — the hand is still pulling when the resistance vanishes
        // — and clamping at 1 would swallow exactly the moment the whole snap
        // is built around. The ceiling is still hard, so a bad track value can
        // never fold the tab through the lid.
        const lift = Math.min(1.09, Math.max(0, tabLift));
        // Pure rotation about the rivet — no translation at all, so the tab
        // pivots on the lid the way a real stay-tab does instead of rising off
        // it. A hair of flex near full tension so the metal reads as loaded
        // rather than as a rigid lever.
        // Goes very slightly negative past lift 1, which is the right sign:
        // the metal unloads as the flap lets go.
        const flex = Math.sin(lift * Math.PI) * 0.012;
        if (tabRef.current) tabRef.current.rotation.x = lift * TAB_MAX_ROTATION + flex;

        // The break runs on its own track through `impact`: already past the
        // resting angle while a smoothstep would still be accelerating, then
        // ~12% overshoot and a ring-down. The flap never deforms — this is one
        // rigid rotation about the hinge, just badly behaved on purpose.
        //
        // Before it goes, the flap is preloaded: while the tab is straining and
        // the score is still intact, it lifts a fraction of a degree the wrong
        // way, as if the contents were pushing back. Derived from the tab, so
        // it needs no track of its own and unwinds exactly on reverse scroll.
        const breakage = clamp01(flapBreak);
        const preload = clamp01(lift) * (1 - breakage) * PANEL_PRELOAD;
        if (panelRef.current) {
          panelRef.current.rotation.x =
            ease('impact', breakage) * PANEL_MAX_ROTATION - preload;
        }

        // Freshly exposed aluminium catches the light for a beat.
        materials.cutEdge.emissiveIntensity = cutEdgeFlash * 3.4;
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

      {/* Flat lid plate carrying the drinking aperture as genuine negative
          space. Two material groups: the sheet faces, then the cut wall the
          extrusion leaves around the hole. */}
      <mesh
        geometry={geometries.lidTop}
        material={[materials.lidMetal, materials.cutEdge]}
        position={[0, LID_Y, 0]}
      />

      {/* The can's dark inside, which is what makes the aperture read as a
          hole rather than a black shape painted on the lid. */}
      <mesh geometry={geometries.cavity} material={materials.interior} />

      {/* Scored flap. It plugs the aperture from just below the lid surface,
          then hinges on the aperture's near edge and folds into the can. It
          stays attached for the whole travel. */}
      <group ref={panelRef} position={[0, LID_Y - PANEL_RECESS, APERTURE_HINGE_Z]}>
        <mesh geometry={geometries.panel} material={materials.panel} />
      </group>

      {/* Score line, a hair proud of the lid so it never z-fights. */}
      <mesh
        geometry={geometries.score}
        material={materials.score}
        position={[0, LID_Y + 0.0006, 0]}
      />

      {/* Rivet: fixed to the lid, not to the tab, so it stays upright while the
          tab turns around it. Its head caps the tab's rivet hole. */}
      <mesh
        geometry={geometries.rivet}
        material={materials.rivetMetal}
        position={[0, LID_Y + 0.006, 0]}
      />

      {/* Stay-tab. The group sits on the rivet, so `rotation.x` swings the
          finger end up and the nose down about that single point — the tab
          never leaves the lid. */}
      <group ref={tabRef} position={[0, LID_Y, 0]}>
        <mesh geometry={geometries.tab} material={materials.tabMetal} />
      </group>
    </group>
  );
});
