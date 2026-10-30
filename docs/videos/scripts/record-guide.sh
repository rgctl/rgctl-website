#!/usr/bin/env bash
# Record one guide VHS tape (no captions).
#
#   ./docs/videos/scripts/prep-coolstore.sh
#   ./docs/videos/scripts/record-guide.sh blast-radius-analysis
#
# Outputs:
#   docs/videos/guides/<slug>-no-captions.{gif,mp4}
set -euo pipefail

SITE="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$SITE"

SLUG="${1:-}"
if [[ -z "$SLUG" ]]; then
  echo "usage: $0 <guide-slug>" >&2
  echo "slugs:" >&2
  jq -r '.guides[].slug' docs/videos/guides/manifest.json >&2
  exit 1
fi

TAPE="$SITE/docs/videos/guides/${SLUG}.tape"
OUT_GIF="$SITE/docs/videos/guides/${SLUG}-no-captions.gif"
OUT_MP4="$SITE/docs/videos/guides/${SLUG}-no-captions.mp4"

if [[ ! -f "$TAPE" ]]; then
  echo "error: missing $TAPE — run: node docs/videos/scripts/gen-guide-tapes.mjs $SLUG" >&2
  exit 1
fi

if ! command -v vhs >/dev/null 2>&1; then
  echo "error: vhs not found (brew install vhs)" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq not found" >&2
  exit 1
fi

# Prefer product-repo release binary.
for c in "${RGCTL_REPO:-}" "$SITE/../rbuilder" "$SITE/../rgctl"; do
  [[ -z "$c" ]] && continue
  if [[ -x "$c/target/release/rgctl" ]]; then
    export PATH="$(cd "$c" && pwd)/target/release:$PATH"
    break
  fi
done
if ! command -v rgctl >/dev/null 2>&1; then
  echo "error: rgctl not on PATH — build release bin or set RGCTL_REPO" >&2
  exit 1
fi

if [[ ! -e "$SITE/docs/videos/.work/coolstore" && "$SLUG" != "markdown-context-graph" ]]; then
  echo "error: missing docs/videos/.work/coolstore — run prep-coolstore.sh first" >&2
  exit 1
fi

if [[ "$SLUG" != "markdown-context-graph" && "$SLUG" != "discovering-and-indexing" && -d "$SITE/docs/videos/.work/.rgctl.golden" ]]; then
  mkdir -p "$SITE/docs/videos/.work/coolstore/.rgctl"
  rsync -a --delete "$SITE/docs/videos/.work/.rgctl.golden/" "$SITE/docs/videos/.work/coolstore/.rgctl/"
fi

if [[ "$SLUG" == "pr-review" ]]; then
  python3 - "$SITE/docs/videos/.work/coolstore/src/main/java/com/redhat/coolstore/service/ShoppingCartService.java" <<'PY'
import sys
from pathlib import Path
p = Path(sys.argv[1])
s = p.read_text()
target = "initShoppingCartForPricing(sc);"
replacement = 'initShoppingCartForPricing(sc);\n            getProduct("329299");'
if replacement not in s and target in s:
    p.write_text(s.replace(target, replacement, 1))
PY
fi

echo "==> rgctl: $(command -v rgctl) ($(rgctl --version))"
echo "==> validating $TAPE"
vhs validate "$TAPE"
echo "==> recording $SLUG"
vhs "$TAPE"

if [[ "$SLUG" == "pr-review" ]]; then
  (cd "$SITE/docs/videos/.work/coolstore" && git checkout -- src/main/java/com/redhat/coolstore/service/ShoppingCartService.java 2>/dev/null || true)
fi

if [[ ("$SLUG" == "discovering-and-indexing" || "$SLUG" == "watch-mode") && -d "$SITE/docs/videos/.work/.rgctl.golden" ]]; then
  mkdir -p "$SITE/docs/videos/.work/coolstore/.rgctl"
  rsync -a --delete "$SITE/docs/videos/.work/.rgctl.golden/" "$SITE/docs/videos/.work/coolstore/.rgctl/"
fi

echo "==> wrote:"
ls -lh "$OUT_GIF" "$OUT_MP4" 2>/dev/null || ls -lh "docs/videos/guides/${SLUG}"*
