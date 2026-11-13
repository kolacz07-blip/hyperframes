---
name: autoteile-video
description: Make the next episode of the user's German TikTok series of low-poly 3D car-part explainers (vertical 9:16, ~35 s) — what the part does, why it wears out, how you notice — with a German ElevenLabs voiceover, word-timed captions, a slot-machine "parts strip" that opens ("Heute …") and closes ("Nächstes Mal …") every episode, and a follow card, built with HyperFrames from a proven template. Use this whenever the user asks for a video, Erklärvideo, TikTok, Clip or Reel about an Autoteil / Ersatzteil / car part (Radlager, Bremsen, Bremsscheibe, Stoßdämpfer, Kupplung, Zündkerze, Batterie, Lichtmaschine, Turbolader, Keilriemen, Querlenker …), asks for "das nächste Ersatzteil", "die nächste Folge" or "noch so ein Video", even if they don't say "low poly" or "skill".
---

# Autoteile-Erklärvideo (TikTok-Serie, Low-Poly, Deutsch)

Each episode turns one car part into a ~35 s portrait HyperFrames film. The template (`template/`, a copy of episode 2 `autoteile/bremsen/`) already contains everything that is the same for every episode — portrait layout, the parts strip, captions, follow card, sound cues, road + car, voice tooling. Per episode you write the **script**, build the **part world** (the 3D part and how it wears) and set the **strip targets**.

Read `/hyperframes` (skills/hyperframes/SKILL.md) for the render contract if you have not this session. Speak to the user in German, simply: they are not a developer.

## Series state (update after every episode)

| Ep. | Part        | Format                                  | Announced next  | Avg. watch | Full views | Notes                                                                               |
| --- | ----------- | --------------------------------------- | --------------- | ---------- | ---------- | ----------------------------------------------------------------------------------- |
| 1   | Radlager    | 16:9, 54.5 s, slow road intro, no strip | —               | 9.3 s      | 3.6 %      | 865 views/16 h, 22 likes, 5 saves, 0 comments, 0 follows                            |
| 2   | Bremsen     | 9:16, 37 s, strip + follow card         | **Stoßdämpfer** | ?          | ?          |                                                                                     |
| 3   | Stoßdämpfer | 9:16, 38 s, strip + follow card         | **Zündkerzen**  | ?          | ?          | spring = helix rebuilt per frame (`setSpring`); oil translucent so the piston shows |

- TikTok username: **@wasmachtdasteil** (index.html variable `username`). Planned order: Zündkerzen (Ep. 4, announced) → Batterie → Kupplung (a proposal; confirm with the user).
- The next episode **must** be the part the previous one announced (Ep. 4 = Zündkerzen) unless the user decides otherwise. Ask which part comes _after_ it, because that is what this episode announces.
- After the user uploads, ask for the two numbers that matter — average watch time and "ganzes Video angeschaut %" — and fill them into this table, so each episode learns from the last.

## Why the format is what it is (audience data)

Episode 1 lost most viewers by 9 s: the part only appeared at ~10 s, in 16:9 it was small on a phone, and 55 s is long for TikTok. Those who stayed liked and saved it, so the look works. Hence, for every episode:

1. **9:16 (1080 × 1920)**, everything big: captions 84 px (bottom: 560 px, so they clear TikTok's own UI), labels 60 px, at most 2–3 labels at once. Keep text out of the bottom ~400 px and the right ~140 px (TikTok buttons); `place()` already clamps labels to x 200–880.
2. **Hook from frame 0:** the strip is already spinning; the voice opens with the symptom as a question ("Quietscht's beim Bremsen?") and the strip lands on the part's name as the voice says it (≈ 1.1 s). The part is on screen behind the strip from frame 0.
3. **~35 s, ~80 spoken words**, a new picture every 2–3 s.
4. **A question for the comments** in the last spoken line ("Hattest du das schon mal? Schreib's in die Kommentare.").
5. Tell the user to add a quiet TikTok library sound when uploading (no music source here), and to switch on TikTok's "KI-generierte Inhalte" label (the voice is AI).

## The film, line by line (episode 2 as the pattern)

| Line        | Words                                                 | Picture                                                                                                                                  |
| ----------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| l1 hook     | symptom question + "schau dir deine X an"             | strip spins and stops on today's part ("Heute: X"), part world behind; symptom effect (squeal rings, sparks) on the symptom word         |
| l2 job      | what the part does, its 2–3 pieces named              | camera moves to the view that shows the mechanism; one label per piece, on its word; yellow arrows for forces                            |
| l3 wear     | why it wears out, and what happens then               | the wear happening (thinner, rust, cracks, leaks…), then the damage (scoring, sparks, impact shake)                                      |
| l4 symptoms | 3–4 symptoms the viewer can notice                    | each symptom shown on the part with a label (rings, wobble/shake, heat colour); a dashboard lamp only if one really exists for this part |
| l5 payoff   | "… komisch? Ab in die Werkstatt!" + comments question | iris cut to the road: the car brakes and stops with hazard lights; "Ab in die Werkstatt!" plate on its word                              |
| l6 next     | "Nächstes Mal: der/die Y."                            | road dims, strip returns, spins, stops on Y as it's said; then the follow card "Folg @username / für Teil N+1: Y" with a tap on the "+"  |

Every claim must be true for that part; if you are unsure whether a symptom or warning light belongs to it, say so to the user or leave it out. A beautiful wrong diagram is worse than none.

## Workflow

1. **Before building, settle with the user:** today's part (normally last episode's announcement), the part to announce next, and (only if changed) the username. Defaults: voice "George" (ElevenLabs `JBFqnCBsd6RMkjVDRZzb`), captions on, no music.
2. **Scaffold** from the repo root: `bash .claude/skills/autoteile-video/scripts/new-part.sh <slug>` (e.g. `stossdaempfer`). It copies the template to `autoteile/<slug>/`, vendors Three.js and copies the sound effects. Projects live under `autoteile/` because the repo's `.gitignore` ignores `videos/`.
3. **Script** — rewrite `script.json`: the six lines above (ids `l1`…`l6`), ~80 words, plain spoken German, "du"-form. Then `marks`: words whose start time drives a picture (`{ "name": "sattel", "line": "l2", "word": "Bremssattel" }`). The word is matched with punctuation and apostrophes stripped (`Quietscht's` → `Quietschts`). `naechstes` (l6 "Nächstes") and the next part's word are required — the closing strip keys off them; build.mjs also reads `stossdaempfer`, so rename that mark consistently in `script.json`, `world.html` (`M.stossdaempfer`) and `tools/build.mjs` (`marks.stossdaempfer`). Show the user the script before spending voice credits.
4. **World** — in `compositions/world.html` (see `references/world-anatomy.md`):
   - replace the `// BRAKE WORLD` section with the new part, and update everything that references brake objects: `// timing derived from the voice`, `brkKeys`, the brake branch of `render()`, the label `<div>`s, `place()` and `showLabel()` calls;
   - strip: the opening target index (`stripOffset(t, 1, …)`) and word ("Bremsen"), the closing target (`stripOffset(t, 2, …)`) and word ("Stoßdämpfer"), the follow line "für Teil N: Y". Icon order is fixed: 0 Radlager, 1 Bremsscheibe, 2 Federbein (Stoßdämpfer), 3 Zündkerze, 4 Batterie, 5 Kupplung, 6 Keilriemen, 7 Turbolader. A part not in the strip yet: add a model to the icon renderer (`references/world-anatomy.md`) and append it — never reorder;
   - keep the road, helpers, iris, plates, strip mechanics and follow card.
5. **Build + look**:
   ```bash
   cd autoteile/<slug>
   node tools/build.mjs          # captions + timing + all sound cues from script.json
   npx --yes hyperframes@0.9.39 check --json
   npx --yes hyperframes@0.9.39 snapshot --at <one time per beat>
   ```
   Read the contact sheets; fix framing (labels on the captions, text in TikTok's UI zones, the part too small or too close to read), then snapshot again. `check` must say ok (contrast: put text on a dark plate, never yellow on the orange backdrop).
6. **Voice** — needs the ElevenLabs key as a network secret for `api.elevenlabs.io` (header `xi-api-key`). On 401 "Invalid API key", ask for the key again with the credential form (never in chat). `missing_permissions` for `user_read`/`voices_read` is fine.
   ```bash
   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node tools/voice.mjs [--voice <id>]
   ```
   Writes `assets/voice/voice.mp3` + `words.json`, sets the length to last word + 3.2 s and reruns `build.mjs` so captions, camera, labels, strip and sound land on the real words. Check and snapshot again.
7. **Render** (background, ~10 min): `npx --yes hyperframes@0.9.39 render -o renders/<slug>.mp4 --quiet`, then `npx hyperframes audio renders/<slug>.mp4 --json` (voice present, no clipping). Send the MP4 with `SendUserFile`; say that sound was measured, not heard.
   **Every video ships with two extras — the user asked for them on every episode, unprompted:**
   - **Description** with hashtags, written to `autoteile/<slug>/BESCHREIBUNG.txt` and pasted in the reply, ready to copy. Pattern (`autoteile/bremsen/BESCHREIBUNG.txt`): symptom question + emoji, one sentence what the video explains, the comments question, "Teil N der Serie – nächstes Mal: Y 👀", "🎙️ Stimme: ElevenLabs", then 10–12 hashtags: the part (2–3, e.g. #bremsen #bremsscheibe), #autoteile #kfz #werkstatt #autowissen #autotipps #mechaniker #lernenmittiktok #fyp #fürdich. Keep it under ~2 200 characters.
   - **Cover** (1080 × 1920, the user asked for a cleaner one than a raw frame): a clean still of the part (captions hidden, strip gone, no labels — snapshot a few moments 2–5 s in and pick the strongest), a "TEIL N" badge, the symptom question in two lines (second line yellow) and the part name on a yellow plate with "einfach erklärt". All text sits inside y 260–1660, the part TikTok's profile grid keeps when it crops covers to ~3:4. No emoji on the cover. `bash .claude/skills/autoteile-video/scripts/cover/make-cover.sh autoteile/<slug> <seconds> <N> "<Zeile 1>" "<Zeile 2>" "<TEILNAME>" <scratchpad>/cover-teil<N>.png` (Ep. 3: `3.4 3 "Wippt dein Auto" "nach?" "STOSSDÄMPFER"`) — look at it, then send it with `SendUserFile`.
     Also remind the user to add a quiet TikTok sound and switch on "KI-generierte Inhalte".
8. **Commit + push** (renders are git-ignored), then update the series table above (also in `.agents/skills/autoteile-video/SKILL.md`, see "Repo gotchas").

## Why things are the way they are (learned the hard way)

- **Three.js must be local** (`assets/vendor/three.min.js`): the render browser cannot reach jsdelivr, and the world silently stays blank (`THREE is not defined` in `check`).
- **No `will-change` on labels.** Over a WebGL canvas it punched peach-coloured holes into frames. Labels are hidden with `visibility` outside their window (`labelWin`) for the same reason.
- **Hide what is covered:** the strip under the follow card, or half-faded, fails the contrast check; `tl.set(..., { visibility: "hidden" })` once it is gone.
- **Labels follow 3D anchors** via `place(id, Vector3)` every frame; GSAP only tweens their opacity/scale.
- **Node `fetch` ignores the HTTPS proxy** unless `NODE_USE_ENV_PROXY=1` is set (otherwise `ENOTFOUND api.elevenlabs.io`).
- **Music**: there is no music source without a HeyGen sign-in; deliver without music and say so in one line rather than generating tones.

## Repo gotchas (this repo: hyperframes fork)

- The pre-commit hook builds the whole monorepo: run `bun install` once per session first. The hook runs _before_ the shell command, so do file changes and `git commit` in separate commands.
- This skill exists twice and must stay byte-identical: `.claude/skills/autoteile-video/` and `.agents/skills/autoteile-video/` (lint "Skill mirror out of sync"). After editing one, `cp -r` it over the other.
- Binary files over 500 KB are rejected unless in LFS, and LFS uploads are blocked here; mp3s under `.claude/skills/` are LFS-tracked, so the skill holds no audio (new-part.sh copies it from `skills/media-use`). Voice: mono 64 kb/s mp3.
- commitlint wants a lowercase subject: `feat(autoteile): add the stossdaempfer episode`.
- `packages/producer/tests/**` shows ~33 modified files right after cloning (LFS normalisation). Not your changes — never stage them.
- The root `.gitignore` ignores every folder named `compositions/`: stage with `git add autoteile/<slug> && git add -f autoteile/<slug>/compositions`, then check `git ls-files autoteile/<slug> | grep compositions`.
