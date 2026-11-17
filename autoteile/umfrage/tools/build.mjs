// Writes the word timings, line times and marks from script.json (+ assets/voice/words.json)
// into the TIMING block of index.html, and the film length onto #main.
//   node tools/build.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = JSON.parse(readFileSync(join(root, "script.json"), "utf8"));
const wordsPath = join(root, "assets/voice/words.json");
const tokenize = (text) => text.split(/\s+/).filter((w) => w && w !== "–");
const real = existsSync(wordsPath) ? JSON.parse(readFileSync(wordsPath, "utf8")).words : null;
const words = [];
const lines = {};
let i = 0;
for (const line of script.lines) {
  const toks = tokenize(line.text);
  const weights = toks.map((t) => t.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = line.start;
  const lw = toks.map((tok, k) => {
    if (real) {
      const w = real[i++];
      if (!w) throw new Error(`words.json ran out at "${tok}"`);
      return { text: tok, start: w.start, end: w.end, line: line.id };
    }
    const d = (weights[k] / total) * (line.end - line.start);
    const w = { text: tok, start: +t.toFixed(3), end: +(t + d * 0.9).toFixed(3), line: line.id };
    t += d;
    return w;
  });
  lines[line.id] = { start: lw[0].start, end: lw[lw.length - 1].end };
  words.push(...lw);
}
const clean = (s) => s.replace(/[^\p{L}\p{N}-]/gu, "");
const marks = {};
for (const m of script.marks) {
  const w = words.find((x) => x.line === m.line && clean(x.text) === m.word);
  if (!w) throw new Error(`mark ${m.name}: "${m.word}" not in ${m.line}`);
  marks[m.name] = w.start;
}
const indexPath = join(root, "index.html");
let html = readFileSync(indexPath, "utf8");
const block = `/*TIMING*/ const DUR = ${script.duration}; const LINES = ${JSON.stringify(lines)}; const M = ${JSON.stringify(marks)}; const WORDS = ${JSON.stringify(words.map((w) => [w.text, w.start, w.end]))}; /*END TIMING*/`;
html = html.replace(/\/\*TIMING\*\/[\s\S]*?\/\*END TIMING\*\//, block);
html = html.replace(/(id="main"[\s\S]*?data-duration=")[^"]*"/, `$1${script.duration}"`);
const cue = (id, src, s, d, v, tr) =>
  `<audio id="${id}" class="clip" src="${src}" data-start="${s.toFixed(2)}" data-duration="${d}" data-track-index="${tr}" data-volume="${v}"></audio>`;
const cues = [
  cue("sfx-hook", "assets/sfx/whoosh.mp3", 0.02, 1.0, 0.6, 11),
  cue("sfx-c1", "assets/sfx/pop.mp3", marks.turbo - 0.02, 0.7, 0.7, 12),
  cue("sfx-c2", "assets/sfx/pop.mp3", marks.keil - 0.02, 0.7, 0.7, 13),
  cue("sfx-c3", "assets/sfx/pop.mp3", marks.anderes - 0.02, 0.7, 0.7, 12),
  cue("sfx-comment", "assets/sfx/whoosh.mp3", marks.kommentare - 0.25, 1.0, 0.5, 13),
  cue("sfx-tap", "assets/sfx/click.mp3", marks.folg + 0.95, 0.3, 0.8, 11),
];
html = html.replace(
  /<!--CUES-->[\s\S]*?<!--\/CUES-->/,
  `<!--CUES-->\n      ${cues.join("\n      ")}\n      <!--/CUES-->`,
);
writeFileSync(indexPath, html);
console.log(`${words.length} words, marks ${JSON.stringify(marks)}`);
