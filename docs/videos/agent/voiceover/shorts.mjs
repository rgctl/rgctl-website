#!/usr/bin/env node
/**
 * Render native vertical 9:16 shorts from the agent transcripts.
 *
 *   pnpm voiceover:shorts -- --slug blast-radius-analysis --publish
 *   pnpm voiceover:shorts:all
 *
 * Unlike a crop of the 16:9 guide, the short has its own 1080x1920 layout:
 * a persistent "Why it matters" block at the top, chat only, one rgctl
 * command in a bottom EVIDENCE box, and short-specific intro/outro frames.
 * Audio comes from the composed final guide (or an explicit --audio).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { renderTimeline } from "../automation/lib/video.mjs";

const base = path.dirname(fileURLToPath(import.meta.url));
const agentDir = path.resolve(base, "..");
const argv = process.argv.slice(2);
const finalDir = path.resolve(option("--final-dir", path.join(agentDir, "recordings", "socials")));
const shortsDir = path.resolve(option("--out-dir", path.join(agentDir, "recordings", "socials", "shorts")));
const manifestPath = path.join(shortsDir, "manifest.json");
const questionLimit = Math.max(1, Number(option("--questions", "2")));
const force = argv.includes("--force");
const publish = argv.includes("--publish");
const silent = argv.includes("--silent");
const all = argv.includes("--all") || !option("--slug");

function option(name, fallback = "") {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[index + 1] : fallback;
}
function die(message) { console.error(`shorts: ${message}`); process.exit(1); }
function loadJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf8"));
}
function ffprobe(file, entries) {
  const result = spawnSync("ffprobe", ["-v", "error", "-show_entries", entries, "-of", "csv=p=0", file], { encoding: "utf8" });
  if (result.status !== 0) die(`ffprobe failed: ${file}`);
  return result.stdout.trim();
}
function durationOf(file) { return Number(ffprobe(file, "format=duration")); }

const agent = loadJson(path.join(agentDir, "manifest.json"), { scripts: [] });
const agentBySlug = new Map((agent.scripts ?? []).map((entry) => [entry.slug, entry]));
const shortsManifest = loadJson(manifestPath, { schemaVersion: 1, scripts: [] });

/**
 * Keep the first N question blocks. Tool events are retained so the command
 * box updates at the same point the command ran in the original session.
 */
function shortTimeline(slug) {
  const transcriptPath = path.join(agentDir, "transcripts", `${slug}.json`);
  if (!existsSync(transcriptPath)) return null;
  const transcript = loadJson(transcriptPath, {});
  const source = transcript.events ?? [];
  const events = [];
  let questions = 0;

  for (const event of source) {
    if (event.type === "user") {
      if (questions >= questionLimit) break;
      questions += 1;
      events.push(event);
      continue;
    }
    if (questions > 0) events.push(event);
  }

  const firstCaption = events.find((event) => event.caption)?.caption;
  const entry = agentBySlug.get(slug);
  return {
    meta: {
      slug,
      title: entry?.title ?? transcript.title ?? slug,
      guide: entry?.guide ?? transcript.guide ?? "",
      fixture: entry?.fixture ?? transcript.fixture ?? "",
      theme: "short",
      agent: transcript.agent ?? "claude",
      agentLabel: "Claude Code · DeepSeek",
      model: transcript.model ?? "deepseek-flash",
      questionCount: questions,
      pauseMs: 900,
      endPauseMs: 900,
      introMs: 2200,
      outroMs: 2800,
      captionTitle: firstCaption?.title || "Graph-backed answers, not text matches",
      captionBody: firstCaption?.body || "Resolved symbols and callers, not lines that happen to match.",
      shortGuide: "A coding agent answers one question with the graph.",
      shortHook: "One question. A graph-backed answer.",
    },
    events,
  };
}

function audioFor(slug) {
  const explicit = option("--audio");
  if (explicit) return path.resolve(explicit);
  for (const candidate of [
    path.join(finalDir, `${slug}.mp4`),
    path.join(base, "sound", `${slug}.mp3`),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function muxAudio(video, audio, output) {
  const duration = durationOf(video);
  const args = [
    "-y", "-i", video, "-i", audio,
    "-map", "0:v", "-map", "1:a",
    "-c:v", "copy",
    "-af", "apad",
    "-c:a", "aac", "-b:a", "192k",
    "-t", duration.toFixed(3),
    "-movflags", "+faststart",
    output,
  ];
  const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (result.status !== 0) die(`ffmpeg audio mux failed for ${output}`);
}

const slugs = all
  ? (agent.scripts ?? []).filter((entry) => entry.slug !== "full-demo" && entry.status === "recorded").map((entry) => entry.slug).sort()
  : [option("--slug")];

if (!slugs.length) die("no guides selected");
mkdirSync(shortsDir, { recursive: true });
let built = 0;

for (const slug of slugs) {
  if (slug === "cli-command-reference") {
    console.warn(`${slug}: no agent transcript for the VHS walkthrough, skipping`);
    continue;
  }
  const timeline = shortTimeline(slug);
  if (!timeline) {
    if (all) {
      console.warn(`${slug}: no transcript, skipping`);
      continue;
    }
    die(`${slug}: no transcript at docs/videos/agent/transcripts/${slug}.json`);
  }
  if (!timeline.events.length) die(`${slug}: transcript has no question events`);

  const output = path.join(shortsDir, `${slug}.mp4`);
  if (!force && existsSync(output)) {
    console.log(`${slug}: short exists, skipping (use --force)`);
    continue;
  }

  const audio = silent ? null : audioFor(slug);
  if (!audio && !silent) die(`${slug}: no final guide or voiceover audio; run voiceover:compose first (or pass --silent)`);

  const silentPath = path.join(shortsDir, `.${slug}.silent.mp4`);
  mkdirSync(shortsDir, { recursive: true });
  const shortConfig = {
    DEMO_VIEWPORT_WIDTH: "1080",
    DEMO_VIEWPORT_HEIGHT: "1920",
    DEMO_VIDEO_CRF: "18",
    DEMO_VIDEO_BITRATE: "6M",
    DEMO_TIMEOUT_MS: "180000",
    DEMO_WORK_DIR: path.join(agentDir, ".work"),
    DEMO_INTRO_MS: String(timeline.meta.introMs),
    DEMO_OUTRO_MS: String(timeline.meta.outroMs),
    DEMO_PAUSE_MS: String(timeline.meta.pauseMs),
    DEMO_END_PAUSE_MS: String(timeline.meta.endPauseMs),
  };

  console.log(`${slug}: rendering native 1080x1920 (${timeline.meta.questionCount} question(s))`);
  await renderTimeline({
    timeline,
    slug: `${slug}-short`,
    output: silentPath,
    config: shortConfig,
    baseDir: agentDir,
  });

  if (audio) muxAudio(silentPath, audio, output);
  else {
    const result = spawnSync("ffmpeg", ["-y", "-i", silentPath, "-c", "copy", "-movflags", "+faststart", output], { stdio: "inherit" });
    if (result.status !== 0) die(`ffmpeg copy failed for ${slug}`);
  }
  rmSync(silentPath, { force: true });

  const commands = timeline.events
    .filter((event) => event.type === "tool" && /^\s*rgctl\b/.test(String(event.input?.command ?? "")))
    .map((event) => String(event.input.command).split(/\r?\n/)[0].replace(/\s*2>&1.*$/, "").trim())
    .filter((command, index, list) => list.indexOf(command) === index)
    .slice(0, 8);

  const data = {
    slug,
    title: timeline.meta.title,
    status: "short",
    video: path.relative(shortsDir, output),
    audio: audio ? path.relative(path.dirname(shortsDir), audio) : null,
    layout: "vertical-native",
    template: "short.html",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    questions: timeline.meta.questionCount,
    durationSec: Number(durationOf(output).toFixed(2)),
    commands,
    platforms: ["YouTube Shorts", "TikTok", "Instagram Reels"],
    hashtags: ["#rgctl", "#codeintelligence", "#devtools", "#ai"],
    description: `${timeline.meta.title} — a coding agent using rgctl, the code knowledge graph for AI agents.`,
    generatedAt: new Date().toISOString(),
  };

  const scripts = shortsManifest.scripts ?? [];
  const index = scripts.findIndex((item) => item.slug === slug);
  if (index >= 0) scripts[index] = { ...scripts[index], ...data };
  else scripts.push(data);
  shortsManifest.schemaVersion = 1;
  shortsManifest.scripts = scripts;
  shortsManifest.updatedAt = new Date().toISOString();
  built += 1;
  console.log(`${slug}: wrote ${path.relative(process.cwd(), output)} (${data.durationSec}s${audio ? ", with audio" : ", silent"})`);
}

if (publish) {
  writeFileSync(manifestPath, `${JSON.stringify(shortsManifest, null, 2)}\n`);
  console.log(`Updated ${path.relative(process.cwd(), manifestPath)}`);
}
console.log(`Shorts complete: ${built} file(s).`);
