# rgctl-website

Marketing site, docs hub, and **user-facing feature guides** for [rgctl](https://github.com/rgctl/rgctl).

Live: [https://rgctl.io/](https://rgctl.io/)

## Layout

| Path | Role |
|------|------|
| `src/` | Next.js App Router (static export) |
| `docs/guides/` | **SSOT** for feature guides (also published under `/docs/guides/`) |
| `docs/videos/` | Homepage CLI demo + per-guide VHS tapes (`docs/videos/README.md`) |
| `scripts/copy-*.mjs` | Prebuild: assemble `content/docs`, language catalog, demos |
| `vendor/install.sh` | Fallback install script if product repo is unavailable |

Non-guide reference docs (`Introduction`, `user-guide`, `json-api`, …), `AGENTS.md`, and `*-ast-coverage.json` are pulled at build time from the **rgctl** product repo via `RGCTL_REPO` (default: sibling `../rgctl` or `../rbuilder`).

## Develop

```bash
# From a sibling checkout layout:
#   ~/git/rust/rgctl          (or rbuilder)
#   ~/git/rust/rgctl-website

pnpm install
cp .env.example .env.local   # optional GA
pnpm dev
```

Open http://localhost:3000

Override the product repo path:

```bash
RGCTL_REPO=/path/to/rgctl pnpm build
```

## Build / deploy

```bash
pnpm build   # → ./out (apex https://rgctl.io)
```

GitHub Actions: `.github/workflows/website.yml` (Pages → `https://rgctl.io/`).

## Editing guides

Edit markdown under **`docs/guides/`** in this repository. Links from the product repo (`rgctl/rgctl`) should point at `https://rgctl.io/docs/guides/…` rather than in-tree paths.
