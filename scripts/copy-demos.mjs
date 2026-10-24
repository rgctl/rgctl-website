/**
 * Copy demo media into public/demos/.
 * Prefer local docs/videos/, then RGCTL_REPO/docs/videos/.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, "..");
const destDir = join(siteRoot, "public/demos");

function resolveRgctlRepo() {
  const candidates = [
    process.env.RGCTL_REPO,
    join(siteRoot, "../rgctl"),
    join(siteRoot, "../rbuilder"),
  ].filter(Boolean);
  for (const c of candidates) {
    const abs = resolve(c);
    if (existsSync(join(abs, "docs/videos"))) return abs;
  }
  return null;
}

mkdirSync(destDir, { recursive: true });

const files = [
  ["docs/videos/user-guide-cli-no-captions.gif", "user-guide-cli.gif"],
  ["docs/videos/user-guide-cli.mp4", "user-guide-cli.mp4"],
  ["docs/videos/rgctl-feature-demo.mp4", "feature-demo.mp4"],
];

const rgctlRepo = resolveRgctlRepo();
const roots = [siteRoot, rgctlRepo].filter(Boolean);

let copied = 0;
for (const [rel, name] of files) {
  let from = null;
  for (const root of roots) {
    const candidate = join(root, rel);
    if (existsSync(candidate)) {
      from = candidate;
      break;
    }
  }
  if (!from) {
    console.warn(`[copy-demos] skip missing: ${rel}`);
    continue;
  }
  cpSync(from, join(destDir, name));
  copied += 1;
  console.log(`[copy-demos] ${from} → public/demos/${name}`);
}

if (copied === 0) {
  console.warn(
    "[copy-demos] no demo media found — place files under docs/videos/ or set RGCTL_REPO",
  );
}
