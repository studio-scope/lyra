# LYRA

## Project Overview

**LYRA** is a fictional premium cosmic energy drink. This repository is the
scroll-driven **Scope showcase site** built around it.

The site exists primarily to be **screen-recorded for an Instagram/TikTok
advertisement**. It is a visual prototype, not a real product and not a
production commerce website. There is no cart, no checkout, no CMS and no
back end. Every visual on screen is generated in code — no AI-generated
imagery, no stock assets, no downloaded 3D models and no video.

---

## Current Project Status

**Status date: 25 August 2026 — Phase 3 complete. Chapter 05 is native.**

The site runs end to end. There is no placeholder left in the scroll and the
page ships **no video at all**.

- six scroll chapters, full narrative traversal working;
- one continuous procedural 3D can, mounted once and alive for the whole page;
- **Ignition** — Lyra constellation draws in, Vega ignites, the can launches;
- **Asteroid Run** — procedural asteroid field, curved flight path;
- **Flavor Nebulas** — NOVA, COMET and VOID moments with warp transitions;
- **Station Flyby** — procedural station ring with a staggered HUD readout;
- **Release** — the lid mechanism opens a real aperture and the pressure,
  vapour, liquid and droplets are rendered natively in the same scene;
- **final CTA** — centred wordmark lockup;
- a continuous flight trail that persists across every chapter;
- coded label textures for NOVA, COMET and VOID;
- scroll pacing calibrated with `SCROLL_DISTANCE_SCALE = 1.75`;
- debug tooling (`D` readout, `V` release annotation, `?capture=1`).

Chapters 01–04 remain the **approved procedural implementation** and were not
touched by Phase 3.

### The external-video approach was rejected

Phase 2 shipped Chapter 05 as a Higgsfield-generated liquid plate composited
over a still of the live scene and scrubbed by scroll. **That approach is
abandoned.** It was rejected on architecture, not on encoding quality: a DOM
`<video>` layer can never match the live renderer, so the can visibly changed
sharpness, material and lighting at the cut point. Chapter 05 is now rendered
entirely in the existing R3F scene, which removes the discontinuity by
construction — there is nothing to match because nothing is composited.

The plate, the probes and the compositing pipeline are gone from the site.
`public/assets/open-pour/open-pour-final.mp4` has been deleted.

### Lid mechanism (rebuilt)

The can's opening hardware is real geometry, not a texture:

- a **genuine drinking aperture** cut with `THREE.Shape.holes`, so the extruded
  side walls become the aperture's cut edge and the visible sheet thickness;
- a **dark interior shell** built from the body and base profiles, giving the
  opening real depth to look into;
- a **separate hinged flap** that breaks along the score and folds into the can,
  staying attached for the whole travel;
- a **rebuilt stay-tab** — stamped teardrop plate, narrow neck, one oval finger
  opening, short formed nose — turning on a **fixed rivet**.

Tab travel is 0 → 0.55 rad (31.5°); the flap follows to 1.15 rad (66°) once the
nose has actually reached it, so the can reads as sealed until it is not.

---

## Locked Visual Decisions

These are **approved**. Do not casually redesign them.

- Brand name: **LYRA**.
- Primary wordmark: **Syncopate Bold (700)**.
- **No external logo symbol.**
- **No constellation icon attached to the wordmark.**
- The wordmark stays **typography-only** — no glow, gradient, shadow or slash.
- Deep black cosmic environment; blacks stay black.
- **NOVA** — ultraviolet / cobalt.
- **COMET** — cyan / teal.
- **VOID** — magenta / deep violet.
- Tall sleek **355 ml beverage-can geometry**.
- Large **vertical LYRA label**, set once as a whole word rotated 90°.
- Small technical flavor codes (`NOVA / 01`, `COMET / 02`, `VOID / 03`).
- Restrained **flavor-specific foil bands**, one diagonal band per flavor.
- **Dark satin metallic body.**
- **No** printed lightning, glowing crack, flames or cheap neon packaging.
- Glow comes from **scene lighting and environment**, never from the print.
- The **chapter structure and scroll choreography are locked** — chapter
  ranges, camera paths, can keyframes and section timing.
- **`SCROLL_DISTANCE_SCALE = 1.75`** — the approved, measured scroll pacing.
- **Chapter 05 stays native.** No Higgsfield, no external video, no image
  sequence, no canvas capture, no AI-generated can — unless the owners
  explicitly reopen that decision.

---

## Latest Refinement

Completed and visually verified at 1440 × 900:

- realistic beverage-can silhouette (straight sidewall, tight shoulder knuckle,
  rolled top seam, real base contact ring);
- increased can width (radius 0.48 → 0.556, +15.8%);
- improved top and bottom rims;
- improved metallic material (brushed roughness map, clearcoat, flavor-tinted
  sheen);
- dedicated product lighting on its own render layer;
- high-resolution coded label textures (2048 × 1218, three maps per flavor);
- Syncopate Bold wordmark across hero, CTA and the can label;
- three visually distinct flavor variants — verified under neutral white light,
  not only under their own coloured environments;
- improved CTA hierarchy (wordmark ~333 px wide at 1440);
- **corrected hero wordmark separation and blur** — 57.8 px of clearance above
  the can's top rim, blur exactly 0 at settle;
- **realistic attached stay-tab and scored opening panel** — teardrop plate with
  an oval finger opening, rotating ~31° about its rivet, with a scored panel
  that dents but never opens.

**Not implemented:** there is no fluid simulation and there is no need for one.
Chapter 05 is authored motion — keyframed tracks driving procedural geometry —
not a solver.

---

## Technical Stack

Read from `package.json` at the status date.

| Package | Version |
| --- | --- |
| react / react-dom | ^19.2.8 |
| typescript | ^7.0.2 |
| vite | ^8.2.2 |
| @vitejs/plugin-react | ^6.1.0 |
| motion | ^13.1.1 |
| three | ^0.185.1 |
| @react-three/fiber | ^9.7.0 |
| @react-three/drei | ^10.7.8 |
| @react-three/postprocessing | ^3.1.0 |
| postprocessing | ^6.39.4 |
| @fontsource/syncopate | ^5.3.0 |
| @fontsource/geist-sans | ^5.3.0 |
| @fontsource/geist-mono | ^5.3.0 |
| @types/react | ^19.2.18 |
| @types/three | ^0.185.4 |
| @types/node | ^26.2.0 |

**Styling: CSS Modules** (`*.module.css`) plus a global token layer in
`src/styles/tokens.css` and `src/styles/global.css`. No UI framework.

---

## Local Development

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run preview
```

Dev server: `http://localhost:5173`.

**Recommended recording viewport: 1440 × 900.** The layout scales down to
1280 × 720. The can, headline and every interaction stay inside the central 55%
of the viewport width and the central 80% of its height, so a 9:16 crop through
the middle stays usable.

### Development controls

Both are **off by default** so the recording state is clean.

| Key | Toggles |
| --- | --- |
| `D` | Debug readout: scroll progress, chapter, flavor, FPS, can and camera position, FOV, warp |
| `V` | Chapter 05 release annotation: framing box, reference frame, vh ranges, progress |

### Capturing reference frames

`?capture=1` puts the app in QA capture mode: `preserveDrawingBuffer` is enabled
and the render loop switches to `frameloop="never"`, driven by hand through
`window.__lyra.advance(timestamp, true)`. Frames become deterministic and no
longer depend on requestAnimationFrame.

In dev only, `POST /__qa-capture?name=<path>` writes a PNG body to
`docs/qa/<path>.png`. Together these produced everything in `docs/qa/`. Neither
exists in a production build.

> When driving `advance()` manually, always pass a **monotonically increasing**
> timestamp. A timestamp that goes backwards hands `useFrame` a negative delta,
> which diverges the camera damping into NaN and renders a black frame.

---

## Architecture

| Responsibility | Path |
| --- | --- |
| Scene controller (scroll → motion) | `src/experience/SceneController.tsx` |
| Canvas, environment, post-processing | `src/experience/Experience.tsx` |
| Scroll timeline / chapter config | `src/config/timeline.ts` |
| Camera, can and effect keyframes | `src/config/choreography.ts` |
| Scroll source (single) | `src/hooks/useScroll.ts` |
| CanModel | `src/experience/can/CanModel.tsx` |
| Can lathe profiles + tab/panel shapes | `src/experience/can/canProfile.ts` |
| Label-texture generator | `src/experience/can/canLabelTexture.ts` |
| Product light layer constant | `src/experience/productLayer.ts` |
| Flight trail | `src/experience/effects/FlightTrail.tsx` |
| Warp / flash overlay | `src/experience/effects/WarpField.tsx` |
| Release particles | `src/experience/effects/ReleaseParticles.tsx` |
| **Native release: pressure, vapour, liquid, droplets** | `src/experience/effects/ReleaseBurst.tsx` |
| Asteroid field | `src/experience/environments/AsteroidField.tsx` |
| Station ring | `src/experience/environments/StationRing.tsx` |
| Nebula placeholders | `src/experience/environments/NebulaVolume.tsx` |
| CTA liquid placeholder | `src/experience/environments/LiquidWave.tsx` |
| Star layers | `src/experience/environments/StarLayers.tsx` |
| Lyra constellation | `src/experience/environments/LyraConstellation.tsx` |
| Chapter 05 copy + `V` overlay | `src/chapters/Chapter05Release.tsx` |
| HUD | `src/components/HudOverlay.tsx` |
| Wordmark component | `src/components/LyraWordmark.tsx` |
| Debug panel | `src/components/DebugPanel.tsx` |
| Chapter components | `src/chapters/Chapter0{1..6}*.tsx` |
| Chapter stage / envelopes | `src/chapters/ChapterSection.tsx` |
| All on-screen copy | `src/config/copy.ts` |
| Colour tokens | `src/config/colors.ts` + `src/styles/tokens.css` |

Two properties are enforced by construction:

1. **Nothing re-renders React per frame.** `SceneController` never calls
   `setState`; it samples tracks and writes straight into transforms and
   uniforms. React state changes only when the chapter or flavor changes.
2. **Every track is a pure function of scroll position.** No track integrates
   over time, so scrubbing backward reproduces the forward state exactly and a
   violent flick cannot desynchronise anything. This is also why the flight
   trail re-samples the can's own position track instead of recording frames.

Native scroll only — no smooth-scroll library.

### Lighting

Two rigs:

- **Environment** — ambient plus three directional lights on layer 0. Lights the
  asteroid field and the station ring.
- **Product rig** — a group translated onto the can every frame (position only,
  never rotation), restricted to `PRODUCT_LAYER`. Because it is layer-restricted,
  the neutral key can be strong enough to reveal the aluminium in a dark chapter
  without lifting the environment with it.

A procedural `<Environment>` of tall narrow strip lights supplies the reflections
a cylindrical metal product wants — each strip becomes one crisp vertical
specular band.

---

## Scroll Chapters

All choreography is expressed in **virtual vh** (`0 → 1450`). No component
invents a scroll number of its own.

| # | Chapter | Range (vh) | Flavor |
| --- | --- | --- | --- |
| 1 | Ignition | 0 – 180 | NOVA |
| 2 | Asteroid Run | 180 – 420 | NOVA |
| 3 | Flavor Nebulas | 420 – 820 | NOVA → COMET → VOID |
| 4 | Station Flyby | 820 – 1080 | VOID |
| 5 | Open & Pour | 1080 – 1320 | VOID |
| 6 | CTA | 1320 – 1450 | VOID |

Chapter 3's three moments run 420–553, 553–686 and 686–820. Label textures swap
at vh **566** and **699**, both at the peak of a warp flash, so the change is
never observed mid-frame.

**The same physical can persists through the entire experience.** It is mounted
once. A flavor change swaps the label textures and retints the aluminium —
geometry, materials and object identity are never replaced. That is what keeps
the flight trail attached and the silhouette continuous across chapters.

### Scroll architecture: logical timeline vs physical distance

These are two different things and conflating them is the trap.

- **Logical timeline: 0 → 1450vh, unchanged.** This is a coordinate system, not
  a pace. Every keyframe in `choreography.ts` is written in it, so changing
  `TOTAL_VH` would silently invalidate all of them.
- **Physical distance is scaled independently** by `SCROLL_DISTANCE_SCALE` in
  `src/config/timeline.ts`. The spacer is `TOTAL_VH * SCROLL_DISTANCE_SCALE`
  tall; `useScroll.readScroll` divides by the *measured* document height, so
  the inverse can never drift out of sync and no component knows the scale
  exists.

```ts
physicalPageVh  = TOTAL_VH * SCROLL_DISTANCE_SCALE   // 1450 * 1.75
logicalScrollVh = (scrollY / maxScroll) * TOTAL_VH   // the only inverse
```

Measured at 1440 × 900 with real wheel events:

| | Baseline (scale 1.0) | Shipped (scale 1.75) |
| --- | --- | --- |
| Scrollable height | 12,150 px | **21,938 px** |
| Wheel notches to vh 1450 | 122 | **220** |
| Full traversal | 16.9 s | **≈ 29.4 s** |
| CTA arrival | 15.6 s | **≈ 26.9 s** |
| Largest single-notch jump | 11.93 vh | **6.61 vh** |

Both traversals were driven at the same ~750 CSS px/s. **The scroll correction
changed no camera keyframe, no choreography track, no damping and no chapter
range** — only how much page the timeline is spread across. Verified at 16
logical checkpoints: camera, FOV and can transform are identical to the 4th
decimal, with the residual fully accounted for by integer-pixel seek
quantisation.

> Do not "fix" pacing by increasing damping, stretching individual tracks or
> changing `TOTAL_VH`. Damping controls perceived lag, not scroll sensitivity.
> `SCROLL_DISTANCE_SCALE` is the only correct lever, and it is calibrated.

---

## Asset Pipeline

**Nano Banana has not been used for any scene asset yet.** Everything currently
on screen is coded.

Next planned assets:

1. final **NOVA** nebula background;
2. final **COMET** nebula background;
3. final **VOID** nebula background;
4. possible **station environment plate**;
5. **Open & Pour end-frame reference**.

Rules for that pipeline:

- **The logo and the can typography must not be generated through Nano Banana.**
  The wordmark is live Syncopate Bold type, and the can label is drawn with
  Canvas2D. Both stay coded.
- **Nebula images must contain no can, no logo, no text and no HUD.** They are
  pure background plates.
- **The real-time can remains coded.** Do not replace it with a generated image
  or a generated mesh.
- **Asteroids, the constellation and the HUD remain coded.**

Nebula plates must fall to true black at every edge — the composition depends on
the frame corners staying black.

### Asset slots

These folders exist and are **intentionally empty**. The application runs
normally with all of them empty.

| Slot | Purpose | Type | Aspect | Resolution |
| --- | --- | --- | --- | --- |
| `public/assets/nebula-nova` | NOVA environment plate | Background | 16:9 | 3840 × 2160 |
| `public/assets/nebula-comet` | COMET environment plate | Background | 16:9 | 3840 × 2160 |
| `public/assets/nebula-void` | VOID environment plate | Background | 16:9 | 3840 × 2160 |
| `public/assets/station` | Station hull / panel detail | Reference | 1:1 | 2048 × 2048 |

Nebula plates replace the procedural volumes in `NebulaVolume.tsx`, which is
driven entirely by uniforms — swapping in textured plates is a fragment-shader
change, not a rewrite of the chapter.

---

## Chapter 05 — Release (native)

Chapter 05 is rendered entirely in the live R3F scene. **There is no video, no
image sequence, no canvas capture, no baked plate and no AI-generated can.**
The live can and its label are authoritative and are never substituted.

### What is real geometry

`src/experience/can/canProfile.ts` builds the opening hardware as geometry, not
as a texture or a decal:

- a **genuine drinking aperture** cut with `THREE.Shape.holes`, so the extruded
  side walls become the aperture’s cut edge and its visible sheet thickness;
- a **dark interior shell** built from the body and base profiles inset 0.01,
  so the opening has real depth to look into;
- a **separate hinged flap** that breaks along the score and folds into the
  can, staying attached for the whole travel;
- a **stay-tab** — stamped teardrop plate, narrow neck, one oval finger
  opening, short formed nose — turning on a **fixed rivet**.

### The mechanical sequence

All of it is scroll-driven. The tab and the flap are driven by **separate**
tracks: deriving one from the other forces the break to inherit the tab’s
pacing, and the break has to be far faster than the lift that causes it.

| Beat | vh | What happens |
| --- | --- | --- |
| Sealed hold | 1152 – 1189 | Nothing moves. Internal pressure glow only. |
| Tab tension | 1189 – 1233 | `TAB_LIFT` 0 → 1 (0 → 27.4°) over 44 vh. Flap stays sealed. |
| **Snap** | 1233 – 1247 | `FLAP_BREAK` fires over 14 vh, 0.8° → 66°, on the `impact` easing — a damped spring that overshoots ~12% (peak 72.5°) and rings down to 65.9°. |
| Reaction | 1245 – 1268 | `CAN_RECOIL` (≈3 px on screen, counter-settling through zero), `CUT_EDGE_FLASH` on the aperture’s cut edge, and a compact radial pressure ring. |
| Release | 1253 – 1320 | Vapour, a short tapered liquid stem and 9 irregular droplets, decaying into the CTA. |

`impact` lives in `src/config/easing.ts` and deliberately returns values above
1 mid-flight. That is the point: it is a mechanical break, not an ease.

### The native effects

`src/experience/effects/ReleaseBurst.tsx` is mounted **inside the can’s rig**,
so it stays welded to the real aperture whatever the can does. It contains:

- a **pressure ring** and an under-flap glow, both shader quads;
- **vapour** as a `Points` system, each point carrying its own direction and
  falloff so there is no circular sprite boundary and nothing reads as smoke;
- the **liquid stem** as a `TubeGeometry` along a `CatmullRomCurve3` rising out
  of the aperture. Indices run path-first, so `setDrawRange` reveals it along
  the path rather than fading it in;
- **9 droplets** in one `InstancedMesh`, each with its own launch moment, size,
  aspect, spin and normalised divergence direction.

Everything originates at `APERTURE`, inside the opening — never above or beside
it. The stem is deliberately short (`CORE_MAX_U = 0.26`) with a hard taper so
it reads as a surge feeding a burst, not as one long rope.

### Two invariants you must not break

1. **Every value is a pure function of the scroll tracks.** Nothing integrates
   over time, nothing autoplays, there is no timer and no React state updated
   per frame. Scrubbing backward reproduces the forward state exactly.
2. **Every branch of `update()` runs whether or not the group is visible.**
   State refreshed only while on screen goes stale the moment you scroll past
   it, and scrubbing back then lands on a different frame than scrubbing
   forward did. This was a real bug; it is fixed and must stay fixed.

`RELEASE_FRAMING` in `src/config/choreography.ts` remains the single source of
truth for the release camera: position `[0, 2.58, 3.42]`, target `[0, 1.05, 0]`,
FOV 30°, can at `[0, -0.12, 0]`, rotation Y 0.6204 rad, flavor VOID / 03.

### Higgsfield: closed

**80.00 credits remain and must not be spent casually.** Four probes were run
during Phase 2 for 19.50 credits total; that work is superseded and its output
is no longer used by the site. Do not reopen generation for the logo, the can
design, the nebula plates, the asteroids or a 3D can — and not for Chapter 05,
whose external-video approach was explicitly rejected. Reopening Higgsfield is
an owner decision, not an implementation detail.

### Capture path: a real trap

`?capture=1` sets `frameloop="never"` and drives the renderer by hand. **Under
load this fails silently.** If the Suspense boundary has not resolved when
`advance()` is first called, every hand-driven frame renders into a drawing
buffer that is never filled — and `toDataURL` happily returns a fully
transparent PNG. It produced byte-identical 31,418-byte "captures" while
reporting success.

For anything that matters, use the **live render loop**: load the site normally,
hide the fixed DOM overlays, let the damping settle, and read the frame through
`page.screenshot()`. Then **assert** the camera landed on its keyframe before
writing the file. `page.screenshot()` also occasionally catches a cleared WebGL
buffer and returns a black canvas — take best-of-3 by non-black pixel count.

---

## Remaining Work

For Aleksa’s agent. This is the genuine list — everything else is done.

1. **Final judgment and polish of the Chapter 05 snap and liquid release.**
   The sequence is structurally correct, deterministic and reversible. What is
   left is taste: whether the snap reads sharply enough and whether the liquid
   holds up as a hero moment at full size. Adjust `ReleaseBurst.tsx` parameters
   and the `FLAP_BREAK` / `CUT_EDGE_FLASH` / `RELEASE_*` tracks. **Do not**
   rebuild the chapter or reach for an external asset.
2. **Global HUD and corner-copy cleanup.** Still Phase 1 working text:
   - top-left should become a purposeful identity such as `LYRA ENERGY`;
   - top-right may remain empty;
   - bottom-left should remain empty unless it gains a real function;
   - bottom-right keeps the progress meter, but the word `SCROLL` should go.
3. **Replace remaining generic chapter paragraphs and placeholder copy** in
   `src/config/copy.ts`.
4. **Optional** nebula and station detail polish — only if it materially
   improves the advertisement. `NebulaVolume` is uniform-driven, so swapping in
   plates is a fragment-shader change, not a chapter rewrite. Do not spend
   Higgsfield credits on it.
5. **Record the final 1440 × 900 advertisement traversal**, both overlays off.

Before changing anything: read this README, run the site, and scroll Chapter 05
forward *and* backward. Do not redesign the locked wordmark, the can, the
rebuilt lid or the scroll calibration — see *Locked Visual Decisions*.

---

## Known Limitations

- **Nebulas are procedural placeholders** — deliberately faint shader volumes,
  meant to be replaced.
- **The station is procedural** — geometry only, no panel texture yet.
- **At the release camera's shallow angle you cannot see far into the can.** The
  opened flap is present and correct but reads subtly at that elevation.
- **Chapter 05 is composed for 1440 × 900.** It is live geometry so it does not
  crop, but the release is framed for that viewport.
- **Camera damping (`lambda = 22`) means a checkpoint sampled immediately after
  a long jump can still be ~0.003 world units from its settled value.** This is
  convergence, not non-determinism. Let it settle before asserting.
- **Desktop recording is prioritised** over full responsive production. Mobile
  navigation was out of scope. Nothing here claims production responsiveness.
- **The project is not deployed** as a production product.
- A `THREE.Clock` deprecation warning appears in the console. It comes from
  inside `@react-three/fiber`, not from this codebase.
- QA stills in `docs/qa/` are **WebGL-layer captures** — the DOM overlay (HUD,
  copy, CTA lockup) is not included in them.

---

## Visual Record

`docs/qa/` holds 1440 × 900 captures. The paths worth keeping:

| Path | What it shows |
| --- | --- |
| `docs/qa/final/` | The shipped state: hero, asteroid run, a flavor nebula, station flyby, Chapter 05 before/snap/release, CTA. **Start here.** |
| `docs/qa/scroll-distance/` | The corrected scroll traversal — 16 logical checkpoints across the whole timeline. |
| `docs/qa/after/` | The can/packaging refinement, including `neutral-*` renders proving the three flavors are distinct under plain white light. |
| `docs/qa/before/` | The state before that refinement. |

Screen recordings are gitignored (`*.mp4`, `*.webm`) and live only on the
machine that made them; the checkpoint stills are committed.
`docs/qa/higgsfield/` holds the superseded Phase 2 probe work and is **not**
part of the handoff — the site no longer uses any of it.

---

## Handoff

**25 August 2026.** The repository is in a safe, documented, pushed state.
Chapters 01–06 all work, Chapter 05 is native, scroll pacing is calibrated and
approved, and `tsc -b` and `npm run build` both pass clean.

Higgsfield holds **80 credits**. Do not use them casually: the external-video
approach it was bought for has been rejected, and reopening that decision
belongs to the owners.
