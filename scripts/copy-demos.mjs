/**
 * Copy demo media into public/demos/.
 * Prefer local docs/videos/, then RGCTL_REPO/docs/videos/ for the homepage CLI showcase.
 * Guide tapes live only in this repo under docs/videos/guides/<slug>.mp4.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
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
  ["docs/videos/user-guide-cli.gif", "user-guide-cli.gif"],
  ["docs/videos/user-guide-cli.mp4", "user-guide-cli.mp4"],
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

const guidesDir = join(siteRoot, "docs/videos/guides");
if (existsSync(guidesDir)) {
  for (const name of readdirSync(guidesDir)) {
    if (!name.endsWith(".mp4") || name.includes("-no-captions")) continue;
    const slug = name.replace(/\.mp4$/, "");
    const from = join(guidesDir, name);
    const destName = `guide-${slug}.mp4`;
    cpSync(from, join(destDir, destName));
    copied += 1;
    console.log(`[copy-demos] ${from} → public/demos/${destName}`);
  }
}

if (copied === 0) {
  console.warn(
    "[copy-demos] no demo media found — place files under docs/videos/ or set RGCTL_REPO",
  );
}
