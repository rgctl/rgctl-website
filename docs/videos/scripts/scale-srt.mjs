#!/usr/bin/env node
/**
 * Scale an SRT file so the last cue ends at `durationSec`.
 * Usage: node scale-srt.mjs <in.srt> <durationSec> <out.srt>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, durationArg, outPath] = process.argv;
if (!inPath || !durationArg || !outPath) {
  console.error("usage: scale-srt.mjs <in.srt> <durationSec> <out.srt>");
  process.exit(1);
}

const targetMs = Math.max(500, Math.round(parseFloat(durationArg) * 1000));
const text = readFileSync(inPath, "utf8").replace(/\r\n/g, "\n").trim();
const blocks = text.split(/\n\n+/);

function parseTs(ts) {
  const m = ts.trim().match(/(\d+):(\d+):(\d+),(\d+)/);
  if (!m) return 0;
  return (
    (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000 + +m[4]
  );
}

function fmt(ms) {
  ms = Math.max(0, Math.round(ms));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

let maxEnd = 0;
const cues = [];
for (const block of blocks) {
  const lines = block.split("\n");
  if (lines.length < 3) continue;
  const timing = lines[1];
  const [a, b] = timing.split("-->").map((s) => s.trim());
  const start = parseTs(a);
  const end = parseTs(b);
  maxEnd = Math.max(maxEnd, end);
  cues.push({ idx: lines[0], start, end, body: lines.slice(2).join("\n") });
}

if (!cues.length || maxEnd <= 0) {
  writeFileSync(outPath, text + "\n");
  process.exit(0);
}

const scale = targetMs / maxEnd;
const out = cues
  .map((c, i) => {
    let start = Math.round(c.start * scale);
    let end = Math.round(c.end * scale);
    if (i === cues.length - 1) end = Math.min(targetMs, Math.max(end, targetMs - 40));
    if (end <= start) end = start + 200;
    return `${c.idx}\n${fmt(start)} --> ${fmt(end)}\n${c.body}`;
  })
  .join("\n\n");

writeFileSync(outPath, out + "\n");
console.log(
  `[scale-srt] ${cues.length} cues → ${targetMs}ms (scale ${scale.toFixed(3)})`,
);
