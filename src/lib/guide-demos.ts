import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type GuideDemoMeta = {
  slug: string;
  title: string;
  blurb: string;
};

type Manifest = {
  guides: GuideDemoMeta[];
  exclude?: string[];
};

let cached: Manifest | null = null;

function loadManifest(): Manifest {
  if (cached) return cached;
  const path = join(process.cwd(), "docs/videos/guides/manifest.json");
  if (!existsSync(path)) {
    cached = { guides: [] };
    return cached;
  }
  cached = JSON.parse(readFileSync(path, "utf8")) as Manifest;
  return cached;
}

/** Guide slugs that have a VHS demo defined (may not be recorded yet). */
export function listGuideDemoMetas(): GuideDemoMeta[] {
  return loadManifest().guides;
}

export function getGuideDemoMeta(slug: string): GuideDemoMeta | null {
  return listGuideDemoMetas().find((g) => g.slug === slug) ?? null;
}

/** True when the captioned MP4 is present for build-time embedding. */
export function guideDemoMp4Exists(slug: string): boolean {
  const candidates = [
    join(process.cwd(), "public/demos", `guide-${slug}.mp4`),
    join(process.cwd(), "docs/videos/guides", `${slug}.mp4`),
  ];
  return candidates.some((p) => existsSync(p));
}
