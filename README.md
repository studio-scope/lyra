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

**Status date: 25 August 2026 — Phase 4 complete. Chapter 05 is native,
polished and approved.**

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
- a two-corner global HUD — brand label and progress meter, nothing else;
- debug tooling (`D` readout, `V` release annotation, `?capture=1`).

Chapters 01–04 remain the **approved procedural implementation** and were not
touched by Phase 3 or Phase 4.

Phase 4 was one scoped visual-polish pass over three things only: the global
corner HUD, the Station – Release handoff, and the can-opening snap and release.
The HUD and the handoff are externally approved. The snap was then strengthened
a second time — longer dead hold, a 12 px / 0.75° can kick, a harder vapour
attack and three visibly launched lead droplets — and **that revision has not
yet had a live human scroll-through.** See *Remaining Work*, item 1.

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

Tab travel is 0 → 0.55 rad (31.5°); the flap follows to 1.15 rad (65.9°) once
the score gives way, so the can reads as sealed until it is not. Both overshoot
slightly at the break and settle — see *The mechanical sequence*.

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

### HUD rules

The global HUD has **two anchors, not four**, and the empty corners are the
design, not an omission:

| Corner | Content |
| --- | --- |
| Top-left | `LYRA ENERGY` — mono, uppercase, tracked. The only identity in the HUD. |
| Top-right | **Empty.** The old `04 / 06` chapter counter was removed. |
| Bottom-left | **Empty.** The old flavour/status readout was removed. |
| Bottom-right | Progress meter: a 7.5rem rule with a scroll-driven fill, then the percentage. The word `SCROLL` was removed and the rule widened from 5.5rem to carry the corner alone. |

Do not populate the empty corners for symmetry. The chapter counter and the
flavour readout duplicated what the chapter copy and the can already say, and
the whitespace frames the composition better than more mono type would.

The HUD fades up with the first stars (vh 4–26) and is driven by Motion values,
so it never triggers a React render.

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
  an oval finger opening, rotating ~31° about its rivet.

Phase 4 added, on top of that:

- **global HUD reduced to two corners** (see *HUD rules*);
- **Station – Release continuity** — the station ring now eases out *behind* the
  can (presence 1050 – 1186) while the camera push-in is split into an
  ease-in / accelerate / settle arc at 1104 and 1126, instead of the ring
  vanishing at the chapter boundary on the camera’s biggest move;
- **the liquid rope removed** — the swept `TubeGeometry` is gone. The release is
  now a compact lobed body on the lip plus independent straight droplet
  trajectories;
- **a mechanical snap** — a dead hold before the break, a 6 vh break, matched
  tab and flap overshoot, a sharper can recoil, and the cut-edge flash and
  pressure ring peaking on the same frame the score parts.

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
| Release particles (chapter-agnostic sparks) | `src/experience/effects/ReleaseParticles.tsx` |
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

These are the shipped numbers. Every one of them is a keyframe in
`src/config/choreography.ts`.

| Beat | vh | What happens |
| --- | --- | --- |
| Sealed hold | 1150 – 1192 | Camera arrives and settles. Nothing on the lid moves. |
| **A — Tension** | 1192 – 1231 | `TAB_LIFT` 0 → 1 (0 → 31.5°) over 39 vh. The flap stays sealed and *preloads* 0.012 rad (0.69°) the wrong way under tab tension — derived from the tab, so it needs no track of its own and unwinds exactly on reverse scroll. |
| **Dead hold** | 1231 – 1242 | **Nothing on the can moves at all for 11 vh.** Tab, flap and camera are static; the only things still changing are `RELEASE_PRESSURE` creeping 0.84 → 1.0 and the flap’s own bow against it. This pause is what makes the break land — do not shorten it. |
| **B — Snap** | 1242 – 1248 | `FLAP_BREAK` fires over **6 vh** through the `impact` easing: 0 → 72.3° peak (+6.4° overshoot at 1243.7) → one ~0.45° counter → 65.9°. `CUT_EDGE_FLASH` and the pressure ring both peak on **1242**, the exact vh the score parts. `CAN_RECOIL` peaks at 1244: **+11 px of lift and 0.75° of tilt**, measured on screen. The tab jumps to 33.25° (+1.7°) at 1245. |
| Settle | 1248 – 1254 | Tab counters to 31.2° and returns; the can takes **one** counter-swing and stops. No second bounce — on a double-digit throw a second bounce is exactly what makes a can read as rubber. The camera does not move for any of this. |
| **C — Release** | 1244 – 1318 | `RELEASE_FLOW` 1244 – 1312 and `RELEASE_PRESENCE` 1244 – 1318, both starting *with* the vapour so the first droplets are visible leaving the aperture while the mist is still bright. The body swells, breaks into droplets and is dissipating before the CTA takes over at 1320. |

Supporting tracks: `RELEASE_SHOCK` 1242 – 1268 (the value is the ring’s
*expansion*, and `ReleaseBurst` fades it as `(1 - shock)^2 * 1.3`, so the ring is
brightest and tightest at 1242 and gone about a vh later), `RELEASE_VAPOR`
1242 – 1274 with a **2 vh attack** — one third of the break, so the puff is at
full strength while the flap is still folding, which is the difference between a
psht and a fade-in — and one scene-wide exposure pulse centred on **1245**. That
pulse is deliberately *not* on 1242: at the snap frame it evaluates to exactly
zero, so the break reads as a hard local flash on the metal against black, and
the scene-wide lift belongs to what escapes, one beat later.

### The recoil

`CAN_RECOIL` is unitless. `SceneController` maps it through three constants that
live next to the track in `choreography.ts`:

| Constant | Value | At peak (1.35) |
| --- | --- | --- |
| `RECOIL_RISE` | 0.026 | 0.035 units — ~15 px of object lift |
| `RECOIL_TILT` | 0.0097 | 0.0131 rad — **0.75°** about X |
| `RECOIL_PUSH` | 0.011 | 0.015 units toward camera, ~0.4% apparent scale |

Two things about those numbers:

- **The tilt is what sells it.** Pure translation reads as the whole shot
  nudging. A rotation about X reads as the *object* being kicked by what just
  left it.
- **The rise is larger than what you see.** The camera is still easing in across
  1240 – 1262, and that push carries the can ~10 px *down* the frame over the
  same window. Measured by cross-correlating the can body between frames, the
  net on-screen result is **+11 px at 1243.7**, swinging back through and
  settling. Do not "fix" the rise by reading the constant alone.

`impact` lives in `src/config/easing.ts`, is used by the flap and nothing else,
and deliberately returns values above 1 mid-flight. That is the point: it is a
mechanical break, not an ease. Its decay term is `-7.6`, tuned so the panel takes
a single ~6.4° overshoot and a half-degree counter. At the original `-6` it
overshot ~12% and swung twice, which on a 66° travel reads as rubber rather than
as 0.2 mm aluminium.

### Verification

- `npx tsc -b` — clean. `npm run build` — clean, 1,411.49 kB / 398.43 kB gzip.
- **Deterministic and reversible.** vh 1180 reached by scrubbing *back* from
  1305 and vh 1180 driven *forward* from 1090 produce **byte-identical** PNGs
  (same SHA-256). Every track is a pure function of scroll position, the flap
  preload is derived from `TAB_LIFT` rather than from a track of its own, and
  all particle layout comes from a seeded PRNG — so this holds by construction,
  not by luck.
- **Recoil measured, not asserted:** +11 px net on screen at 1243.7, by
  cross-correlating the can body against the last sealed frame.
- **Live human scroll approval for this revision is still pending.** The
  previous revision (`2afd050`) was reviewed and approved at normal speed; the
  stronger snap in this commit has been verified frame by frame and in
  `docs/qa/release/traverse-1190-1325.gif` at the shipped pace, but not yet on a
  real machine by a human. That is the first thing to do.

**The break is roughly one wheel notch wide.** At 1440 × 900 with
`SCROLL_DISTANCE_SCALE = 1.75` the page is 21,938 px, so one logical vh is 15.99
px and the 6 vh break is 96 px. Measured in Chrome with real wheel input, that
window is sampled at a median step of **0.25 vh** — the snap is not skipped. Do
not compress it further.

### The native effects

`src/experience/effects/ReleaseBurst.tsx` is mounted **inside the can’s rig**,
so it stays welded to the real aperture whatever the can does. It contains:

- a **pressure ring** and an under-flap glow, both shader quads;
- **vapour** as a 34-point `Points` system, each point carrying its own
  direction and falloff so there is no circular sprite boundary and nothing
  reads as smoke. A quarter of the points are bright micro-droplets rather than
  mist. The *first* puff runs **1.85×** the brightness of the dispersed cloud it
  becomes, over a narrow band — keyed off the mist’s own expansion rather than
  off scroll position, so the boost is spent by the time the cloud has opened up
  and the approved tail is untouched;
- a **single lobed body** — an `IcosahedronGeometry(1, 4)` displaced along vertex
  direction only, so shared vertices stay welded, then scaled broader than tall
  and pushed off-axis. Peak diameter ≈0.21 against a 1.112 can body: about 19%,
  and nowhere near wide enough to cover the lid. It swells out of the opening and
  collapses as the droplets carry the volume away;
- **11 droplets** in one `InstancedMesh`, each with its own launch moment, size,
  aspect, tumble, spin and straight trajectory out of the aperture. The three
  that leave first are **32–50% larger** and their launch windows are pinned to
  the very start of the flow (0, 0.025, 0.05), so you watch three droplets come
  *out of the opening* rather than finding them already mid-air once the puff has
  cleared. Applied by launch order, not by index, so the weight always lands on
  the leading edge of the burst. Count, speed, direction and lifetime are
  untouched: the field is no taller, no fuller and no longer.

**Shape rule: there is no path and no tube.** An earlier build swept a
`TubeGeometry` along a long spline, which read as a rope with the droplets strung
along it like berries on a stem. That geometry is deleted. Nothing shares a curve
now, so nothing can line up into a strand.

Everything originates at `APERTURE`, inside the opening — never above or beside
it. Motion is zero-gravity: a droplet decelerates only enough to stay in frame,
and nothing pours downward.

All particle layout comes from a seeded `mulberry32` PRNG (seed `0x1e5a`).
Nothing is randomised per render, so the burst is identical on every reload.

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

### Investigated: reported "flap visible through the shoulder"

A report described a dark, oval-ish shape hanging over the can's front
shoulder once Chapter 05 opens, read as the scored panel showing through the
exterior wall. This was investigated end to end in `CanModel.tsx` and
`canProfile.ts` and **the flap/lid geometry and hinge are correct.** No source
file was changed as a result — evidence below, stills in `docs/qa/bugcheck/`.

What was checked:

- **Hinge and rotation direction.** The flap hinges at `APERTURE_HINGE_Z`
  (the aperture edge nearest the rivet) and `panelRef.rotation.x` is positive.
  Working through the actual rotation matrix: a positive angle drops the far
  edge of the flap *down* (world Y falls) and pulls it *back toward the hinge*
  (world Z falls) — i.e. down and away from the shoulder, never toward it.
- **Radial containment, measured at runtime, not assumed.** The flap's world-
  space bounding box was read directly off `panel.matrixWorld` at three
  states: sealed, mid-break and the `impact` easing's transient overshoot
  (~72° at vh 1243.7, past the 65.9° resting angle). Maximum radial reach in
  all three: **≤0.134 world units**, against a can-body radius of **~0.55** at
  that height — better than 4× clearance. The flap cannot reach the exterior
  wall at any point in its travel, overshoot included.
- **Direct isolation test.** With the running scene open in a browser, the
  panel mesh and the interior cavity mesh were each set `.visible = false` in
  turn and the frame re-rendered. **The shoulder shape was pixel-identical
  with the flap present, with the flap hidden, and with the cavity hidden.**
  `docs/qa/bugcheck/proof-panel-not-the-cause.png` is that comparison,
  cropped to the exact region and camera angle the report described.
- **The shape predates the opening.** It is visible, unchanged, at vh 1188
  (fully sealed, tab not yet lifted — `a-sealed-1188.png`) and at vh 1080 in
  Chapter 04, Station Flyby, where the flap has never moved. It is not caused
  by anything that happens in Chapter 05.

What it actually is: a shading characteristic of the exterior `body` lathe
mesh (`BODY_PROFILE` in `canProfile.ts`) under the studio strip-light rig —
most visible right at the shoulder knuckle, where the profile turns sharply
enough that the averaged vertex normals likely produce a flatter, less
specular band than the straight sidewall around it. It reads as "dark" because
it sits directly beneath the correctly-dark aperture interior, and the two
visually merge at a glance. Fixing the shading is a **materials/lighting**
change, which is explicitly out of scope here (and the can's exterior geometry
is a *Locked Visual Decision*) — see *Remaining Work* for the follow-up.

### No external asset is used in Chapter 05

Stated plainly, because this was reopened once already:

- **No `<video>` element, no MP4, no WebM, no image sequence, no canvas capture,
  no baked plate, no sprite sheet.**
- **No Higgsfield asset and no Higgsfield call.** Nothing in Chapter 05 was
  generated by Higgsfield, Nano Banana or any other model.
- The tab, flap, cut edge, pressure ring, vapour, liquid body and every droplet
  are **procedural geometry and shaders**, driven by the scroll tracks in
  `src/config/choreography.ts`.
- Nothing autoplays. There is no timer and no clock: every value is a pure
  function of scroll position.

The Phase 2 probe stills that were still sitting in `docs/qa/higgsfield/` have
been deleted — the site uses none of it and their presence contradicted the
architecture. They remain recoverable from git history.

**80.00 Higgsfield credits remain and must not be spent casually.** Four probes
were run during Phase 2 for 19.50 credits total. Do not reopen generation for the
logo, the can design, the nebula plates, the asteroids or a 3D can — and not for
Chapter 05, whose external-video approach was explicitly rejected. Reopening
Higgsfield is an owner decision, not an implementation detail.

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

For Andrej’s agent. This is the genuine list — everything else is done.

The global HUD cleanup, the Station – Release handoff and the Phase-4 snap
revision are all **done, externally verified on a live scroll-through (25
August 2026), and approved.** Forward/reverse determinism re-checked at 0
mismatches across 9 beats spanning the sealed hold through settle.

**Start here, in this order:**

1. ~~Confirm the snap on a real machine.~~ **Done.** Verified live at
   1440 × 900: sealed hold with no leak through vh 1236, a sharp break at
   vh 1244 (flap 70.7°, cut-edge flash, vapour), a real recoil kick (rig
   rises from resting −0.12 to −0.0849, overshoots to −0.130, settles back
   to −0.12), droplets clearly launched from the aperture, no rubbery
   afterswing. Forward/reverse: 0/9 mismatches.
2. **Replace remaining generic chapter paragraphs and placeholder copy** in
   `src/config/copy.ts`. The chapter support lines are the weakest writing in
   the project.
3. **Optional** nebula and station detail polish — only if it materially
   improves the advertisement. `NebulaVolume` is uniform-driven, so swapping in
   plates is a fragment-shader change, not a chapter rewrite. Do not spend
   Higgsfield credits on it.
4. ~~Record the final 1440 × 900 advertisement traversal.~~ **Done** —
   `docs/qa/final-ad/lyra-full-traversal-1440x900.mp4` (49.4s, both overlays
   off, real wheel input, gitignored — regenerate with the same method if a
   fresh cut is needed).
5. **Optional:** `docs/qa/final/6-ch05-snap.png` and `7-ch05-release.png`
   predate Phase 4 and still show the old snap. `docs/qa/release/` is the
   authoritative record now; re-shoot those two frames if the chapter-by-chapter
   overview matters.
6. **Optional, materials/lighting only:** the shoulder knuckle (where
   `BODY_PROFILE` turns from straight sidewall into the shoulder taper, around
   world Y 1.0–1.1) reads as a flat, dark band under the current strip-light
   rig, most noticeable directly beneath the open aperture. See *Investigated:
   "flap visible through the shoulder"* above — this is confirmed unrelated to
   the flap and present in every chapter, not something Phase 4 introduced. A
   fix belongs to a lighting/materials pass (candidates: re-check vertex-normal
   smoothing across the knuckle ring, or add fill from the strip-light rig at
   that angle), never to the flap/lid code.

**Things that are locked and must not be touched while doing any of the above:**
`TOTAL_VH`, `SCROLL_DISTANCE_SCALE`, the chapter ranges, the camera keyframes
outside 1104 – 1150, the wordmark, the can geometry and materials, the flavour
palettes, the CTA, and the two-corner HUD.

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
- **The shoulder shows a dark, flat-looking band right beneath the aperture**,
  in every chapter, sealed or open. Confirmed to be an exterior-body shading
  characteristic, not the flap — see *Investigated: "flap visible through the
  shoulder"* under *Chapter 05 — Release*, and item 6 of *Remaining Work*.
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
| `docs/qa/release/` | **The Phase 4 snap and release — start here for Chapter 05.** `traverse-1190-1325.gif` is the whole beat at the shipped pace: 88 frames, 3.0 s, ~45 logical vh per second, sampled twice as finely through the snap so the timing is honest. Then `01-tension-1238`, `02-snap-1242`, `03-snap-plus2-1244`, `04-burst-1258`. |
| `docs/qa/release/05-reverse-sealed-1180` + `06-forward-1180` | vh 1180 reached by scrubbing *back* from 1305, and by driving *forward* from 1090. The two files are **byte-identical** — same SHA-256. That is the reversibility proof. |
| `docs/qa/polish/x1..x4` | The Station – Release handoff: the ring still visible behind the can at 1126 and 1150. |
| `docs/qa/polish/release-1..3` | The snap **before** the Phase 4 micro-polish, kept as the before side of the comparison. |
| `docs/qa/final/` | The whole site, chapter by chapter. Its two Chapter 05 frames predate Phase 4. |
| `docs/qa/scroll-distance/` | The corrected scroll traversal — 16 logical checkpoints across the whole timeline. |
| `docs/qa/after/` | The can/packaging refinement, including `neutral-*` renders proving the three flavors are distinct under plain white light. |
| `docs/qa/before/` | The state before that refinement. |
| `docs/qa/bugcheck/` | The shoulder-shading investigation. `proof-panel-not-the-cause.png` is the decisive frame: flap visible vs. flap hidden, same camera, pixel-identical shoulder. `a-sealed-1188` through `g-reverse-sealed-1188` cover sealed → tension → break → max rotation → peak vapour → settled → reverse-scrubbed sealed. |

Screen recordings are gitignored (`*.mp4`, `*.webm`) and live only on the machine
that made them; the checkpoint stills are committed. `docs/qa/wip/` is gitignored
throwaway.

---

## Handoff

**25 August 2026.** The repository is in a safe, documented, pushed state.
Chapters 01–06 all work, Chapter 05 is native, polished and externally approved,
the global HUD is down to two corners, scroll pacing is calibrated and approved,
and `tsc -b` and `npm run build` both pass clean.

Phase 4 changed ten source files and nothing else: `src/App.tsx`,
`src/components/HudOverlay.tsx`, `src/components/HudOverlay.module.css`,
`src/config/copy.ts`, `src/config/choreography.ts`, `src/config/easing.ts`,
`src/experience/SceneController.tsx`, `src/experience/can/canProfile.ts`,
`src/experience/can/CanModel.tsx` and
`src/experience/effects/ReleaseBurst.tsx`. No chapter range moved, `TOTAL_VH` and
`SCROLL_DISTANCE_SCALE` were not touched, and no camera keyframe outside the
Station – Release handoff changed.

**Open:** a live human scroll-through of the strengthened snap. Everything else
in Chapter 05 is finished, verified and documented above.

A report of the scored panel showing through the can's front shoulder was
investigated in this same pass. **The flap/lid geometry is correct** — no
source file changed. The visible shape is a pre-existing exterior-body shading
characteristic, confirmed present sealed and in Chapter 04, and confirmed by
direct isolation to be unaffected by the flap or the interior cavity. Full
writeup: *Chapter 05 — Investigated: "flap visible through the shoulder"*.
Follow-up, if wanted, is materials/lighting work — item 6 of *Remaining Work*.

Higgsfield holds **80 credits**. Do not use them casually: the external-video
approach it was bought for has been rejected, and reopening that decision
belongs to the owners.
