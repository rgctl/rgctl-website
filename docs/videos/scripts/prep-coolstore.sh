#!/usr/bin/env bash
# Prepare CoolStore (+ fixtures) for guide VHS tapes.
#
# From website root:
#   ./docs/videos/scripts/prep-coolstore.sh
#
# Env:
#   RGCTL_REPO   — product repo (default: ../rbuilder or ../rgctl)
#   COOLSTORE    — CoolStore checkout (default: $RGCTL_REPO/example/coolstore)
#   SKIP_DISCOVER=1 — only wire symlinks / policy; skip discover + semantic
set -euo pipefail

SITE="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$SITE"

resolve_rgctl_repo() {
  if [[ -n "${RGCTL_REPO:-}" && -d "$RGCTL_REPO" ]]; then
    cd "$RGCTL_REPO" && pwd
    return
  fi
  for c in "$SITE/../rbuilder" "$SITE/../rgctl"; do
    if [[ -d "$c/docs" || -f "$c/AGENTS.md" ]]; then
      cd "$c" && pwd
      return
    fi
  done
  echo "error: set RGCTL_REPO to the rgctl product checkout" >&2
  exit 1
}

RGCTL_REPO="$(resolve_rgctl_repo)"
echo "==> RGCTL_REPO=$RGCTL_REPO"

if [[ -x "$RGCTL_REPO/target/release/rgctl" ]]; then
  export PATH="$RGCTL_REPO/target/release:$PATH"
elif ! command -v rgctl >/dev/null 2>&1; then
  echo "error: rgctl not found — cargo build --release --bin rgctl in $RGCTL_REPO" >&2
  exit 1
fi
echo "==> rgctl: $(command -v rgctl) ($(rgctl --version))"

COOLSTORE="${COOLSTORE:-}"
if [[ -z "$COOLSTORE" ]]; then
  for c in "$RGCTL_REPO/example/coolstore" "$RGCTL_REPO/example/coolstore-weblogic"; do
    if [[ -d "$c" ]]; then
      COOLSTORE="$c"
      break
    fi
  done
fi
if [[ -z "${COOLSTORE:-}" || ! -d "$COOLSTORE" ]]; then
  echo "error: CoolStore not found. Clone konveyor-ecosystem/coolstore into example/coolstore" >&2
  echo "  or set COOLSTORE=/path/to/coolstore" >&2
  exit 1
fi
COOLSTORE="$(cd "$COOLSTORE" && pwd)"
echo "==> CoolStore=$COOLSTORE"

WORK="$SITE/docs/videos/.work"
mkdir -p "$WORK"
ln -sfn "$COOLSTORE" "$WORK/coolstore"

OSV="$RGCTL_REPO/tests/fixtures/osv"
if [[ -d "$OSV" ]]; then
  ln -sfn "$OSV" "$WORK/osv"
else
  echo "warn: missing $OSV (vulnerability tape will fail)" >&2
fi

MD="$RGCTL_REPO/tests/fixtures/markdown-context"
if [[ -d "$MD" ]]; then
  ln -sfn "$MD" "$WORK/markdown-context"
else
  echo "warn: missing $MD (markdown-context tape will fail)" >&2
fi

POLICY="$RGCTL_REPO/rgctl-tests/rgctl-pr-policy.json"
if [[ -f "$POLICY" ]]; then
  cp -f "$POLICY" "$WORK/rgctl-pr-policy.json"
else
  echo "warn: missing $POLICY" >&2
fi

if [[ "${SKIP_DISCOVER:-0}" == "1" ]]; then
  echo "==> SKIP_DISCOVER=1 — symlinks only"
  ls -la "$WORK"
  exit 0
fi

echo "==> discover CoolStore (-l java --with-cfg --with-harmonic --export-migration-hints)"
(
  cd "$COOLSTORE"
  rgctl discover . -l java --with-cfg --with-harmonic --export-migration-hints
  echo "==> semantic index"
  rgctl semantic index
  rgctl -f json status | jq '{status, nodes, edges, schema_version}'
)

echo "==> ready:"
ls -la "$WORK"
