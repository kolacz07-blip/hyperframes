#!/usr/bin/env bash
# Cover for TikTok: the frame where the strip lands ("Heute: X") + a "TEIL N" badge
# + a plate with the symptom question that also hides the burned-in caption.
#   bash .claude/skills/autoteile-video/scripts/cover/make-cover.sh <video.mp4> <N> "<symptom>" <out.png> [seconds]
set -euo pipefail
video="$1"; n="$2"; symptom="$3"; out="$4"; at="${5:-1.6}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
ffmpeg -loglevel error -y -ss "$at" -i "$video" -frames:v 1 "$tmp/frame.png"
python3 -c "import sys;s=open(sys.argv[1]).read().replace('__N__',sys.argv[2]).replace('__SYMPTOM__',sys.argv[3]);open(sys.argv[4],'w').write(s)" "$here/cover.html" "$n" "$symptom" "$tmp/cover.html"
cat > "$tmp/shot.cjs" <<'JS'
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto("file://" + __dirname + "/cover.html");
  await p.waitForTimeout(1500);
  await p.screenshot({ path: process.argv[2] });
  await b.close();
})();
JS
node "$tmp/shot.cjs" "$(realpath -m "$out")"
rm -rf "$tmp"
echo "cover: $out"
