#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadEnv, value } from "./lib/env.mjs";
import { parseScript } from "./lib/script.mjs";
import { renderMarkdown } from "./lib/markdown.mjs";
import { captionForTool } from "./lib/evidence-captions.mjs";
import { renderTimeline } from "./lib/video.mjs";
import { run as runClaude } from "./adapters/claude.mjs";
import { run as runMock } from "./adapters/mock.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(here, "..");
const websiteRoot = path.resolve(base, "../../..");

function usage() {
  console.log(`Usage: node docs/videos/agent/automation/record.mjs --slug <guide-slug> [options]

Options:
  --slug <slug>          Question script slug, e.g. blast-radius-analysis
  --agent <name>         claude (default) or mock
  --config <file>        Default: docs/videos/agent/.env.demo.agent
  --fixture <path>       Override DEMO_FIXTURE
  --fixture-label <text> Path label used in the transcript and for redaction
  --theme <name>         chat (default) or dashboard
  --out <file>           Output video; default .work/<slug>/<slug>.mp4
  --transcript <file>    Render an existing transcript instead of running an agent
  --publish              Write recordings/<slug>.mp4 + transcripts/<slug>.json and update manifest
  -h, --help             Show this help

Examples:
  node docs/videos/agent/automation/record.mjs --slug blast-radius-analysis --agent mock
  node docs/videos/agent/automation/record.mjs --slug blast-radius-analysis --agent claude --publish

Run docs/videos/agent/setup-demo.sh first. The agent must be able to see rgctl on PATH.`);
}

const args = {};
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === "-h" || arg === "--help") {
    usage();
    process.exit(0);
  }
  if (arg === "--publish") {
    args.publish = true;
    continue;
  }
  if (!arg.startsWith("--")) throw new Error(`Unknown argument: ${arg}`);
  const key = arg.slice(2);
  const next = process.argv[i + 1];
  if (!next || next.startsWith("--")) throw new Error(`Missing value for ${arg}`);
  args[key] = next;
  i += 1;
}

if (!args.slug) {
  usage();
  process.exit(2);
}
const configPath = path.resolve(process.cwd(), args.config || path.join(base, ".env.demo.agent"));
const config = loadEnv(configPath);
const agent = args.agent || value(config, "DEMO_AGENT", "claude");
if (args.publish && agent === "mock") {
  throw new Error("Mock recordings are smoke tests only; use --out, not --publish.");
}
const slug = args.slug;
const scriptPath = path.join(base, "scripts", `${slug}.md`);
if (!fs.existsSync(scriptPath)) {
  throw new Error(`No question script for "${slug}": ${scriptPath}`);
}

const parsed = parseScript(scriptPath);
const title = parsed.title.replace(/\s+—\s+Agent Question Script\s*$/, "").trim();
const questions = parsed.questions;

const rgctlRepo = path.resolve(websiteRoot, value(config, "DEMO_RGCTL_REPO", "../rbuilder"));
const fixtureArg = args.fixture || value(config, "DEMO_FIXTURE", "example/coolstore-weblogic");
const fixtureDir = path.isAbsolute(fixtureArg)
  ? fixtureArg
  : path.resolve(rgctlRepo, fixtureArg);
if (!fs.existsSync(fixtureDir)) {
  throw new Error(`Fixture not found: ${fixtureDir}. Run docs/videos/agent/setup-demo.sh first.`);
}
const fixtureLabel =
  args["fixture-label"] ||
  (path.isAbsolute(fixtureArg) ? path.relative(websiteRoot, fixtureDir) : fixtureArg);

const workDir = path.resolve(base, value(config, "DEMO_WORK_DIR", ".work"));
const outputDir = path.resolve(base, value(config, "DEMO_OUTPUT_DIR", "recordings"));
const transcriptDir = path.resolve(base, value(config, "DEMO_TRANSCRIPT_DIR", "transcripts"));
fs.mkdirSync(path.join(workDir, slug), { recursive: true });
fs.mkdirSync(transcriptDir, { recursive: true });

let transcript;
if (args.transcript) {
  const transcriptPath = path.resolve(process.cwd(), args.transcript);
  transcript = JSON.parse(fs.readFileSync(transcriptPath, "utf8"));
} else if (agent === "mock") {
  transcript = await runMock({ questions, config, fixtureDir, slug });
} else if (agent === "claude") {
  transcript = await runClaude({
    questions,
    config,
    fixtureDir,
    configDir: path.join(workDir, slug, "claude-config"),
  });
} else {
  throw new Error(
    `Agent "${agent}" is not implemented in this slice. Use --agent claude or --agent mock; the OpenCode config is ready in config/opencode.deepseek.json.`,
  );
}

function redactString(input) {
  return input
    .replaceAll(fixtureDir, fixtureLabel)
    .replaceAll(rgctlRepo, "..")
    .replaceAll(os.homedir(), "~")
    .replace(/\/private\/tmp\/claude-\d+\/\S+/g, "~/.claude/task")
    .replace(/-Users-[A-Za-z0-9._-]*rgctl-vid-[A-Za-z0-9._-]*/g, "fixture")
    .split("\n")
    .filter(
      (line) =>
        !line.includes("nvm is not compatible") &&
        !line.includes("unset npm_config_prefix"),
    )
    .join("\n");
}

function redact(value) {
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, redact(child)]));
  }
  return value;
}

const safeEvents = redact(transcript.events)
  .map((event) =>
    event.type === "assistant"
      ? { ...event, html: renderMarkdown(event.text) }
      : event,
  )
  .map((event) =>
    event.type === "tool" ? { ...event, caption: captionForTool(event) } : event,
  );

const { usage: _usage, costUsd: _costUsd, ...publicMeta } = transcript.meta ?? {};
const transcriptPayload = {
  slug,
  title,
  fixture: fixtureLabel,
  questions,
  events: safeEvents,
  meta: publicMeta,
};
const workTranscript = path.join(workDir, slug, "transcript.json");
fs.writeFileSync(workTranscript, JSON.stringify(transcriptPayload, null, 2) + "\n");

const output = args.publish
  ? path.join(outputDir, `${slug}.mp4`)
  : path.resolve(process.cwd(), args.out || path.join(workDir, slug, `${slug}.mp4`));

const timeline = {
  meta: {
    slug,
    title,
    fixture: fixtureLabel,
    guide: slug === "full-demo" ? "/demo/" : `/docs/guides/${slug}/`,
    theme: args.theme || value(config, "DEMO_THEME", "chat"),
    agent: publicMeta.agent || agent,
    agentLabel:
      (transcript.meta?.agent || agent) === "claude"
        ? "Claude Code · DeepSeek"
        : "Renderer test",
    model: publicMeta.model || value(config, "DEMO_MODEL", "default"),
    questionCount: questions.length,
  },
  events: safeEvents,
};

console.log(`Rendering ${title}`);
console.log(`  fixture: ${fixtureDir}`);
console.log(`  agent:   ${timeline.meta.agent} (${timeline.meta.model})`);
console.log(`  output:  ${output}`);
const rendered = await renderTimeline({
  timeline,
  slug,
  output,
  config,
  baseDir: base,
});
console.log(`Wrote ${rendered.output} (${rendered.duration.toFixed(1)}s)`);

if (args.publish) {
  const publishedTranscript = path.join(transcriptDir, `${slug}.json`);
  fs.writeFileSync(publishedTranscript, JSON.stringify(transcriptPayload, null, 2) + "\n");

  const manifestPath = path.join(base, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const entry = manifest.scripts.find((item) => item.slug === slug);
  if (!entry) throw new Error(`No manifest entry for ${slug}`);

  let version = "";
  try {
    version = execFileSync(value(config, "DEMO_RGCTL_BIN", "rgctl"), ["--version"], {
      encoding: "utf8",
    })
      .split(/\r?\n/)[0]
      .trim();
  } catch {
    version = "unknown";
  }

  let fixtureCommit = "unknown";
  try {
    fixtureCommit = execFileSync("git", ["-C", fixtureDir, "rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    fixtureCommit = "unknown";
  }

  entry.status = "recorded";
  entry.video = path.relative(base, rendered.output).split(path.sep).join("/");
  entry.transcript = `transcripts/${slug}.json`;
  entry.durationSec = Math.round(rendered.duration * 10) / 10;
  entry.recordedWith = timeline.meta.agent;
  entry.model = timeline.meta.model;
  entry.rgctlVersion = version;
  entry.fixtureCommit = fixtureCommit;
  entry.recordedAt = new Date().toISOString();

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  execFileSync(process.execPath, [path.join(base, "check.mjs")], { stdio: "inherit" });
}
