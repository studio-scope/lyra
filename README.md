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

**Status date: 23 August 2026 — Phase 1 implemented.**

The current prototype contains:

- six scroll chapters;
- one continuous procedural 3D can, mounted once and alive for the whole page;
- **Ignition** — Lyra constellation draws in, Vega ignites, the can launches;
- **Asteroid Run** — procedural asteroid field, curved flight path;
- **Flavor Nebulas** — NOVA, COMET and VOID moments with warp transitions;
- **Station Flyby** — procedural station ring with a staggered HUD readout;
- **Open & Pour placeholder** — locked close-up plus the Phase 2 video slot;
- **final CTA** — centred wordmark lockup;
- a continuous flight trail that persists across every chapter;
- procedural asteroids and station geometry;
- coded label textures for NOVA, COMET and VOID;
- debug tooling (`D` readout, `V` video bounds, `?capture=1` frame capture);
- documented, intentionally empty asset placeholders.

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

**Not implemented:** no fluid simulation. Chapter 05 stops at the cut point and
hands over to a placeholder plate.

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
| `public/assets/open-pour` | Scroll-scrubbed Open & Pour video | Foreground video | 16:9 | 2560 × 1440, 30 fps |

Nebula plates replace the procedural volumes in `NebulaVolume.tsx`, which is
driven entirely by uniforms — swapping in textured plates is a fragment-shader
change, not a rewrite of the chapter.

---

## Higgsfield Budget and Open & Pour

- **Approximately 104 Higgsfield credits remain.**
- Those credits are **reserved for the final Open & Pour video**.
- **Do not spend Higgsfield credits** on the logo, can design, nebula images,
  asteroids or 3D can generation.
- The coded Release section provides the **exact start-frame composition**.
- The future video must preserve the **canonical VOID can** and match that start
  frame exactly.
- **No coded fluid simulation should be attempted.**

### Open & Pour: the exact start frame

`RELEASE_FRAMING` in `src/config/choreography.ts` is the single source of truth.
The placeholder plate, the `V` debug overlay and this table all read from it.

| | |
| --- | --- |
| **Cut point** | vh **1262** |
| **Scrub range** | vh 1262 → 1320 (58 vh of scroll) |
| **Plate** | 2560 × 1440, 16:9, 30 fps |
| **Camera position** | `[0, 2.58, 3.42]` |
| **Camera target** | `[0, 1.05, 0]` |
| **Camera FOV** | 30° vertical |
| **Can position** | `[0, -0.12, 0]` |
| **Can rotation Y** | 0.6204 rad (35.55°) off label-front |
| **Can rotation X** | −0.05 rad |
| **Can scale** | 1.0 |
| **Stay-tab** | fully lifted (`tabLift = 1`), ~31° about the rivet |
| **Scored panel** | dented, still closed |
| **Flavor** | VOID / 03 |

The camera sits about 24° above the horizontal, looking down onto the lid so the
scored panel and the raised tab are both in frame. **End-frame direction:** the
pour continues downward and exits low in frame.

To capture the reference still: run the dev server, scroll to vh 1262 (`D` shows
the exact position), press `V` to confirm the plate bounds, then turn both
overlays off before recording.

---

## Next Agent Instructions

1. Clone the repository and run it (`npm install`, `npm run dev`).
2. **Read this README completely** before changing anything.
3. Verify the current experience at **1440 × 900**, scrolling forward and back.
4. **Do not redesign the locked wordmark or the can.** See *Locked Visual
   Decisions*.
5. Inspect the final scene compositions for each nebula moment (vh 500, 640,
   770) and note the exact framing.
6. Generate the three nebula backgrounds **from those exact compositions**.
7. Integrate the nebula assets **without changing scroll timing** — replace the
   `NebulaVolume` shader source, not the chapter.
8. Lock the Release start frame (vh 1262) and capture it with `?capture=1`.
9. Create the Open & Pour reference frames (start frame + end-frame direction).
10. **Only then** use Higgsfield for the final video.
11. Run final motion and performance QA (fast forward/backward scrub, FPS).
12. Record the advertisement at 1440 × 900.

---

## Known Limitations

- **Nebulas are procedural placeholders** — deliberately faint shader volumes,
  meant to be replaced.
- **The station is procedural** — geometry only, no panel texture yet.
- **The Open & Pour video has not been generated.** Chapter 05 stops at the cut
  point and hands over to a placeholder plate.
- **There is no final liquid shot** and no fluid simulation.
- **Desktop recording is prioritised** over full responsive production. Mobile
  navigation was out of scope.
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
