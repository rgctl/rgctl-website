#!/usr/bin/env bash
# Record + burn every CLI-friendly guide tape in manifest.json.
#
#   ./docs/videos/scripts/prep-coolstore.sh
#   ./docs/videos/scripts/record-all-guides.sh
#
# Env:
#   ONLY=slug1,slug2   — subset
#   SKIP_BURN=1        — record only
#   CONTINUE_ON_ERROR=1
set -euo pipefail

SITE="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$SITE"
SCRIPTS="$SITE/docs/videos/scripts"

if [[ -n "${ONLY:-}" ]]; then
  SLUG_LIST="${ONLY//,/ }"
else
  SLUG_LIST="$(jq -r '.guides[].slug' docs/videos/guides/manifest.json | tr '\n' ' ')"
fi

FAILED=""
for slug in $SLUG_LIST; do
  echo ""
  echo "======== $slug ========"
  if ! "$SCRIPTS/record-guide.sh" "$slug"; then
    FAILED="$FAILED $slug:record"
    [[ "${CONTINUE_ON_ERROR:-0}" == "1" ]] || exit 1
    continue
  fi
  if [[ "${SKIP_BURN:-0}" != "1" ]]; then
    if ! "$SCRIPTS/burn-guide-captions.sh" "$slug"; then
      FAILED="$FAILED $slug:burn"
      [[ "${CONTINUE_ON_ERROR:-0}" == "1" ]] || exit 1
    fi
  fi
done

echo ""
if [[ -n "$FAILED" ]]; then
  echo "failed:$FAILED" >&2
  exit 1
fi
echo "==> all guides recorded"
ls -lh docs/videos/guides/*.mp4 2>/dev/null | grep -v no-captions || true
