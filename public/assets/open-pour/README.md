# open-pour

Scroll-scrubbed Open & Pour video for Chapter 05.

- Type: Foreground video (replaces the placeholder plate, not the background)
- Aspect ratio: 16:9
- Resolution: 2560 x 1440
- Frame rate: 30 fps
- Scrub range: vh 1262 → 1320 (58 vh of scroll)

## Required start frame

The video must open on exactly the frame the prototype hands over on. These
values are generated from `RELEASE_FRAMING` in `src/config/choreography.ts` —
that constant is the source of truth, not this file.

| | |
| --- | --- |
| Cut point | vh 1262 |
| Camera position | `[0, 2.58, 3.42]` |
| Camera target | `[0, 1.05, 0]` |
| Camera FOV | 30° vertical |
| Can position | `[0, -0.12, 0]` |
| Can rotation Y | 0.6204 rad (35.55°) off label-front |
| Can rotation X | -0.05 rad |
| Can scale | 1.0 |
| Pull tab | fully lifted, seal broken |
| Flavor | VOID / 03 |

The camera sits roughly 24° above the horizontal, looking down onto the lid so
the broken seal and the raised tab are both in frame.

**End-frame direction:** the pour continues downward and exits low in frame.

To capture the reference still: run the dev server, scroll to vh 1262 (press `D`
for the readout showing the exact position), press `V` to confirm the plate
bounds, then turn both overlays off before recording.

This folder is intentionally empty in Phase 1. The application runs normally
without it. See the root README, "Phase 2 asset slots".
