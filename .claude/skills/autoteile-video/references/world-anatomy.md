# compositions/world.html — anatomy (portrait template, episode 2 "Bremsen")

One sub-composition holds the whole film at 1080 × 1920: two Three.js scenes (`brk` = the part, `road`) rendered into one canvas, plus HTML overlays (labels, the "Werkstatt" plate, the parts strip, the follow card). A single GSAP tween drives `render(t)`; everything is a pure function of `t`.

## Sections (search for these comments)

| Section                                                                                                 | Keep / change                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS + markup at the top                                                                                 | Keep the classes. Change the label `<div>`s (one per label, `class="lbl"` = box above the anchor, `class="lbl down"` = below), the strip word, and the follow line "für Teil N: Y".                                                                                             |
| `/*TIMING*/ … /*END TIMING*/`                                                                           | Written by `tools/build.mjs`: `LINES` (start/end per line) and `M` (mark name → seconds). Never edit by hand.                                                                                                                                                                   |
| helpers (`clamp01`, `ramp`, `E.*` eases, `h2`/`vnoise` hash noise, `rng` mulberry32, `flat()` material) | Keep. Deterministic — no `Math.random()`.                                                                                                                                                                                                                                       |
| `// timing derived from the voice`                                                                      | Named moments from `LINES`/`M`: strip stop/out, the part's key moments, `tRoadIn` (cut to the road at l5), `tCarStop`, `tOutroSpin`/`tOutroStop` (closing strip), `tFollow`. `tools/build.mjs` mirrors the strip and road times for the sound cues — keep the two in sync.      |
| renderer                                                                                                | Portrait, FOV 50. Keep.                                                                                                                                                                                                                                                         |
| `// ROAD WORLD`                                                                                         | Keep: sky, terrain, road, trees, mountains, car, wheels, hazards, `carState(t)` (brakes to a stop between `tRoadIn` and `tCarStop`).                                                                                                                                            |
| `// BRAKE WORLD`                                                                                        | **Replace with the part.** Faceted backdrop (keep), lights, the part's groups, effect particles (rings, sparks), the `spinTable` (integrated rotation, if the part spins).                                                                                                      |
| `// CAMERA PATHS`                                                                                       | `brkKeys` (part world) and `roadKeys` (relative to the car). Keys: `{t, p:[x,y,z], l:[x,y,z], e}` where `e` is one of io, io2, in3, out3, lin — the ease of the segment _ending_ at that key. In portrait the frame is narrow: a part of radius 3 fills the width at ~13 units. |
| `// LABELS + STRIP`                                                                                     | `place(id, Vector3)` projects an anchor (x clamped to 200–880 px); `labelWin` hides labels outside their window. Strip: `SLOT` px per icon, `reel()` slot-machine ease, `stripOffset(t, target, t0, t1, loops)`, `drawStrip()` with the shard burst.                            |
| `// RENDER`                                                                                             | iris → strip (opening before `tOutroSpin`, closing after) → part branch (`t < tRoadIn`) or road branch.                                                                                                                                                                         |
| `// TIMELINE`                                                                                           | `showLabel(id, from, to)`, strip in/out, plate, follow card (pic pop, text, hand tap, "+" → "✓").                                                                                                                                                                               |

## Modelling a part

- Low-poly = few segments + `flatShading: true` (`flat(color)`): lathe rings 24–32 segments, `IcosahedronGeometry(r, 1)`, `CylinderGeometry(…, 6–10)`, `TubeGeometry` along a helix for springs.
- Colours: steel `#b9bec8`/`#d0d4dc`, light parts `#eef0f4`, rubber/dark `#2c2a30`, red parts `#d9483b`, friction/brown `#4a3b33`. Wear and heat by lerping a material colour (heat `#ff7a2f`, blued `#7f86b8`, rust `#8c5a3c`). Yellow `#ffd24a` is reserved for arrows, rings, labels and plates.
- Show the mechanism from the view that explains it (episode 2: a side view down the disc edge so the pads visibly clamp it), then a 3/4 front view for damage on faces.
- Keep labels off the caption band (captions sit ~1250–1360 px from the top) and out of TikTok's UI zones; snapshot every label window.

## Strip icons

`scripts/icons/icons.html` holds one low-poly model per strip part (`MODELS`). To add a part: add a model there, render it, copy the PNG into the project's `assets/icons/` and the template's, add a `.slot` `<div>` at the end of `#strip-band`, and raise `N` in both `world.html` and `tools/build.mjs`.

```bash
cp autoteile/<slug>/assets/vendor/three.min.js .claude/skills/autoteile-video/scripts/icons/   # git-ignored
node .claude/skills/autoteile-video/scripts/icons/render-icons.cjs autoteile/<slug>/assets/icons <name>
```
