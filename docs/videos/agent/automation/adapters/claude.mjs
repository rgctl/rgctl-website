import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { number, value } from "../lib/env.mjs";

function toolContent(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.type === "text") return item.text;
        return JSON.stringify(item);
      })
      .filter(Boolean)
      .join("\n");
  }
  if (value == null) return "";
  return JSON.stringify(value, null, 2);
}

function parseLine(line, state) {
  const trimmed = line.trim();
  if (!trimmed) return;

  let event;
  try {
    event = JSON.parse(trimmed);
  } catch {
    state.stderr += `${trimmed}\n`;
    return;
  }

  if (event.type === "system" && event.subtype === "init") {
    state.sessionId = event.session_id ?? state.sessionId;
    state.model = event.model ?? state.model;
    return;
  }

  if (event.type === "assistant" && Array.isArray(event.message?.content)) {
    for (const block of event.message.content) {
      if (block.type === "text" && block.text?.trim()) {
        state.events.push({ type: "assistant", text: block.text.trim() });
      }
      if (block.type === "tool_use") {
        const tool = {
          type: "tool",
          id: block.id,
          name: block.name ?? "tool",
          input: block.input ?? {},
          output: null,
          status: "running",
        };
        state.tools.set(block.id, tool);
        state.events.push(tool);
      }
    }
    return;
  }

  if (event.type === "user" && Array.isArray(event.message?.content)) {
    for (const block of event.message.content) {
      if (block.type !== "tool_result") continue;
      const tool = state.tools.get(block.tool_use_id);
      if (!tool) continue;
      tool.output = toolContent(block.content);
      tool.status = block.is_error ? "error" : "ok";
    }
    return;
  }

  if (event.type === "result") {
    state.sessionId = event.session_id ?? state.sessionId;
    if (event.usage) state.usage = event.usage;
    if (typeof event.total_cost_usd === "number") state.costUsd = event.total_cost_usd;
    if (event.is_error) {
      state.resultError = event.result ?? "Claude Code returned an error";
    } else if (event.result?.trim()) {
      const hasText = state.events.some(
        (item) => item.type === "assistant" && item.text.trim().length > 0,
      );
      if (!hasText) state.events.push({ type: "assistant", text: event.result.trim() });
    }
  }
}

function runOne({ prompt, sessionId, isFirst, config, fixtureDir, configDir }) {
  return new Promise((resolve, reject) => {
    const bin = value(config, "CLAUDE_BIN", "claude");
    const args = [
      "-p",
      prompt,
      "--output-format",
      "stream-json",
      "--verbose",
    ];

    if (isFirst) args.push("--session-id", sessionId);
    else args.push("--resume", sessionId);

    const appendPrompt = value(config, "CLAUDE_APPEND_SYSTEM_PROMPT");
    if (appendPrompt) args.push("--append-system-prompt", appendPrompt);

    const configuredModel = value(config, "CLAUDE_MODEL", "deepseek-flash");
    const baseUrl = value(config, "CLAUDE_BASE_URL", "https://api.deepseek.com/anthropic");
    // Claude Code 2.1 rejects DeepSeek model ids. DeepSeek maps claude-haiku*
    // to deepseek-flash and claude-opus* to deepseek-v4-pro, so the haiku alias
    // keeps these recordings on Flash.
    const model =
      baseUrl.includes("api.deepseek.com") && configuredModel === "deepseek-flash"
        ? "claude-haiku-4-5"
        : configuredModel;
    const smallModel = model;
    if (model) args.push("--model", model);
    const budget = value(config, "CLAUDE_MAX_BUDGET_USD");
    if (budget) args.push("--max-budget-usd", budget);
    const permission = value(config, "CLAUDE_PERMISSION_MODE");
    if (permission) args.push("--permission-mode", permission);
    const allowed = value(config, "CLAUDE_ALLOWED_TOOLS");
    if (allowed) {
      args.push(
        "--allowedTools",
        ...allowed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      );
    }

    const apiKey = value(config, "CLAUDE_API_KEY") || value(config, "DEEPSEEK_API_KEY");
    if (!apiKey) {
      reject(
        new Error(
          "Missing DEEPSEEK_API_KEY. Add it to docs/videos/agent/.env.demo.agent before using --agent claude.",
        ),
      );
      return;
    }

    const claudeConfigDir =
      configDir || value(config, "CLAUDE_CONFIG_DIR", path.join(os.tmpdir(), "rgctl-claude-config"));
    fs.mkdirSync(claudeConfigDir, { recursive: true });

    const env = {
      ...process.env,
      CLAUDE_CONFIG_DIR: claudeConfigDir,
      ANTHROPIC_BASE_URL: value(
        config,
        "CLAUDE_BASE_URL",
        "https://api.deepseek.com/anthropic",
      ),
      ANTHROPIC_MODEL: model,
      ANTHROPIC_SMALL_FAST_MODEL: smallModel,
      ANTHROPIC_DEFAULT_OPUS_MODEL: model,
      ANTHROPIC_DEFAULT_SONNET_MODEL: model,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: model,
      CLAUDE_CODE_SUBAGENT_MODEL: model,
    };

    // DeepSeek's Claude Code guide authenticates with ANTHROPIC_AUTH_TOKEN.
    const authToken = value(config, "CLAUDE_AUTH_TOKEN") || (baseUrl.includes("api.deepseek.com") ? apiKey : "");
    if (authToken) {
      env.ANTHROPIC_AUTH_TOKEN = authToken;
      delete env.ANTHROPIC_API_KEY;
    } else {
      env.ANTHROPIC_API_KEY = apiKey;
    }

    const state = {
      events: [],
      tools: new Map(),
      stderr: "",
      sessionId,
      model,
      resultError: null,
      usage: null,
      costUsd: 0,
      stdoutTail: "",
    };
    const child = spawn(bin, args, {
      cwd: fixtureDir,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let buffer = "";
    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) parseLine(line, state);
      state.stdoutTail = (state.stdoutTail + chunk.toString()).slice(-4000);
    });
    child.stderr.on("data", (chunk) => {
      state.stderr += chunk.toString();
    });

    const timeout = number(config, "CLAUDE_TIMEOUT_MS", 240000);
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2000);
      reject(new Error(`Claude Code timed out after ${timeout}ms`));
    }, timeout);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`Could not start Claude Code (${bin}): ${error.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (buffer.trim()) parseLine(buffer, state);
      if (state.resultError) {
        reject(new Error(`Claude Code error: ${state.resultError}`));
        return;
      }
      if (code !== 0) {
        reject(
          new Error(
            `Claude Code exited with ${code}.\n${state.stderr || state.stdoutTail || "No output."}`,
          ),
        );
        return;
      }
      resolve(state);
    });
  });
}

export async function run({ questions, config, fixtureDir, configDir }) {
  const events = [];
  const sessionId = randomUUID();
  let resolvedSessionId = sessionId;
  let model = value(config, "CLAUDE_MODEL", "deepseek-flash");
  let durationMs = 0;
  const usage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
    total_tokens: 0,
  };
  let costUsd = 0;

  for (const [index, question] of questions.entries()) {
    events.push({ type: "user", text: question.text });
    const started = Date.now();
    const state = await runOne({
      prompt: question.text,
      sessionId: resolvedSessionId,
      isFirst: index === 0,
      config,
      fixtureDir,
      configDir,
    });
    durationMs += Date.now() - started;
    resolvedSessionId = state.sessionId || resolvedSessionId;
    model = value(config, "CLAUDE_MODEL", "") || state.model || model;
    events.push(...state.events);

    if (state.usage) {
      for (const key of [
        "input_tokens",
        "output_tokens",
        "cache_read_input_tokens",
        "cache_creation_input_tokens",
      ]) {
        usage[key] += Number(state.usage[key] ?? 0);
      }
    }
    costUsd += Number(state.costUsd ?? 0);
  }

  usage.total_tokens =
    usage.input_tokens +
    usage.output_tokens +
    usage.cache_read_input_tokens +
    usage.cache_creation_input_tokens;

  return {
    events,
    meta: {
      agent: "claude",
      model,
      sessionId: resolvedSessionId,
      durationMs,
      usage,
      costUsd,
    },
  };
}
