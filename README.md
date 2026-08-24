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

**Status date: 24 August 2026 — Phase 2 complete. Open & Pour is integrated.**

The site now runs end to end. There is no placeholder left in the scroll.

- six scroll chapters;
- one continuous procedural 3D can, mounted once and alive for the whole page;
- **Ignition** — Lyra constellation draws in, Vega ignites, the can launches;
- **Asteroid Run** — procedural asteroid field, curved flight path;
- **Flavor Nebulas** — NOVA, COMET and VOID moments with warp transitions;
- **Station Flyby** — procedural station ring with a staggered HUD readout;
- **Open & Pour** — the lid mechanism opens a real aperture and hands over to a
  scroll-scrubbed liquid plate;
- **final CTA** — centred wordmark lockup;
- a continuous flight trail that persists across every chapter;
- procedural asteroids and station geometry;
- coded label textures for NOVA, COMET and VOID;
- debug tooling (`D` readout, `V` video bounds, `?capture=1` frame capture).

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
- The **chapter structure and scroll choreography are locked** — total page
  height, chapter ranges, camera paths, can keyframes and section timing.

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

**Not implemented:** there is still no fluid simulation, and there is no need
for one — Chapter 05 hands over to a pre-rendered plate at the cut point.

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
| `D` | Debug readout: scroll progress, chapter, flavor, FPS, can and camera position, FOV, warp, Open & Pour slot bounds |
| `V` | Chapter 05 video-bounds overlay: plate outline, start frame, end-frame direction, scrub range |

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
| Asteroid field | `src/experience/environments/AsteroidField.tsx` |
| Station ring | `src/experience/environments/StationRing.tsx` |
| Nebula placeholders | `src/experience/environments/NebulaVolume.tsx` |
| CTA liquid placeholder | `src/experience/environments/LiquidWave.tsx` |
| Star layers | `src/experience/environments/StarLayers.tsx` |
| Lyra constellation | `src/experience/environments/LyraConstellation.tsx` |
| Open & Pour plate + scroll scrub | `src/chapters/Chapter05Release.tsx` |
| Shipped plate | `public/assets/open-pour/open-pour-final.mp4` |
| HUD | `src/components/HudOverlay.tsx` |
| Wordmark component | `src/components/LyraWordmark.tsx` |
| Debug panel | `src/components/DebugPanel.tsx` |
| Chapter components | `src/chapters/Chapter0{1..6}*.tsx` |
| Chapter stage / envelopes | `src/chapters/ChapterSection.tsx` |
| Future video placeholder | `src/chapters/Chapter05Release.tsx` |
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

The page is `1450vh` tall. All choreography is expressed in **virtual vh**
(`0 → 1450`). No component invents a scroll number of its own.

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

---

## Asset Pipeline and Remaining Work

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
| ~~`public/assets/open-pour`~~ | **Filled** — `open-pour-final.mp4` | Foreground video | 16:10 | 1440 × 900, 24 fps |

Nebula plates replace the procedural volumes in `NebulaVolume.tsx`, which is
driven entirely by uniforms — swapping in textured plates is a fragment-shader
change, not a rewrite of the chapter.

---

## Open & Pour

Chapter 05 is finished. The sequence is: the tab lifts, the scored flap breaks
and folds into the can revealing a real aperture, and a scroll-scrubbed plate
carries violet zero-gravity liquid out of that opening and into the CTA.

### Effects-only architecture

This is the part worth understanding before touching anything here.

**The live WebGL can is authoritative and always was.** The generated video is
used *only* as a source of moving fluid. Every frame of the shipped plate is a
composite of three layers:

1. a still render of the live scene at the cut point — background, can, label,
   lid, aperture, tab, rivet, particles;
2. the violet liquid and a restrained pressure mist, extracted from the
   generation with a temporal-difference matte plus hue, brightness and spatial
   gates, then graded toward deep violet;
3. the live can re-laid on top through a rendered foreground matte, so the real
   tab and aperture edge keep occluding the fluid.

Nothing generated survives into the plate: no AI can, lid, tab, rim, lettering,
hallucinated text, duplicated starfield or background. The consequence is that
branding, geometry, camera and framing were never at the mercy of the model —
only the fluid performance was. That is what made a single 4.50-credit
generation sufficient.

The extracted fluid is aligned by **measuring its base and pinning it to the
projected aperture**, with a time-varying offset that cancels the generation's
own camera drift. It is scaled about that aperture anchor — never about the
frame origin.

### Scroll mapping

`RELEASE_FRAMING` in `src/config/choreography.ts` is the single source of truth.
The chapter, the `V` debug overlay and this table all read from it.

| | |
| --- | --- |
| **Cut point** (`cutPointVh`) | vh **1262** — plate frame 0 |
| **Video end** (`videoEndVh`) | vh **1310** — plate frame 72 |
| **Hand-off end** (`scrubEndVh`) | vh **1320** — CTA entry |
| **Plate** | 1440 × 900, 24 fps, 73 frames |
| **Camera position** | `[0, 2.58, 3.42]` |
| **Camera target** | `[0, 1.05, 0]` |
| **Camera FOV** | 30° vertical |
| **Can position** | `[0, -0.12, 0]` |
| **Can rotation Y** | 0.6204 rad (35.55°) off label-front |
| **Can rotation X** | −0.05 rad |
| **Can scale** | 1.0 |
| **Stay-tab** | fully lifted (`tabLift = 1`), 31.5° about the rivet |
| **Flavor** | VOID / 03 |

Scroll maps linearly from vh 1262 → 1310 onto frames 0 → 72, quantised to the
nearest source frame so a given scroll position always resolves to the same
frame in both directions. `currentTime` is written imperatively from a ref; the
video is **never played**. From vh 1310 to 1320 the plate holds on its last
frame and fades while the CTA's `LiquidWave` rises, so the chapter never cuts
from droplets to an empty scene.

### Keyframes are not optional

The plate is encoded **all-intra — every frame is an I-frame** (`-g 1
-keyint_min 1 -sc_threshold 0`, CRF 17, H.264 High, `yuv420p`, `+faststart`).

A normal long-GOP encode seeks to the nearest keyframe, which makes
`currentTime` scrubbing stutter badly. An earlier composite of the same length
had **1** I-frame in 73 frames and was unusable for scroll control. The file is
larger as a result; that is the correct trade for a scrub-driven plate.

### Higgsfield: closed

- **80.00 credits remain.** No further generation is planned or needed.
- Four probes were run, 19.50 credits total:

| Probe | Config | Cost | Outcome |
| --- | --- | --- | --- |
| 01 | `kling3_0` std, start **+ end** image | 7.50 | Failed. Near-identical start and end frames collapsed the model into interpolation — no action at all. |
| 02 | `kling3_0` std, start only | 7.50 | Action worked, but the can drifted 277 px down and the tab deformed. |
| 03 | `kling3_0` std, 3 s, start only | 4.50 | Framing locked (4.5 px drift). Fluid too thin, too vertical, too pink. |
| 04 | `kling3_0` std, 3 s, start only | 4.50 | **Shipped.** Broad asymmetric ribbon, deep violet, laterally varied droplets. |

Rules that still hold: spend nothing on the logo, can design, nebula plates,
asteroids or 3D can generation, and attempt no coded fluid simulation.

### Capture path: a real trap

`?capture=1` sets `frameloop="never"` and drives the renderer by hand. **Under
load this fails silently.** If the Suspense boundary around the environment and
the scene controller has not resolved when `advance()` is first called, every
hand-driven frame renders into a drawing buffer that is never filled — and
`toDataURL` happily returns a fully transparent PNG. It produced byte-identical
31,418-byte "captures" while reporting success.

For anything that matters, use the **live render loop** instead: load the site
normally, hide the fixed DOM overlays, let the damping settle, and read the
frame through `page.screenshot()`. Then **assert** the camera has actually
landed on its keyframe before writing the file. Never trust a capture you have
not checked the file size of.

---

## Remaining Work

1. **Final global UI and copy pass.** The corner HUD, chapter labels and support
   copy are still the Phase 1 working text. This is the one deliberate piece of
   unfinished presentation left.
2. **The three nebula plates.** `NebulaVolume` is still driven by procedural
   shader volumes — deliberately faint placeholders. Generating them means
   inspecting the exact compositions at vh 500, 640 and 770 and replacing the
   shader source, not the chapter. **Do not spend Higgsfield credits on these.**
3. **Station panel detail.** The ring is geometry only.
4. **Record the advertisement** at 1440 × 900, both overlays off.

Before changing anything: read this README, run the site, and scroll Chapter 05
forward *and* backward. Do not redesign the locked wordmark, the can or the
rebuilt lid — see *Locked Visual Decisions*.

---

## Known Limitations

- **Nebulas are procedural placeholders** — deliberately faint shader volumes,
  meant to be replaced.
- **The station is procedural** — geometry only, no panel texture yet.
- **The Open & Pour plate is authored for 1440 × 900.** It is applied with
  `object-fit: cover`, so the vertical framing survives on other aspect ratios
  but the sides crop. It is a recording asset, not a responsive one.
- **The plate is 2.9 MB** — a direct consequence of all-intra encoding. That is
  intentional; see *Keyframes are not optional*.
- **At the release camera's shallow angle you cannot see far into the can.** The
  opened flap is present and correct but reads subtly at that elevation.
- **`ReleaseParticles` seeds its positions with `Math.random()`**, so the
  particle cue differs on every page load and QA captures of it are never
  byte-identical.
- **Desktop recording is prioritised** over full responsive production. Mobile
  navigation was out of scope. Nothing here claims production responsiveness.
- **The project is not deployed** as a production product.
- A `THREE.Clock` deprecation warning appears in the console. It comes from
  inside `@react-three/fiber`, not from this codebase.
- QA stills in `docs/qa/` are **WebGL-layer captures** — the DOM overlay (HUD,
  copy, CTA lockup) is not included in them.

---

## Visual Record

`docs/qa/` holds 1440 × 900 captures of what is locked:

- `docs/qa/before/` — the state before the can/packaging refinement;
- `docs/qa/after/` — after it, including `neutral-*` renders proving the three
  flavors are distinct under plain white light;
- `docs/qa/polish/` — the final polish pass (hero settled, three progressive
  Release stages, CTA).
