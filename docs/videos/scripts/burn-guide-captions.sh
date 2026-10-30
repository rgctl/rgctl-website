#!/usr/bin/env bash
# Burn SRT captions onto a guide recording.
#
#   ./docs/videos/scripts/burn-guide-captions.sh blast-radius-analysis
#
# Leaves <slug>-no-captions.mp4 untouched.
# Writes docs/videos/guides/<slug>.mp4 (captioned deliverable for the site).
set -euo pipefail

SITE="$(cd "$(dirname "$0")/../../.." && pwd)"
VID="$SITE/docs/videos/guides"
SLUG="${1:-}"

if [[ -z "$SLUG" ]]; then
  echo "usage: $0 <guide-slug>" >&2
  exit 1
fi

SRC="$VID/${SLUG}-no-captions.mp4"
SRT="$VID/${SLUG}.srt"
OUT="$VID/${SLUG}.mp4"

if [[ ! -f "$SRC" ]]; then
  echo "error: missing $SRC — record first: ./docs/videos/scripts/record-guide.sh $SLUG" >&2
  exit 1
fi
if [[ ! -f "$SRT" ]]; then
  echo "error: missing $SRT — run: node docs/videos/scripts/gen-guide-tapes.mjs $SLUG" >&2
  exit 1
fi

FFMPEG=ffmpeg
if [[ -x /opt/homebrew/opt/ffmpeg-full/bin/ffmpeg ]]; then
  FFMPEG=/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg
elif ! ffmpeg -filters 2>/dev/null | grep -q 'subtitles'; then
  echo "error: ffmpeg lacks subtitles filter — brew install ffmpeg-full" >&2
  exit 1
fi

cd "$VID"
"$FFMPEG" -y -i "${SLUG}-no-captions.mp4" \
  -vf "subtitles=filename=${SLUG}.srt:force_style='FontName=Menlo,FontSize=11,PrimaryColour=&H00FFFFFF&,OutlineColour=&H99000000&,BackColour=&H99000000&,BorderStyle=3,Outline=1,Shadow=0,MarginV=12,Alignment=2'" \
  -c:v libx264 -pix_fmt yuv420p -crf 20 \
  "${SLUG}.mp4"

echo "==> wrote $OUT"
ls -lh "$OUT" "$SRC"
