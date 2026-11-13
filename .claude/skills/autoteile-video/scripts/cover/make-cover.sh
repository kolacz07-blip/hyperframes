#!/usr/bin/env bash
# TikTok cover (1080x1920): a clean still of the part (captions hidden, after the strip has left),
# a "TEIL N" badge, the symptom question in two lines and the part name.
# All text stays inside y 260-1660, the area TikTok's profile grid keeps when it crops to ~3:4.
#   bash .claude/skills/autoteile-video/scripts/cover/make-cover.sh <project-dir> <seconds> <N> "<line 1>" "<line 2>" "<PART>" <out.png>
# e.g. make-cover.sh autoteile/stossdaempfer 3.4 3 "Wippt dein Auto" "nach?" "STOSSDÄMPFER" cover-teil3.png
# Pick <seconds> after the strip is gone (> 2 s) with no labels on screen; snapshot a few first.
set -euo pipefail
proj="$(realpath "$1")"; at="$2"; n="$3"; l1="$4"; l2="$5"; part="$6"; out="$(realpath -m "$7")"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
cp "$proj/index.html" "$tmp/index.bak"
trap 'cp "$tmp/index.bak" "$proj/index.html"; rm -rf "$tmp"' EXIT
sed -i 's/id="captions"/id="captions" data-hidden/' "$proj/index.html"
(cd "$proj" && npx --yes hyperframes@0.9.39 snapshot --at "$at" -o "$tmp/snap" >/dev/null 2>&1)
cp "$tmp"/snap/frame-00-*.png "$tmp/bg.png"
python3 -c "import sys;s=open(sys.argv[1]).read();[s:=s.replace(k,v) for k,v in zip(['__N__','__L1__','__L2__','__PART__'],sys.argv[2:6])];open(sys.argv[6],'w').write(s)" "$here/cover.html" "$n" "$l1" "$l2" "$part" "$tmp/cover.html"
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
node "$tmp/shot.cjs" "$out"
echo "cover: $out"
