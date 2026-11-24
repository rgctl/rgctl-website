#!/usr/bin/env node
/**
 * DeepSeek Text-to-Speech provider.
 *
 *   node docs/videos/agent/voiceover/deepseek-tts.mjs \
 *     --script docs/videos/agent/voiceover/short/blast-radius-analysis.md \
 *     --output docs/videos/agent/recordings/socials/shorts/blast-radius-analysis.voiceover.wav
 *
 * Calls POST https://api.deepseek.com/v1/tools/tts. DeepSeek currently exposes
 * two voices: stella (female, default) and tide (male). It does not support
 * speed or voice cloning.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, value } from "../automation/lib/env.mjs";
import { speakable } from "./speakable.mjs";

const base = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);

function option(name, fallback = "") {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
}
function die(message) { console.error(`deepseek-tts: ${message}`); process.exit(1); }

const input = option("--script") || option("--text-file");
const output = option("--output");
const voice = option("--voice", value(loadEnv(path.join(base, ".env.voiceover")), "DEEPSEEK_TTS_VOICE", "stella"));
if (!input || !output) die("usage: --script <file> --output <file.wav> [--voice stella|tide]");
if (!existsSync(input)) die(`script not found: ${input}`);

const voiceoverEnv = loadEnv(path.join(base, ".env.voiceover"));
const agentEnv = loadEnv(path.join(base, "..", ".env.demo.agent"));
const apiKey =
  value(voiceoverEnv, "DEEPSEEK_API_KEY") ||
  value(agentEnv, "DEEPSEEK_API_KEY") ||
  process.env.DEEPSEEK_API_KEY ||
  "";
if (!apiKey) die("DEEPSEEK_API_KEY is not set in .env.voiceover or .env.demo.agent");

let text = readFileSync(input, "utf8");
// If this is a full voiceover script, read only the spoken blockquotes. A
// short script can be plain prose.
if (/^##\s+Intro/m.test(text)) {
  const lines = [];
  for (const raw of text.split(/\r?\n/)) {
    if (/^>\s?/.test(raw)) lines.push(raw.replace(/^>\s?/, "").trim());
  }
  text = lines.filter(Boolean).join(" ");
}
text = text
  .replace(/^#.*$/gm, "")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/`([^`]+)`/g, "$1")
  .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
  .replace(/\s+/g, " ")
  .trim();
text = speakable(text);
if (!text) die("no speakable text found");

const endpoint = value(voiceoverEnv, "DEEPSEEK_TTS_URL", "https://api.deepseek.com/v1/tools/tts");
console.log(`deepseek-tts: ${text.split(/\s+/).length} words, voice ${voice}`);
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ text, voice_id: voice, format: "wav", filter_markdown: true }),
});
if (!response.ok) {
  const body = await response.text().catch(() => "");
  die(`DeepSeek TTS failed (${response.status}): ${body.slice(0, 500)}`);
}
const audio = Buffer.from(await response.arrayBuffer());
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, audio);
console.log(`deepseek-tts: wrote ${output} (${audio.length} bytes)`);
