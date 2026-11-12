---
name: autoteile-video
description: Make a German low-poly 3D explainer video (40–60 s, 16:9) about a car part — what it does, what happens when it breaks, how you notice — with a German ElevenLabs voiceover and word-timed captions, built with HyperFrames from a proven template (low-poly road + car, one continuous camera that dives through the wheel into the part). Use this whenever the user asks for a video, Erklärvideo, Clip or Reel about an Autoteil / Ersatzteil / car part (Radlager, Bremsscheibe, Bremsbeläge, Stoßdämpfer, Kupplung, Zündkerze, Lichtmaschine, Turbolader, Spurstange, Querlenker, Keilriemen, Batterie …), asks for "das nächste Ersatzteil" or "noch so ein Video", or wants another episode of the Radlager series — even if they don't say "low poly" or "skill".
---

# Autoteile-Erklärvideo (Low-Poly, Deutsch)

This skill turns one car part into a ~55 s HyperFrames film in the house style of the first episode (`autoteile/radlager/` in this repo, if it is there, is the reference build). The template already contains everything that is the same for every part; your job per episode is the **script** and the **part world** (the 3D model of the part and how it breaks).

Read `/hyperframes` (skills/hyperframes/SKILL.md) for the render contract if you have not this session. Speak to the user in German, simply: they are not a developer.

## The film, beat by beat

One continuous take; the voice is the clock. Each beat is one line of the script.

| Line        | Picture (template default)                                                                                                | Your part                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| l1 hook     | Low-poly car on a country road at sunset; yellow rings pulse at the wheel when the symptom is named                       | Pick the symptom the viewer knows (Brummen, Quietschen, Klackern, Ruckeln …). The road rings can stay, recolour or go |
| l2 reveal   | Camera pushes to the front-left wheel, dives through the hub cap (iris in #44444c), title card names the part on its word | Title text = part name                                                                                                |
| l3 job      | Part on its own faceted backdrop: what it does, forces as yellow arrows                                                   | Model + arrows                                                                                                        |
| l4 inside   | Exploded view along the axis, one label per part, each on its spoken word                                                 | Exploded offsets + labels                                                                                             |
| l5 cause    | Reassemble, impact shake, cutaway (clip plane), the damage happening (water, rust, wear, particles)                       | Damage animation                                                                                                      |
| l6 symptoms | The symptoms on the part (rings, wobble, heat colour) + a dashboard warning lamp if one applies                           | Which lamp, if any — never invent one that doesn't exist for this part                                                |
| l7 payoff   | The worst case, dive back out to the road, car stops with hazard lights, closing line "…? Ab in die Werkstatt"            | Closing line                                                                                                          |

The worst case and every claim must be true for that part; if you are unsure whether a symptom or warning light really belongs to the part, say so to the user or leave it out. A beautiful wrong diagram is worse than none.

## Workflow

1. **Ask only what you can't decide.** Default: 16:9, ~45–55 s, German voice "George" (ElevenLabs `JBFqnCBsd6RMkjVDRZzb`), captions on, no music. If the user names a different part, length, format or voice, use theirs.
2. **Scaffold** from the repo root:
   ```bash
   bash .claude/skills/autoteile-video/scripts/new-part.sh <slug>     # e.g. bremsscheibe
   ```
   It copies `template/` to `autoteile/<slug>/` and vendors Three.js locally. Projects live under `autoteile/` because the repo's `.gitignore` ignores `videos/`.
3. **Script** — rewrite `script.json`: 7 lines (`l1`…`l7`, keep the ids), ~115–130 words total (~150 words/min → ~50 s), plain spoken German, "du"-form, one idea per sentence. `start`/`end` are only estimates until the voice exists. Then define `marks`: each is the first word in a line whose start time drives a picture (`{ "name": "kugeln", "line": "l4", "word": "Stahlkugeln" }`; the word is matched without punctuation). Show the user the script before spending voice credits.
4. **Part world** — in `compositions/world.html` replace the section between `// BEARING WORLD` and `// CAMERA PATHS` with the new part, and update everything that references bearing objects: the derived times block (`// timing derived from the voice`), `bearKeys`, the `inBear` branch of `render()`, the label `<div>`s and `showLabel` calls, the ABS lamp block. Keep the road world, helpers, the dive/iris logic and the title/final-line mechanics. See `references/world-anatomy.md` for how the file is organised and the modelling rules.
5. **Build + look**:
   ```bash
   cd autoteile/<slug>
   node tools/build.mjs          # captions + timing + audio cue times from script.json
   npx --yes hyperframes@0.9.39 check --json
   npx --yes hyperframes@0.9.39 snapshot --at <one time per beat>
   ```
   Read the contact sheets. Fix framing (labels cut at the frame edge, labels or arrows over the caption band at the bottom ~200 px, the hero too small), then snapshot again.
6. **Voice** — needs the ElevenLabs key as a network secret for `api.elevenlabs.io` (header `xi-api-key`). If a call fails with 401 "Invalid API key", ask for the key again with the credential form (never in chat). `missing_permissions` for `user_read`/`voices_read` is fine — TTS still works.
   ```bash
   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node tools/voice.mjs [--voice <id>]
   ```
   It writes `assets/voice/voice.mp3` + `words.json`, sets the film length to last word + 3.2 s, and reruns `build.mjs` so captions, camera, labels and sound all land on the real words. Snapshot the beats again afterwards.
7. **Render** (background, ~10 min): `npx --yes hyperframes@0.9.39 render -o renders/<slug>.mp4 --quiet`, then `npx hyperframes audio renders/<slug>.mp4 --json` to confirm the voice is present and nothing clips. Send the MP4 with `SendUserFile`. Say that sound was measured, not heard.
8. **Commit + push** the project (renders are git-ignored). See "Repo gotchas".

## Why things are the way they are (learned the hard way)

- **Three.js must be local** (`assets/vendor/three.min.js`): the render browser cannot reach jsdelivr, and the world silently stays blank (`THREE is not defined` in `check`).
- **No `will-change` on labels.** Over a WebGL canvas it punched peach-coloured holes the size of a label into snapshots and renders. Labels are also hidden with `visibility` outside their window (`labelWin`), for the same reason.
- **Labels follow 3D anchors** via `place(id, Vector3)` every frame; GSAP only tweens their opacity/scale. Give each label a window that starts on its spoken word.
- **The dive** works because the road hub cap and the part-world hub cap share one colour (#44444c) and fill the frame at the cut; keep that match if you change either.
- **Node `fetch` ignores the HTTPS proxy** unless `NODE_USE_ENV_PROXY=1` is set (otherwise `ENOTFOUND api.elevenlabs.io`).
- **Music**: there is no music source without a HeyGen sign-in; deliver without music and say so in one line rather than generating tones.

## Repo gotchas (this repo: hyperframes fork)

- The pre-commit hook builds the whole monorepo: run `bun install` once per session first.
- Files over 500 KB that are binary are rejected unless in LFS: keep audio as MP3 (voice: mono 64 kb/s, which `voice.mjs` already does).
- commitlint wants a lowercase subject: `feat(autoteile): add the bremsscheibe video`.
- `packages/producer/tests/**` shows ~33 modified files right after cloning (LFS normalisation). They are not your changes — never stage them; tell the user once if a hook complains.
- The root `.gitignore` ignores every folder named `compositions/` — a plain `git add` silently leaves out `world.html` and `captions.html`, the heart of the video. Stage with `git add autoteile/<slug> && git add -f autoteile/<slug>/compositions`, then check with `git ls-files autoteile/<slug> | grep compositions`.
- Stage only your project, never `packages/producer/tests/**`.
