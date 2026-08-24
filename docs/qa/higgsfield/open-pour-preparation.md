# Open & Pour — Phase 2 Higgsfield Preparation

**Status: diagnostic only. No Higgsfield credits were spent. No approved
choreography, geometry, material, lighting or copy was modified.**

Every number below was measured from the running application at 1440 × 900, not
copied from prior documentation. Where a measured value disagrees with an
earlier document, the measured value wins and the disagreement is called out.

---

## 1. Confirmed cut point

`RELEASE_FRAMING` in `src/config/choreography.ts` is still the single source of
truth and **vh 1262 is confirmed correct** in the current implementation.

| Field | Value in code | Verified |
| --- | --- | --- |
| `cutPointVh` | 1262 | yes |
| `scrubStartVh` | 1262 | yes |
| `scrubEndVh` | 1320 | yes |
| `camera.position` | `[0, 2.58, 3.42]` | yes — settled camera reads exactly `[0, 2.58, 3.42]` |
| `camera.fov` | 30 | yes |
| `cameraTarget` | `[0, 1.05, 0]` | yes — implied camera pitch −24.1022° |
| `can.position` | `[0, -0.12, 0]` | yes |
| `can.rotationY` | 19.47 rad | yes — 35.5488° off label-front |
| `can.rotationX` | −0.05 | yes |
| `can.scale` | 1 | yes |
| `can.tabLift` | 1 | yes — tab group `rotation.x` = 0.55 rad = 31.5127° |

### Achieved scroll position

The page is 1450 vh tall at 9.0 px per vh (`scrollHeight` 13050, `maxScroll`
12150). vh 1262 wants `scrollY` 10574.690; the browser quantises to integer
10575, giving **vh 1262.037037**. The residual error is +0.037 vh (0.33 px) and
is reflected in every measurement in this document.

### The cut point is not a neutral frame — read this before matching

`FLASHES` contains `[1252, 6, 22, 0.6]`, the release flash. Its fall-off runs to
vh 1274, so **at vh 1262 the flash is still decaying** and lifts exposure:

| vh | `toneMappingExposure` | Note |
| --- | --- | --- |
| 1262 | **1.097577** | +9.76% over baseline — the captured start frame |
| 1274 | 1.000001 | flash fully decayed |
| 1300 → 1320 | 1.000000 | baseline |

This is baked into `open-pour-start-clean.png`, which is correct: the video's
frame 0 must match the live frame at vh 1262, flash included. It is documented
because a later agent comparing the plate against a vh 1280 render will
otherwise conclude the plate is 10% too bright and "fix" it.

---

## 2. Framing measurements

All at viewport 1440 × 900, `devicePixelRatio` 1, canvas backing store
1440 × 900.

### Camera

| Property | Value |
| --- | --- |
| Position | `[0, 2.58, 3.42]` |
| Rotation (Euler XYZ, rad) | `[-0.42066334913, 0, 0]` |
| Rotation (deg) | `[-24.1022, 0, 0]` |
| Quaternion | `[-0.20878427635, 0, 0, 0.97796172008]` |
| Vertical FOV | 30° |
| **Horizontal FOV** | **46.4114°** (at aspect 1.6) |
| Aspect | 1.6 |
| Near / Far | 0.08 / 320 |
| Projection | Perspective, vertical-FOV driven |

### Can transform

| Property | Value |
| --- | --- |
| Rig position | `[0, -0.12, 0]` |
| Rig rotation (rad) | `[-0.05, 19.47, 0.015]` |
| Rig rotation Y normalised | 35.5488° off label-front |
| Rig scale | 1.0 |
| Geometry height | 2.579 world units (base −1.300 → rim top 1.279) |
| Body radius | 0.556; label sleeve radius 0.5578 |
| Body diameter : height | 1 : 2.32 |

### Can bounding box in pixels

Computed by projecting all 19,617 product-layer vertices (9 meshes) through the
settled camera — not by thresholding pixels, so nebula, stars and particles do
not contaminate it.

| Measurement | Value |
| --- | --- |
| Bounding box | x **469.91 → 959.72**, y **335.30 → 1428.22** |
| Width × height | **489.81 × 1092.91 px** |
| Centre | **(714.82, 881.76)** |
| Offset from frame centre | x **−5.18 px**, y **+431.76 px** |
| Width as fraction of frame | 34.01% |
| Height as fraction of frame | 121.43% |
| **Clipped below frame bottom** | **528.22 px** |
| Visible on screen | y 335.30 → 900 = **564.70 px** (51.7% of the can's projected height) |
| Clipped top / left / right | 0 / 0 / 0 |

The can is horizontally centred to within 5.18 px (0.36% of frame width) and is
**cropped by the bottom edge** — roughly the lower half of the can is off-frame.

### Lid assembly — the region that must actually animate

| Part | Geometry | x range | y range |
| --- | --- | --- | --- |
| Rolled top seam | Lathe, 1771 v | 542.93 → 883.31 | 345.71 → 473.78 |
| Lid disc | Lathe, 1127 v | 560.15 → 866.37 | 362.26 → 470.60 |
| **Stay-tab** | Extrude, 7776 v | 644.68 → 745.53 | **335.30** → 448.95 |
| Rivet | Cylinder, 124 v | 700.43 → 727.66 | 401.39 → 427.92 |
| Scored panel | Extrude, 2868 v | 708.82 → 771.76 | 419.03 → 448.64 |
| Score line | Shape, 960 v | 709.48 → 771.09 | 418.36 → 441.95 |

The stay-tab is the topmost element in frame and sets the can's overall `minY`.

**The whole mechanical action occupies about 340 × 139 px — 3.65% of the frame.**
This is the single strongest argument for generating at the highest available
resolution: at 720p that region is only 302 × 123 px.

### Lid and tab state

| Property | Value | Meaning |
| --- | --- | --- |
| Tab group `rotation.x` | 0.55 rad (31.5127°) | `tabLift` = 1.0, fully lifted |
| Panel group `rotation.x` | 0.038 rad (2.1772°) | dented by the tab nose, **still closed** |
| Can material opacity | 1.0 | fully opaque |

The scored panel is pressed but **never opens** in Phase 1. The video must be
the thing that breaks it.

### Lighting state

Two rigs, both measured live at the cut point.

**Environment rig — layer 0 (mask 1), lights everything except the can**

| Light | Intensity | Colour | Position |
| --- | --- | --- | --- |
| Ambient | 0.09 | `#C9C6D8` | — |
| Directional | 1.35 | `#FFFBF2` | `[3.2, 5.4, 4.2]` |
| Directional | 2.40 | `#D628FF` (VOID ultraviolet) | `[-4.6, 1.4, -2.6]` |
| Directional | 1.90 | `#7127FF` (VOID cobalt) | `[2.6, -2.2, -4.8]` |

**Product rig — layer 2 (mask 4), translated onto the can every frame**

| Light | Intensity at vh 1262 | Colour | Position |
| --- | --- | --- | --- |
| Ambient | 0.16 | `#BFC4DC` | — |
| Key | **3.1328** | `#FFF4E8` | `[2.4, 3.0, 4.2]` |
| Accent | **2.8604** | `#D628FF` | `[-3.4, 0.6, -3.6]` |
| Fill | **0.7492** | `#AEB6D8` | `[-3.6, -1.0, 2.6]` |

Product intensities are `KEY_LIGHT` × 2.3 / 2.1 / 0.55 respectively;
`KEY_LIGHT` = 1.362143 at vh 1262 and drifts to 1.30 by vh 1320 (a 4.6% falloff
across the scrub range).

Plus a procedural `<Environment>` of tall narrow strip lights (rebaked per
flavour) that supplies the vertical specular bands on the aluminium.

**Post-processing:** ACES Filmic tone mapping (`toneMapping` 4), exposure
1.097577, `Bloom` (intensity 0.38, luminanceThreshold 0.93, smoothing 0.16,
radius 0.45, mipmapBlur), `Vignette` (offset 0.3, darkness 0.62).

### VOID palette — the liquid must land inside this

| Role | Hex |
| --- | --- |
| deep | `#250036` |
| cobalt | `#7127FF` |
| ultraviolet | `#D628FF` |
| luminous | `#E778FF` |
| core | `#F6E8FF` |
| space black | `#020205` |

---

## 3. Layer strategy

### Layers present in the clean plate (verified by scene traversal)

At vh 1262 exactly 18 renderable objects are visible:

| Layer | Objects | State |
| --- | --- | --- |
| Star layers | 3 × `Points` | intensity 0.1577 |
| Nebula volume | 3 × `PlaneGeometry` shader | presence 0.1316, very faint |
| Flight trail | 1 × `Points` | **intensity 0 — renders nothing** |
| **The can** | **9 meshes, product layer** | the subject |
| Release particles | 1 × `Points` | release 0.2818, opacity 1.0 — **visible above the lid** |
| Warp / flash overlay | 1 × `PlaneGeometry` shader | warp 0, flash 0.1785 |

Not present at the cut point: constellation, asteroid field, station ring,
CTA liquid wave.

### How that inventory changes across the scrub range

| vh | Change |
| --- | --- |
| 1262 | full inventory above |
| 1274 | warp/flash overlay drops out (exposure returns to 1.0) |
| 1300 | nebula planes drop out |
| 1310 | unchanged |
| 1320 | CTA `LiquidWave` plane **appears** (presence ≈ 0.296) |

### What the video replaces vs. what stays live

**The video replaces the entire WebGL canvas** for the release chapter — can,
particles, stars, nebula and flash overlay. There is no partial substitution:
the canvas is one fixed full-viewport element at `z-index: 0`, and the plate
sits above it.

**Stays live above the video** (all DOM, `z-index: 1`, none of it inside the
canvas):

- HUD top-left `LYRA SYSTEM`, top-right `05 / 06`
- HUD bottom-left `VOID / 03 · RELEASE`, bottom-right `SCROLL ——— nn`
- Chapter 05 copy: label + headline (`useBlockAt([1096,1114,1236,1252])` and
  `([1110,1132,1232,1250])` — both have already faded out by vh 1252, so they
  are **not** on screen at the cut point)
- The placeholder plate chrome, which Phase 2 replaces with the `<video>`

Because the HUD is DOM and the canvas is `aria-hidden` WebGL, `toDataURL()` on
the canvas excludes every HUD element by construction. No masking was needed and
none was applied.

---

## 4. The two captures

Both were produced by driving the **real renderer** — no separate render path,
no clock reset, no damping change.

### Method

1. Headless Chrome (the machine's installed Chrome), layout viewport forced to
   exactly 1440 × 900, `deviceScaleFactor` 1.
2. Load `/?capture=1`, which sets `preserveDrawingBuffer` and
   `frameloop="never"` — the two things the existing QA tooling already provides.
3. Wait for `window.__lyra` and for `document.fonts.ready`, so the label bakes
   with real Syncopate Bold rather than a fallback face.
4. Scroll to vh 1262 and let the native scroll event reach `useScroll`.
5. Advance **180 frames** by hand at 1/60 s steps, with timestamps starting from
   the clock's *current* `elapsedTime` and strictly increasing —
   **never reset, never negative, delta always +0.0167 s**.
   With damping λ = 22 the camera converges to within 1e−19 of its target, which
   is why the settled camera reads exactly `[0, 2.58, 3.42]`.
6. `canvas.toDataURL('image/png')`.

Verification that the frame is a real render, not an empty buffer: mean luma
15.315, max luma 255.0, 41.79% of pixels above luma 12, across 1,296,000 pixels.

### A. `open-pour-start-clean.png` — 1440 × 900

The WebGL layer alone. Contains the can, release particles, stars, faint nebula
and the residual flash. Contains **no** HUD, no corner labels, no chapter
counter, no scroll meter, no framing/debug overlay and no browser chrome.

### B. `open-pour-start-reference.png` — 1440 × 900

The complete site at the same scroll position, captured from a **live** render
loop (no `?capture=1`) so it represents what a viewer actually sees. Camera
verified at `[0, 2.58, 3.42]`, FOV 30 — identical to the clean plate.

Shows the HUD, and the Chapter 05 placeholder plate at its natural opacity for
vh 1262 (0.2727 — the plate crossfade starts at 1256). Compositing/continuity
reference only.

---

## 5. Higgsfield — inspected via MCP, nothing generated

Account: **104 credits**, plan `starter`, no unlimited-generation allowance
(`unlim.available: false`).

### Costs are exact, not estimated

`generate_video` exposes `get_cost: true`, documented as *"return the cost in
credits for this generation without submitting any job."* Every figure below came
from that preflight. **No generation was submitted and no credits were spent.**

| Model | Config | Credits |
| --- | --- | --- |
| **`kling3_0`** | 16:9, std, sound off, 5 s | **7.50** |
| **`kling3_0`** | 16:9, **pro**, sound off, 5 s | **8.75** |
| `kling3_0` | 16:9, std, sound **on**, 5 s | 10.00 |
| `kling3_0` | 16:9, pro, sound off, 8 s | 14.00 |
| **`kling3_0`** | 16:9, **4k**, sound off, 5 s | **30.00** |
| `kling3_0` | 16:9, 4k, sound off, 8 s | 48.00 |
| `kling3_0_turbo` | 16:9, 1080p, 5 s | 10.00 |
| `minimax_h3` | 16:9, 2K, 5 s | 20.00 |
| `minimax_h3` | 16:9, 2K, 6 s | 24.00 |
| `grok_video_v15` | 1080p, 5 s | 40.00 |
| `wan3_0_prime` | 16:9, 1080p, 5 s, audio off | 38.50 |
| `seedance_2_5` | 16:9, 1080p, 5 s, audio off | 45.00 |
| `flux_3_video` | 16:9, 1080p, 5 s, audio off | 45.00 |

Pricing is linear in duration: `kling3_0` pro = 1.75 credits/s, 4k = 6.0
credits/s. Turning sound **off** is both cheaper and required — this is a
scroll-scrubbed silent plate.

### What the MCP does *not* expose

State these as unknown rather than guessing:

- **No frame-rate parameter on any candidate model.** The 30 fps plate spec
  cannot be requested; output fps must be measured after download and retimed if
  it does not match.
- **No first-frame conditioning-strength parameter** on any model. Start-image
  adherence is whatever the model does by default and cannot be dialled.
- **No seed parameter** on any candidate. Variation is controlled only by
  `count` (1–4 variants, `batch_size` on `minimax_h3`), so a good result cannot
  be reproduced deterministically — it must be downloaded and kept.
- **Output download format is not declared** in the tool schema; results come
  back through the generation widget/job and the container must be inspected on
  arrival.

### Recommended model: `kling3_0` (Kling v3.0)

| Capability | Value |
| --- | --- |
| Start-image conditioning | **yes** (`start_image`) |
| **End-image conditioning** | **yes** (`end_image`) |
| Aspect ratios | 16:9, 9:16, 1:1 |
| Duration | 3–15 s |
| Quality modes | `std`, `pro`, `4k` |
| Audio | `sound: on/off` — use **off** |
| Tags | multi-shot, motion-transfer, cinematic, advanced |

**Why this one, over the alternatives:**

- **`end_image` is not a nice-to-have here, it is the requirement.** Section 6
  explains why the video must land back on the locked composition; only
  `kling3_0`, `minimax_h3`, `wan3_0(_prime)`, `seedance_2_5` and `flux_3_video`
  support it. `kling3_0_turbo` and `grok_video_v15` are start-frame only and are
  therefore **disqualified**, regardless of price.
- It is **the cheapest model that can do the job** — 8.75 credits in `pro`
  against 20 (`minimax_h3`), 38.5 (`wan3_0_prime`) and 45 (`seedance_2_5`,
  `flux_3_video`). At 8.75 a failed attempt costs 8.4% of the budget instead of
  43%.
- Kling's physical-simulation and product-cinematography behaviour is the
  closest match to mechanically believable metal deformation plus slow-motion
  liquid.
- `4k` mode gives a final master that meets or exceeds the 2560 × 1440 plate
  spec, and the small lid region (3.65% of frame) genuinely needs it.

`minimax_h3` at 20 credits (2K, start+end frame) is the recommended fallback if
Kling proves unable to hold the label typography.

**Explicitly rejected:** `marketing_studio_video`, despite ranking top in the
MCP's own recommendation. It is a one-click UGC/product-ad generator with
avatars, hooks, narration and a 12–15 s floor. It composes an ad; we need a
controlled continuation of one locked frame.

### Known limitations of the recommendation

- No seed → a good take cannot be regenerated; download and archive immediately.
- No conditioning-strength control → drift away from the start frame can only be
  fought with prompt wording and by re-rolling.
- No fps control → retiming to 30 fps is a post step.
- 15 s ceiling — not a constraint here; 5 s is the target.
- `pro` mode resolution is not declared by the MCP; if `pro` returns below
  1920 × 1080 the master must be re-run in `4k`.

---

## 6. Video integration strategy

### Where the video takes over

Keep `cutPointVh = 1262`. It is locked, and the existing crossfade already
handles the flash problem correctly:

```
plateOpacity = [1256, 1278, 1310, 1320] → [0, 1, 1, 0]
scrub        = [1262, 1320]             → [0, 1]
```

- vh 1256–1262: plate fades in while the video sits on frame 0 (scrub clamped).
- vh 1262: scrub begins. Plate opacity 0.2727.
- vh 1278: plate fully opaque — and the flash decayed at 1274, so the
  cross-dissolve happens exactly while the two images are converging.
- vh 1310–1320: plate fades out, returning to live WebGL.

**Therefore: video frame 0 must match the live frame at vh 1262** — which is
precisely `open-pour-start-clean.png`. No change to the timeline is needed.

### Why the end frame is the hard part

Measured across the whole scrub range, **the camera and the can never move**:

| vh | Camera | Can rig | Tab |
| --- | --- | --- | --- |
| 1262 | `[0, 2.58, 3.42]` fov 30 | `[0,-0.12,0]` / `[-0.05,19.47,0.015]` | 0.55 |
| 1274 | identical | identical | 0.55 |
| 1300 | identical | identical | 0.55 |
| 1310 | identical | identical | 0.55 |
| 1320 | identical | identical | 0.55 |

The live WebGL underneath the video is a **frozen** shot of a pristine, unopened
can. When the plate fades out at 1310–1320 it reveals exactly that.

**Consequence: the generated video must end on the same locked composition it
started from — clean can, no liquid left in frame.** A video that ends with
liquid across the lens will hard-cut to a pristine can and destroy the CTA
transition. This is the single most important constraint on the generation.

The end frame differs from the start frame in three measured ways, and the
`end_image` supplied to Kling must reflect them:

| Property | vh 1262 (start) | vh 1310–1320 (end) |
| --- | --- | --- |
| Exposure | 1.097577 | 1.000000 |
| Nebula planes | present (0.1316) | **absent** |
| Warp/flash overlay | present (0.1785) | **absent** |
| Product key light | 3.1328 | 2.99 |
| CTA liquid wave | absent | appears at 1320 (≈0.296) |

**Action required before generating:** capture a second plate at **vh 1310**
using the identical method, and supply it as `end_image`. vh 1310 rather than
1320 because that is where the fade-out begins and the CTA liquid wave has not
yet entered.

### Aspect ratio — a real mismatch that must be resolved first

| | Aspect |
| --- | --- |
| Site canvas at 1440 × 900 | **1.6 (16:10)** |
| `RELEASE_FRAMING.plate` spec | 16:9 (2560 × 1440) |
| Kling output options | 16:9, 9:16, 1:1 — **no 16:10** |

The camera drives **vertical** FOV, so rendering the same scene at 16:9 keeps
the vertical framing pixel-identical and only adds horizontal information:

- at 16:10 → horizontal FOV 46.4114°
- at 16:9 → horizontal FOV **50.9426°**

So the correct pipeline is: generate 16:9, then display with `object-fit: cover`.
Covering a 1440 × 900 container from a 16:9 source keeps full height and crops
160 px of width (80 px per side, 10%), recovering exactly the 46.4114° the
canvas shows.

**This means `open-pour-start-clean.png` must not be fed to Kling as-is.** It is
1440 × 900 (16:10) and is the ground truth for *pixel continuity*, but a 16:9
start image has to be re-rendered at the same vertical FOV — viewport
2560 × 1440 (or 1600 × 900), same vh, same method. Feeding the 16:10 frame to a
16:9 model invites letterboxing or a horizontal stretch, either of which
changes the can's proportions.

This is a prerequisite, not an optional refinement. It is called out here rather
than acted on because the task scope was the two 1440 × 900 captures.

### Recommended duration and scrub mapping

The scrub range is 58 vh = **522 px of scroll**.

| Duration @ 30 fps | Frames | Scroll px per frame |
| --- | --- | --- |
| **5 s** | **150** | **3.48** |
| 8 s | 240 | 2.18 |

**5 s is the recommendation.** 150 frames across 522 px is already finer than
one frame per 4 px of scroll; 8 s buys no perceptible smoothness and costs 60%
more. The clip is scrubbed, never played at rate, so "5 seconds" is a frame
budget, not a running time — the slow-motion feel comes from the content.

### Recommended settings

| Setting | Value |
| --- | --- |
| Model | `kling3_0` |
| Mode | `pro` for iteration, `4k` for the master |
| Aspect ratio | `16:9` |
| Duration | 5 s |
| Sound | `off` |
| `start_image` | 16:9 re-render of the vh 1262 plate |
| `end_image` | 16:9 re-render of the vh 1310 plate |

### DOM integration

Replace the placeholder plate in `Chapter05Release.tsx` with a full-frame
`<video>` in the same container — the existing `plateOpacity`/`plateScale`
motion values already do the right thing and must be reused unchanged.

- `position: fixed; inset: 0; object-fit: cover;` inside the existing plate
  wrapper (`z-index: 1`, above the canvas, below the HUD).
- `muted`, `playsInline`, `preload="auto"`, **no autoplay** — never call
  `play()`.
- Drive it by subscribing to `scrollVh` and writing
  `video.currentTime = scrub * duration`. Use `scrollVh.on('change', …)` or the
  existing `useTransform` chain — **never React state**, to preserve the
  "nothing re-renders per frame" property.
- Do **not** route the video through a WebGL texture. The video replaces the
  whole frame; a canvas texture adds a decode-to-GPU hop and a colour-management
  step for no benefit.

**Encoding matters more than usual.** Long-GOP H.264 seeks to the nearest
keyframe, which makes `currentTime` scrubbing stutter badly. Re-encode the
delivered file to an all-intra (every frame a keyframe) H.264, or a 1–2 frame
GOP, before wiring it up. Expect a much larger file; that is the correct
trade for a scrub-driven plate.

---

## 7. Credit strategy — 104 available

Staged so that no single failure is expensive and a correction is always
affordable.

| Stage | Action | Config | Cost | Running | Left |
| --- | --- | --- | --- | --- | --- |
| 1 | Probe — does Kling hold the label and the tab mechanics at all? | `pro`, 5 s, sound off | 8.75 | 8.75 | 95.25 |
| 2 | Two prompt variants from stage 1 findings | 2 × `pro`, 5 s | 17.50 | 26.25 | 77.75 |
| 3 | Refinement of the best direction | `pro`, 5 s | 8.75 | 35.00 | 69.00 |
| 4 | Second refinement, if stage 3 is close but not locked | `pro`, 5 s | 8.75 | 43.75 | 60.25 |
| 5 | **Final master** | `4k`, 5 s, sound off | 30.00 | 73.75 | **30.25** |

**Reserve: 30.25 credits** — enough for either one complete 4k master re-run
(30.00) or three further `pro` corrections (26.25). The budget is never
exhausted by the first attempt, and a meaningful correction is always funded.

Hard rules:

- Higgsfield credits are for the Open & Pour money shot **only**.
- **Zero credits** to the logo, can design, can geometry, label typography,
  nebula backgrounds, the station, asteroids or the constellation. All of those
  are coded and stay coded.
- Stop and re-plan rather than continuing past stage 4 at `pro`; if four `pro`
  attempts have not produced a usable direction, the prompt or the start frame is
  wrong and more attempts will not fix it.
- Download and archive every acceptable take immediately — there is no seed, so
  a discarded good result is unrecoverable.

---

## 8. Technical risks

| # | Risk | Why it matters | Mitigation |
| --- | --- | --- | --- |
| 1 | **Aspect mismatch, 16:10 site vs 16:9 model** | Feeding the 1440 × 900 plate to a 16:9 model risks letterboxing or a horizontal stretch that changes can proportions | Re-render the start/end plates at 16:9 with the same vertical FOV; display `object-fit: cover` |
| 2 | **End frame must return to the locked composition** | Camera and can are frozen 1262→1320; the fade-out at 1310 reveals a pristine can | Supply an `end_image` captured at vh 1310; prompt the pour to fully exit frame |
| 3 | **Residual flash at the cut point** (+9.76% exposure) | A later comparison against a post-1274 frame will read the plate as too bright | Documented here; the plate is correct as captured |
| 4 | **Lid region is 3.65% of frame** | Tab and score line are the entire mechanical story and are tiny | Generate at `4k` for the master; reject any take where the score line is mush |
| 5 | **Label typography corruption** | The LYRA wordmark and `VOID / 03` are the brand; models routinely garble small text | Hard acceptance criterion; inspect at 1:1, reject on any glyph change |
| 6 | **Can is cropped by the frame bottom** | Models like to "complete" a subject, which would rescale or reposition the can | Prompt explicitly for a static locked-off camera; verify bbox against §2 |
| 7 | **Release particles are non-deterministic** | `ReleaseParticles` seeds positions with `Math.random()` in a `useMemo`, so the particle cue differs on every page load | The captured plate is one valid instance; never expect a byte-identical re-capture. Consider whether the video should continue those particles at all |
| 8 | **No fps control** | 30 fps plate spec cannot be requested | Measure the delivered file; retime to 30 fps |
| 9 | **No seed** | A good take cannot be reproduced | Archive on arrival |
| 10 | **Long-GOP seeking** | `currentTime` scrubbing stutters on standard H.264 | Re-encode all-intra before integration |
| 11 | **Scrollbar changes the render aspect** | On Windows with classic scrollbars a 1440-wide window gives a **1425 × 900** layout viewport (aspect 1.5833, not 1.6) | Captures forced the layout viewport to exactly 1440 × 900; recording must do the same, or use overlay scrollbars |
| 12 | **Colour management** | Canvas output is ACES-tonemapped sRGB; a returned video in a different transfer will not match the live canvas at the crossfade | Compare the video's frame 0 against the plate numerically before integrating |

---

## 9. Acceptance criteria for the generated video

Objective and checkable. A take that fails any **must** criterion is rejected.

### First-frame continuity — must

1. Frame 0, cover-cropped to 1440 × 900, differs from
   `open-pour-start-clean.png` by **mean absolute error ≤ 3/255 per channel**
   over the full frame.
2. The can's bounding box in frame 0 is within **±4 px** on every edge of
   x 469.91 → 959.72, y 335.30 → 1428.22.
3. The can's centre in frame 0 is within **±3 px** of (714.82, 881.76).
4. No visible seam when stepping vh 1256 → 1262 → 1278 in the browser.

### Branding — must

5. The vertical LYRA wordmark is legible and **letter-for-letter correct** in
   every frame where it is on screen. Any added, dropped or deformed glyph is a
   rejection.
6. `VOID / 03` renders exactly, including the spacing and the slash.
7. The single diagonal foil band is preserved. No printed lightning, glowing
   cracks, flames or neon added to the can.
8. Label artwork does not drift, slide, re-wrap or change scale relative to the
   can body across the clip.

### Geometry — must

9. Can silhouette width holds at **489.81 px ±2%** for every frame in which the
   can is unoccluded.
10. Body-diameter-to-height ratio stays at **1 : 2.32 ±3%**.
11. The straight sidewall stays straight; the shoulder knuckle stays tight; the
    rolled top seam remains a distinct band standing proud of the neck.
12. No morphing, no melting, no wobble in the can's outline between consecutive
    frames.

### Mechanics — must

13. The stay-tab rotates about its rivet only. It never translates off the lid
    and never detaches.
14. The scored panel opens **along the existing score line** and hinges inward
    at its inner edge — it does not vanish, tear arbitrarily or open outward.
15. The opening sequence reads as pressure release: panel breaks, then liquid
    follows. Never liquid before the seal breaks.

### Liquid — must

16. Liquid reads as **violet/magenta**, inside the VOID palette
    (`#7127FF` → `#D628FF`, highlights toward `#F6E8FF`). Not amber, not orange,
    not white, not blue-green.
17. Motion is slow-motion zero-gravity: cohesive blobs and ribbons with surface
    tension, no gravity-driven splash, no downward pooling.
18. Liquid originates at the opening. It does not appear from off-frame or
    materialise around the can.

### Camera and scene — must

19. **Zero camera movement.** No pan, dolly, zoom, roll or FOV change. Frame-to-
    frame background star displacement ≤ 1 px.
20. Background stays deep black (`#020205`) at every frame corner.
21. **No extra objects** — no second can, no glass, no straw, no hands, no
    table, no logo cards, no text overlays, no lens flares beyond the existing
    bloom character.
22. No watermark of any kind.

### End frame and CTA hand-off — must

23. The final frame returns to the locked composition: can centred, upright,
    same bbox tolerance as criterion 2, **no liquid remaining in frame**.
24. The final frame matches the live WebGL at vh 1310 — exposure baseline 1.0,
    no nebula, no flash — to **MAE ≤ 5/255**.
25. Stepping vh 1300 → 1320 in the browser shows no visible cut, brightness step
    or positional jump as the plate fades out.

### Technical — must

26. Delivered at 16:9, **≥ 1920 × 1080**, master preferably ≥ 2560 × 1440.
27. Retimed to exactly 30 fps.
28. Re-encoded all-intra; `currentTime` scrubbing holds ≥ 50 fps on the
    recording machine.
29. Silent — no audio track in the integrated file.

### Should

30. Bloom character on the liquid highlights approximately matches the scene's
    `Bloom` (threshold 0.93, intensity 0.38).
31. The vertical specular bands from the strip-light environment survive on the
    aluminium through the clip.

---

## 10. Files added by this task

| File | Purpose |
| --- | --- |
| `docs/qa/higgsfield/open-pour-start-clean.png` | 1440 × 900 clean WebGL start plate |
| `docs/qa/higgsfield/open-pour-start-reference.png` | 1440 × 900 full-site compositing reference |
| `docs/qa/higgsfield/open-pour-preparation.md` | this document |

No source file was modified. No production build was required.

---

## 11. Prerequisites before any credit is spent

1. Re-render the start plate at **16:9** (2560 × 1440, same vertical FOV, same
   vh 1262, same capture method).
2. Capture the **end plate at vh 1310** at 16:9, same method.
3. Confirm both plates against §2 measurements.
4. Draft and review the generation prompt against §9.
5. Only then run stage 1 of §7 — a single 8.75-credit `pro` probe.
