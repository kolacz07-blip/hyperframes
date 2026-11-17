// Generates the German voiceover with ElevenLabs (word timings included),
// then re-times captions, camera and sound to it.
//
//   NODE_USE_ENV_PROXY=1 node tools/voice.mjs [--voice <voice_id>] [--tempo 1.1]
//   (NODE_USE_ENV_PROXY routes fetch through the HTTPS proxy in cloud sessions)
//
// The API key is injected by the session's network proxy (or read from
// ELEVENLABS_API_KEY when run elsewhere).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const voiceId = args.includes("--voice")
  ? args[args.indexOf("--voice") + 1]
  : "JBFqnCBsd6RMkjVDRZzb";
const OFFSET = 0.3; // the voice starts this far into the film
// speed-up applied with ffmpeg atempo (pitch kept); word timings are scaled to match
const TEMPO = args.includes("--tempo") ? parseFloat(args[args.indexOf("--tempo") + 1]) : 1.1;
const script = JSON.parse(readFileSync(join(root, "script.json"), "utf8"));

// one call for the whole script keeps the delivery natural; a blank line between
// lines gives the narrator a breath
const text = script.lines.map((l) => l.text).join("\n\n");
const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY || "proxy-injected",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      language_code: "de",
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, speed: 1.0 },
    }),
  },
);
if (!res.ok) {
  console.error(`ElevenLabs ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const data = await res.json();
mkdirSync(join(root, "assets/voice"), { recursive: true });
const raw = join(root, "assets/voice/voice-raw.mp3");
writeFileSync(raw, Buffer.from(data.audio_base64, "base64"));

// characters -> words
const {
  characters: ch,
  character_start_times_seconds: cs,
  character_end_times_seconds: ce,
} = data.alignment;
const words = [];
let cur = null;
for (let i = 0; i < ch.length; i++) {
  if (/\s/.test(ch[i])) {
    if (cur) words.push(cur);
    cur = null;
    continue;
  }
  if (!cur) cur = { text: "", start: cs[i], end: ce[i] };
  cur.text += ch[i];
  cur.end = ce[i];
}
if (cur) words.push(cur);
const spoken = words
  .filter((w) => w.text !== "–")
  .map((w) => ({
    text: w.text,
    start: +(w.start / TEMPO + OFFSET).toFixed(3),
    end: +(w.end / TEMPO + OFFSET).toFixed(3),
  }));
writeFileSync(
  join(root, "assets/voice/words.json"),
  JSON.stringify({ voice_id: voiceId, offset: OFFSET, tempo: TEMPO, words: spoken }, null, 2),
);

// loudness-normalise the voice to sit around -16 LUFS with -1.5 dBTP headroom
// mono 64 kb/s keeps the file under the repo's 500 KB non-LFS limit
const out = join(root, "assets/voice/voice.mp3");
execFileSync("ffmpeg", [
  "-y",
  "-loglevel",
  "error",
  "-i",
  raw,
  "-af",
  `atempo=${TEMPO},loudnorm=I=-16:TP=-1.5:LRA=9`,
  "-ar",
  "44100",
  "-ac",
  "1",
  "-b:a",
  "64k",
  out,
]);
const dur = parseFloat(
  execFileSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    out,
  ]).toString(),
);

// film length follows the voice: last word + a 3 s hold for the closing line
const last = spoken[spoken.length - 1].end;
script.duration = Math.max(15, Math.ceil((last + 3.2) * 10) / 10);
writeFileSync(join(root, "script.json"), JSON.stringify(script, null, 2) + "\n");

// voice <audio> in index.html
const indexPath = join(root, "index.html");
let index = readFileSync(indexPath, "utf8");
const tag = `<audio id="voice" class="clip" src="assets/voice/voice.mp3" data-start="${OFFSET}" data-duration="${dur.toFixed(2)}" data-track-index="9" data-volume="1"></audio>`;
index = index.replace(/<audio id="voice"[^>]*><\/audio>|<!--VOICE-->/, tag);
writeFileSync(indexPath, index);

console.log(`voice: ${dur.toFixed(2)} s, ${spoken.length} words, film ${script.duration} s`);
execFileSync("node", [join(root, "tools/build.mjs")], { stdio: "inherit" });
