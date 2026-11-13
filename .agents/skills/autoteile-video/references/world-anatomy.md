# compositions/world.html — anatomy

One sub-composition holds the whole 3D film: two Three.js scenes (`road`, `bear`) rendered into one canvas, plus HTML overlays (labels, title, warning lamp, final line). A single GSAP tween drives `render(t)`; everything is a pure function of `t`.

## Sections (search for these comments)

| Section                                                                                                 | Keep / change                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/*TIMING*/ … /*END TIMING*/`                                                                           | Written by `tools/build.mjs`: `LINES` (start/end per line) and `M` (mark name → seconds). Never edit by hand.                                                                                                                                                                          |
| helpers (`clamp01`, `ramp`, `E.*` eases, `h2`/`vnoise` hash noise, `rng` mulberry32, `flat()` material) | Keep. Deterministic — no `Math.random()`.                                                                                                                                                                                                                                              |
| `// timing derived from the voice`                                                                      | Change: named moments (dive end, explode, collapse, cut, jam, exit dive, road return, car stop) built from `LINES`/`M`. `tools/build.mjs` mirrors a few of them for the audio cues (`cues` object) — keep the two in sync.                                                             |
| `// ROAD WORLD`                                                                                         | Keep: sky dome, `groundH` terrain, road, trees, mountains, car (`profileGeo` cabin), `wheels`, hazard lights, road hum rings, `carState(t)`. Front-left wheel `FL` is the dive target.                                                                                                 |
| `// BEARING WORLD`                                                                                      | **Replace with the part.** Faceted backdrop icosahedron (recolour per part if you like), hemisphere + key + rim lights, the part's groups, arrows (`makeArrow`), effect particles, `spinTable` (integrated rotation).                                                                  |
| `// CAMERA PATHS`                                                                                       | `roadKeys` (dive in), `roadKeys2` (return), `bearKeys` → rename/retime for the part. Keys: `{t, p:[x,y,z], l:[x,y,z], e}` where `e` is one of io, io2, in3, out3, lin — the ease of the segment _ending_ at that key. Road keys are relative to the car, part keys to the part centre. |
| `// LABELS`                                                                                             | `place(id, Vector3)` projects a 3D anchor; `labelWin` hides labels outside their window.                                                                                                                                                                                               |
| `// RENDER`                                                                                             | iris, then `inBear` branch (part animation + camera + `place` calls) or road branch.                                                                                                                                                                                                   |
| `// TIMELINE`                                                                                           | `showLabel(id, from, to)`, title, warning lamp, final line.                                                                                                                                                                                                                            |

## Modelling a part

- Low-poly = few segments + `flatShading: true` (`flat(color)`): lathe rings with 24–32 segments, `IcosahedronGeometry(r, 1)` balls, `CylinderGeometry(…, 6–10)`. Rotationally symmetric parts: `LatheGeometry` of a profile, then `rotateZ(-π/2)` so the axle is X (the camera arrives looking +X from the wheel).
- Colours: steel `#b9bec8`/`#d0d4dc`, light parts `#eef0f4`, rubber `#2c2a30`, brass `#c9a14a`, accent red `#d9483b`. Wear/heat by lerping a material colour (`rust #8c5a3c`, `heat #e0573c`). The yellow `#ffd24a` is reserved for arrows, rings, labels and the title bar.
- Exploded view: offset each sub-part along the axis by `ex * k` (`ex` = eased 0→1→0). Spread so labels don't collide; the side camera (`p ≈ [0.5, 3, -16]`) shows ±9 units.
- Cutaway: materials with `clippingPlanes: [cutPlane]`; animate `cutPlane.constant` from 5 to 0.
- The part's own hub/cap facing −X should be `#44444c` and fill the frame at the first `bearKeys` key so the dive cut is invisible.
- Hero fills ≥ 40 % of the frame; labels and arrows stay out of the bottom ~200 px (captions) and inside the frame (snapshot to check — labels stack upward 150 px above their anchor; `class="lbl down"` hangs them below).

## Overlays

- Title (`#world-title-text`, variable `title`) — the part name, lands on mark `radlager` (rename the mark key in both `script.json` and `world.html`).
- Warning lamp (`#world-abs`) — an inline SVG; swap the symbol for the part's real dashboard lamp (Bremse, Batterie, Motorkontrolle …) or delete the block and its tweens when none applies.
- Final line (`#world-final`) — one short question + "Ab in die Werkstatt"; it must not repeat the voice word for word.
