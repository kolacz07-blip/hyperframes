// Builds compositions/captions.html and the TIMING block in compositions/world.html
// from script.json. When assets/voice/words.json exists (word timings of the real
// voiceover), those timings replace the estimates.
//
//   node tools/build.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = JSON.parse(readFileSync(join(root, "script.json"), "utf8"));
const wordsPath = join(root, "assets/voice/words.json");

const tokenize = (text) => text.split(/\s+/).filter((w) => w && w !== "–");

// words: [{ text, start, end, line }]
let words = [];
let lineTimes = {};
if (existsSync(wordsPath)) {
  const real = JSON.parse(readFileSync(wordsPath, "utf8"));
  // real: { words: [{ text, start, end }] } in spoken order over the full script
  let i = 0;
  for (const line of script.lines) {
    const toks = tokenize(line.text);
    const lw = [];
    for (const tok of toks) {
      const w = real.words[i++];
      if (!w) throw new Error(`words.json ran out at "${tok}"`);
      lw.push({ text: tok, start: w.start, end: w.end, line: line.id });
    }
    lineTimes[line.id] = { start: lw[0].start, end: lw[lw.length - 1].end };
    words.push(...lw);
  }
} else {
  for (const line of script.lines) {
    const toks = tokenize(line.text);
    const weights = toks.map((t) => t.replace(/[^\p{L}\p{N}]/gu, "").length + 2);
    const total = weights.reduce((a, b) => a + b, 0);
    let t = line.start;
    const span = line.end - line.start;
    toks.forEach((tok, k) => {
      const d = (weights[k] / total) * span;
      words.push({
        text: tok,
        start: +t.toFixed(3),
        end: +(t + d * 0.92).toFixed(3),
        line: line.id,
      });
      t += d;
    });
    lineTimes[line.id] = { start: line.start, end: line.end };
  }
}

const clean = (s) => s.replace(/[^\p{L}\p{N}-]/gu, "");
const marks = {};
for (const m of script.marks) {
  const w = words.find((x) => x.line === m.line && clean(x.text) === m.word);
  if (!w) throw new Error(`mark ${m.name}: word "${m.word}" not found in ${m.line}`);
  marks[m.name] = +w.start.toFixed(3);
}

// ---- caption groups: 3–5 words, break on punctuation or pauses ≥ 0.15 s
const groups = [];
let cur = [];
words.forEach((w, k) => {
  cur.push(w);
  const next = words[k + 1];
  const punct = /[.,:?!;]$/.test(w.text);
  const pause = next ? next.start - w.end >= 0.15 : true;
  const newLine = next ? next.line !== w.line : true;
  if (
    newLine ||
    cur.length >= 3 ||
    (cur.length >= 2 && (punct || pause)) ||
    (punct && /[.?!:]$/.test(w.text))
  ) {
    groups.push(cur);
    cur = [];
  }
});
if (cur.length) groups.push(cur);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const total = script.duration;
const groupHtml = groups
  .map((g, i) => {
    const start = Math.max(0.1, g[0].start - 0.08);
    const nextStart = groups[i + 1] ? groups[i + 1][0].start - 0.08 : total;
    const end = Math.min(nextStart, g[g.length - 1].end + 0.35, total);
    const spans = g
      .map(
        (w, j) => `<span class="w" id="cap-w${i}-${j}" data-t="${w.start}">${esc(w.text)}</span>`,
      )
      .join(" ");
    return `    <div id="cap-g${i}" class="clip cap" data-start="${start.toFixed(2)}" data-duration="${(end - start).toFixed(2)}" data-track-index="1"><span class="cap-inner">${spans}</span></div>`;
  })
  .join("\n");

const captions = `<template>
  <style>
    #root {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .cap {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 560px;
      padding: 0 60px;
      text-align: center;
      overflow: visible;
    }
    .cap-inner {
      display: inline-block;
      padding: 12px 30px 18px;
      background: rgba(20, 16, 24, 0.72);
      color: #ffffff;
      font-family: "Montserrat", sans-serif;
      font-weight: 800;
      font-size: 84px;
      line-height: 1.15;
      letter-spacing: -0.01em;
    }
    .w {
      display: inline-block;
    }
  </style>
  <div id="root" data-composition-id="captions" data-width="1080" data-height="1920" data-layout-allow-caption-zone>
${groupHtml}
  </div>
  <script>
    (function () {
      const tl = gsap.timeline({ paused: true });
      document.querySelectorAll("#root .cap").forEach((g) => {
        const s = parseFloat(g.dataset.start);
        const e = s + parseFloat(g.dataset.duration);
        const inner = g.querySelector(".cap-inner");
        tl.fromTo(inner, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.14, ease: "power3.out" }, s);
        g.querySelectorAll(".w").forEach((w) => {
          tl.fromTo(w, { color: "#ffffff" }, { color: "#ffd24a", duration: 0.06 }, parseFloat(w.dataset.t));
          tl.to(w, { color: "#ffffff", duration: 0.12 }, parseFloat(w.dataset.t) + 0.32);
        });
        tl.to(inner, { opacity: 0, duration: 0.1, ease: "power2.in" }, e - 0.1);
        tl.set(inner, { opacity: 0 }, e);
      });
      window.__timelines["captions"] = tl;
    })();
  </script>
</template>
`;
writeFileSync(join(root, "compositions/captions.html"), captions);

// ---- timing block in world.html
const worldPath = join(root, "compositions/world.html");
const world = readFileSync(worldPath, "utf8");
const block = `/*TIMING*/ const LINES = ${JSON.stringify(lineTimes)}; const M = ${JSON.stringify(marks)}; /*END TIMING*/`;
const next = world.replace(/\/\*TIMING\*\/[\s\S]*?\/\*END TIMING\*\//, block);
if (next === world && !world.includes(block))
  throw new Error("TIMING markers missing in world.html");
writeFileSync(worldPath, next);

// ---- audio cues in index.html (mirror the derived times in world.html)
const cueList = [];
cueList.push(["sfx-hook", "assets/sfx/impact-bass-2.mp3", 0.02, 1.5, 0.6, 13]);
cueList.push(["sfx-slide", "assets/audio/hum.mp3", 0.0, 3.0, 0.45, 14]);
cueList.push(["sfx-fine", "assets/sfx/pop.mp3", marks.euro - 0.05, 0.7, 0.7, 15]);
cueList.push(["sfx-sign", "assets/sfx/pop.mp3", marks.berg - 0.05, 0.7, 0.6, 15]);
cueList.push(["sfx-coin", "assets/sfx/click-soft.mp3", marks.muenze + 0.35, 0.3, 0.9, 14]);
cueList.push(["sfx-rand", "assets/sfx/pop.mp3", marks.rand - 0.05, 0.7, 0.6, 15]);
cueList.push(["sfx-share", "assets/sfx/whoosh.mp3", marks.schick - 0.25, 0.57, 0.5, 14]);
cueList.push(["sfx-tap", "assets/sfx/click.mp3", marks.folg + 0.95, 0.3, 0.8]);
const cueHtml = cueList
  .map(
    ([id, src, s, d, v, tr = 11]) =>
      `<audio id="${id}" class="clip" src="${src}" data-start="${s.toFixed(2)}" data-duration="${d.toFixed(2)}" data-track-index="${tr}" data-volume="${v}"></audio>`,
  )
  .join("\n      ");
const indexPath = join(root, "index.html");
let index = readFileSync(indexPath, "utf8");
index = index.replace(
  /<!--CUES-->[\s\S]*?<!--\/CUES-->|<!--CUES-->/,
  `<!--CUES-->\n      ${cueHtml}\n      <!--/CUES-->`,
);
// film length on the root and every scene host, and in world.html
for (const id of ["main", "world", "captions"]) {
  const re = new RegExp(`(id="${id}"[\\s\\S]*?data-duration=")[^"]*"`);
  index = index.replace(re, `$1${total}"`);
}
writeFileSync(indexPath, index);
const w2 = readFileSync(worldPath, "utf8").replace(/const DUR = [\d.]+;/, `const DUR = ${total};`);
writeFileSync(worldPath, w2);

console.log(
  `${words.length} words, ${groups.length} caption groups, source: ${existsSync(wordsPath) ? "voice" : "estimate"}`,
);
console.log(JSON.stringify(marks));
