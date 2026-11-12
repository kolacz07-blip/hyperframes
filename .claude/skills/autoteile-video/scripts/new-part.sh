#!/usr/bin/env bash
# Creates a new auto-part video project from the template.
#
#   bash .claude/skills/autoteile-video/scripts/new-part.sh <slug> [target-root]
#
# <slug>        lowercase folder name, e.g. bremsscheibe
# [target-root] parent folder, default: autoteile (relative to the current directory)
set -euo pipefail
slug="${1:?usage: new-part.sh <slug> [target-root]}"
root="${2:-autoteile}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dest="$root/$slug"
if [ -e "$dest" ]; then
  echo "exists already: $dest" >&2
  exit 1
fi
mkdir -p "$dest"
cp -R "$here/template/." "$dest/"

# Three.js is vendored next to the project: the renderer's browser cannot reach CDNs.
tmp="$(mktemp -d)"
(cd "$tmp" && npm pack three@0.147.0 --silent >/dev/null && tar xzf three-0.147.0.tgz package/build/three.min.js package/LICENSE)
mkdir -p "$dest/assets/vendor"
cp "$tmp/package/build/three.min.js" "$dest/assets/vendor/three.min.js"
cp "$tmp/package/LICENSE" "$dest/assets/vendor/three-LICENSE"
rm -rf "$tmp"

# sound: bundled effects from the media-use skill, plus a generated low hum
sfx_src=""
for c in "skills/media-use/audio/assets/sfx" "$here/../../../skills/media-use/audio/assets/sfx" "$HOME/.claude/skills/media-use/audio/assets/sfx"; do
  if [ -f "$c/whoosh.mp3" ]; then sfx_src="$c"; break; fi
done
mkdir -p "$dest/assets/sfx" "$dest/assets/audio"
if [ -n "$sfx_src" ]; then
  cp "$sfx_src"/{whoosh-cinematic,whoosh,impact-bass-1,impact-bass-2,pop}.mp3 "$dest/assets/sfx/"
else
  echo "warning: media-use sfx not found; add whoosh-cinematic, whoosh, impact-bass-1/2 and pop mp3s to $dest/assets/sfx" >&2
fi
ffmpeg -y -loglevel error \
  -f lavfi -i "anoisesrc=color=brown:amplitude=0.6:seed=7:duration=14" \
  -f lavfi -i "sine=frequency=72:duration=14" -f lavfi -i "sine=frequency=144:duration=14" \
  -filter_complex "[0]lowpass=f=260,volume=0.9[n];[1]volume=0.55[a];[2]volume=0.18[b];[n][a][b]amix=inputs=3:normalize=0,tremolo=f=9:d=0.35,highpass=f=45,lowpass=f=900,afade=t=in:d=1.5,afade=t=out:st=12.5:d=1.5,loudnorm=I=-20:TP=-2" \
  -ar 48000 -ac 2 -b:a 96k "$dest/assets/audio/hum.mp3"

# project id/name
cat > "$dest/meta.json" <<EOF
{ "id": "$slug", "name": "$slug", "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)" }
EOF
sed -i "s/\"name\": \"radlager\"/\"name\": \"$slug\"/" "$dest/package.json"
echo "created $dest"
