# Guide CLI demos (VHS)

Per-guide Charm VHS tapes for every **CLI-friendly** how-to under `docs/guides/`.
Deliverables live in this website repo and are copied into `public/demos/` at build time.

**Excluded (by design):**

- `cli-command-reference` — taxonomy doc; use the homepage CLI showcase
- `http-server-and-dashboard` — browser UI (Playwright / feature demo, not VHS)

**Fixture:** CoolStore (`example/coolstore` in the product repo), wired via `docs/videos/.work/`.
Markdown guide uses `tests/fixtures/markdown-context`. OSV guide uses `tests/fixtures/osv`.

---

## Pipeline

1. **Generate** `.tape` + developer-facing `.srt` captions from the scene catalog  
2. **Prep** CoolStore (discover + semantic) and symlink fixtures  
3. **Record** clean video (`*-no-captions.mp4`)  
4. **Burn** timed SRT → `guides/<slug>.mp4` (embedded at the top of each guide page)

```bash
# from rgctl-website root — product repo at ../rbuilder (or RGCTL_REPO)
cargo build --release --bin rgctl --manifest-path ../rbuilder/Cargo.toml

node docs/videos/scripts/gen-guide-tapes.mjs
./docs/videos/scripts/prep-coolstore.sh

# one guide
./docs/videos/scripts/record-guide.sh blast-radius-analysis
./docs/videos/scripts/burn-guide-captions.sh blast-radius-analysis

# all guides
./docs/videos/scripts/record-all-guides.sh
# subset: ONLY=structured-query,semantic-search ./docs/videos/scripts/record-all-guides.sh
```

Requires: `vhs`, `jq`, `ffmpeg` with `subtitles` (`brew install vhs jq ffmpeg-full`).

---

## Layout

| Path | Purpose |
|------|---------|
| `guides/manifest.json` | Slug catalog + needs (cfg / semantic / osv / …) |
| `guides/<slug>.tape` | VHS script (generated) |
| `guides/<slug>.srt` | Caption cues (generated; retime after first record if needed) |
| `guides/<slug>-no-captions.mp4` | Raw recording |
| `guides/<slug>.mp4` | Captioned deliverable → `public/demos/guide-<slug>.mp4` |
| `scripts/gen-guide-tapes.mjs` | Scene catalog → tape + srt |
| `scripts/prep-coolstore.sh` | Symlinks + CoolStore discover/semantic |
| `scripts/record-guide.sh` | `vhs` one slug |
| `scripts/burn-guide-captions.sh` | ffmpeg burn |
| `scripts/record-all-guides.sh` | Batch record + burn |
| `.work/` | Local symlinks (gitignored) |

---

## Site wiring

- `scripts/copy-demos.mjs` copies `docs/videos/guides/*.mp4` (captioned) into `public/demos/guide-<slug>.mp4`
- Guide pages (`/docs/guides/<slug>/`) render `<GuideDemo>` above the markdown when the MP4 exists

After recording, commit the captioned `guides/<slug>.mp4` files (skip bulky `*-no-captions.*` and `.gif` if desired — both are gitignored by default).

---

## Retiming captions

Generated `.srt` timings are estimates from typing length + `Sleep`. After a record:

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 \
  docs/videos/guides/blast-radius-analysis-no-captions.mp4
# edit docs/videos/guides/blast-radius-analysis.srt, then re-burn
./docs/videos/scripts/burn-guide-captions.sh blast-radius-analysis
```

To change commands or caption copy, edit `scripts/gen-guide-tapes.mjs` and regenerate.
