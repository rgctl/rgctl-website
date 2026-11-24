#!/usr/bin/env node
/**
 * Build voiceover audio for the guide videos with the ElevenLabs CLI.
 *
 *   pnpm voiceover:build -- --slug blast-radius-analysis --publish
 *   pnpm voiceover:build:all
 *   pnpm voiceover:build -- --slug blast-radius-analysis --dry-run
 *   pnpm voiceover:build -- --slug blast-radius-analysis --mock
 *
 * The markdown script is the source of truth. Each Intro / Beat / Outro
 * blockquote is synthesized as its own stem, the stems are joined with a
 * short pause, and the combined MP3 lands in sound/<slug>.mp3.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { loadEnv, number, value } from "../automation/lib/env.mjs";
import { speakable } from "./speakable.mjs";

const base = path.dirname(fileURLToPath(import.meta.url));
const scriptDir = path.join(base, "script");
const env = loadEnv(path.join(base, ".env.voiceover"));
const argv = process.argv.slice(2);

function flag(name) {
  return argv.includes(name);
}
function option(name, fallback = "") {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--")
    ? argv[index + 1]
    : fallback;
}

const dryRun = flag("--dry-run");
const mock = flag("--mock");
const force = flag("--force");
const publish = flag("--publish");
const slugOption = option("--slug");
const all = flag("--all") || !slugOption;
const gapMs = number(env, "VOICEOVER_GAP_MS", 350);
const outDir = path.resolve(option("--out-dir", path.join(base, "sound")));
const manifestPath = path.join(base, "manifest.json");
const voiceId = value(env, "ELEVENLABS_VOICE_ID", "");
const model = value(env, "ELEVENLABS_MODEL", "eleven_multilingual_v2");
const outputFormat = value(env, "ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128");

function die(message) {
  console.error(`voiceover: ${message}`);
  process.exit(1);
}

function loadManifest() {
  if (!existsSync(manifestPath)) return { schemaVersion: 1, scripts: [] };
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function parseSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  let current = null;

  const finish = () => {
    if (!current) return;
    const body = current.lines.join(" ").replace(/\s+/g, " ").trim();
    if (body) sections.push({ key: current.key, label: current.label, text: body });
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^##\s+Intro\b/i.test(line)) {
      finish();
      current = { key: "intro", label: "Intro", lines: [] };
      continue;
    }
    if (/^##\s+Walkthrough\b/i.test(line)) {
      finish();
      continue;
    }
    if (/^##\s+Outro\b/i.test(line)) {
      finish();
      current = { key: "outro", label: "Outro", lines: [] };
      continue;
    }
    if (/^###\s+Beat\s+(\d+)/i.test(line)) {
      finish();
      const n = line.match(/^###\s+Beat\s+(\d+)\s*[—-]\s*(.*)$/i);
      current = {
        key: `beat-${n?.[1] ?? sections.length + 1}`,
        label: n?.[2] || `Beat ${n?.[1] ?? ""}`,
        lines: [],
      };
      continue;
    }
    if (/^##\s+/.test(line)) {
      finish();
      continue;
    }
    if (current && /^>\s?/.test(line)) {
      const body = line.replace(/^>\s?/, "").trim();
      if (body) current.lines.push(body);
    }
  }
  finish();
  return sections;
}

function cleanForSpeech(text) {
  const plain = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return speakable(plain);
}

function scriptsToBuild() {
  const scripts = readdirSync(scriptDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.slice(0, -3))
    .sort();
  if (slugOption) {
    if (!scripts.includes(slugOption)) die(`no voiceover script for ${slugOption}`);
    return [slugOption];
  }
  if (!all) die("pass --slug <slug> or --all");
  return scripts;
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    stdio: ["pipe", "inherit", "inherit"],
    ...opts,
  });
  if (result.error) die(`${command} failed: ${result.error.message}`);
  if (result.status !== 0) die(`${command} exited ${result.status}`);
  return result;
}

function resolveCli() {
  const configured = value(env, "ELEVENLABS_CLI", "").trim();
  if (configured) return { command: configured, prefix: [] };
  const local = spawnSync("elevenlabs", ["--version"], { stdio: "ignore" });
  if (!local.error && local.status === 0) return { command: "elevenlabs", prefix: [] };
  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    prefix: ["--yes", "@elevenlabs/cli@1.13.0"],
  };
}

let cli = null;
let apiKey = "";
function ensureApi() {
  if (cli) return;
  apiKey = value(env, "ELEVENLABS_API_KEY", "");
  if (!apiKey) die("ELEVENLABS_API_KEY is not set in docs/videos/agent/voiceover/.env.voiceover");
  if (!voiceId) die("ELEVENLABS_VOICE_ID is not set in docs/videos/agent/voiceover/.env.voiceover");
  const ffmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (ffmpeg.error || ffmpeg.status !== 0) die("ffmpeg is required");
  cli = resolveCli();
}

function ffprobeDuration(file) {
  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  if (result.status !== 0) die(`ffprobe failed for ${file}`);
  const duration = Number(result.stdout.trim());
  return Number.isFinite(duration) ? duration : 0;
}

function silence(file, seconds) {
  run("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
    "-t", seconds.toFixed(3),
    "-c:a", "libmp3lame", "-b:a", "128k",
    file,
  ], { stdio: "ignore" });
}

function synthesizeMock(text, out) {
  const words = text.split(/\s+/).filter(Boolean).length;
  silence(out, Math.max(1.2, words / 2.5));
}

function synthesizeElevenLabs(text, out) {
  ensureApi();
  const args = [
    ...cli.prefix,
    "say", "-",
    "--voice", voiceId,
    "--model", model,
    "--output-format", outputFormat,
    "--output", out,
  ];
  run(cli.command, args, {
    input: text,
    env: { ...process.env, ELEVENLABS_API_KEY: apiKey },
  });
  if (!existsSync(out) || statSync(out).size === 0) die(`ElevenLabs CLI did not write ${out}`);
}

function combine(slug, sectionFiles, directory) {
  const concatParts = [];
  for (let i = 0; i < sectionFiles.length; i++) {
    concatParts.push(sectionFiles[i].file);
    if (i < sectionFiles.length - 1 && gapMs > 0) concatParts.push(path.join(directory, "silence.mp3"));
  }
  const filter = concatParts.map((_, index) => `[${index}:a]`).join("")
    + `concat=n=${concatParts.length}:v=0:a=1[out]`;
  const args = ["-y"];
  for (const file of concatParts) args.push("-i", file);
  const output = path.join(outDir, `${slug}.mp3`);
  args.push("-filter_complex", filter, "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", output);
  run("ffmpeg", args, { stdio: "ignore" });
  return output;
}

function writeManifest(manifest, slug, data) {
  const scripts = Array.isArray(manifest.scripts) ? manifest.scripts : [];
  const index = scripts.findIndex((entry) => entry.slug === slug);
  const next = { ...scripts[index], ...data };
  if (index >= 0) scripts[index] = next;
  else scripts.push(next);
  manifest.schemaVersion = 1;
  manifest.scripts = scripts;
  manifest.updatedAt = new Date().toISOString();
  manifest.voice = { id: voiceId, model, outputFormat };
}

const requested = scriptsToBuild();
mkdirSync(outDir, { recursive: true });
const manifest = loadManifest();
let built = 0;

for (const slug of requested) {
  const text = readFileSync(path.join(scriptDir, `${slug}.md`), "utf8");
  const sections = parseSections(text);
  if (!sections.length) die(`${slug}: no Intro/Beat/Outro blockquotes found`);

  if (dryRun) {
    console.log(`${slug}: ${sections.length} sections`);
    for (const section of sections) {
      console.log(`  ${section.key.padEnd(7)} ${cleanForSpeech(section.text).slice(0, 90)}`);
    }
    continue;
  }

  const directory = path.join(outDir, slug);
  const finalPath = path.join(outDir, `${slug}.mp3`);
  if (!force && existsSync(finalPath) && existsSync(path.join(directory, "00-intro.mp3"))) {
    console.log(`${slug}: exists, skipping (use --force)`);
    continue;
  }

  mkdirSync(directory, { recursive: true });
  silence(path.join(directory, "silence.mp3"), gapMs / 1000);

  const sectionFiles = [];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const prefix = String(i + 1).padStart(2, "0");
    const file = path.join(directory, `${prefix}-${section.key}.mp3`);
    const speech = cleanForSpeech(section.text);
    console.log(`${slug}: ${section.key} (${speech.split(/\s+/).length} words)`);
    if (mock) synthesizeMock(speech, file);
    else synthesizeElevenLabs(speech, file);
    sectionFiles.push({ file, section });
  }

  const combined = combine(slug, sectionFiles, directory);
  const durationSec = ffprobeDuration(combined);
  const timeline = [];
  let cursor = 0;
  for (let i = 0; i < sectionFiles.length; i++) {
    const duration = ffprobeDuration(sectionFiles[i].file);
    timeline.push({
      key: sectionFiles[i].section.key,
      label: sectionFiles[i].section.label,
      startSec: Number(cursor.toFixed(2)),
      endSec: Number((cursor + duration).toFixed(2)),
      durationSec: Number(duration.toFixed(2)),
      text: cleanForSpeech(sectionFiles[i].section.text),
    });
    cursor += duration + (i < sectionFiles.length - 1 ? gapMs / 1000 : 0);
  }

  writeManifest(manifest, slug, {
    slug,
    status: mock ? "mock" : "generated",
    script: `script/${slug}.md`,
    audio: path.relative(base, combined),
    durationSec: Number(durationSec.toFixed(2)),
    sections: timeline,
    voiceId,
    model,
    outputFormat,
    generatedAt: new Date().toISOString(),
  });
  built += 1;
  console.log(`${slug}: wrote ${path.relative(base, combined)} (${durationSec.toFixed(1)}s)`);
}

if (publish && !dryRun) {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Updated ${path.relative(base, manifestPath)}`);
}

console.log(dryRun ? "Dry run complete." : `Voiceover build complete: ${built} file(s).`);
