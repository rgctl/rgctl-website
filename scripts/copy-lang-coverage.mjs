/**
 * Copy Tier-1 `*-ast-coverage.json`, Tier-2 `queries/tags.scm`, and
 * `languages.toml` metadata into `content/languages/` from the rgctl product
 * repo (RGCTL_REPO).
 *
 * Resolve product repo as: $RGCTL_REPO → ../rgctl → ../rbuilder
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, "..");
const destDir = join(siteRoot, "content/languages");

function resolveRgctlRepo() {
  const candidates = [
    process.env.RGCTL_REPO,
    join(siteRoot, "../rgctl"),
    join(siteRoot, "../rbuilder"),
  ].filter(Boolean);
  for (const c of candidates) {
    const abs = resolve(c);
    if (existsSync(join(abs, "crates")) || existsSync(join(abs, "languages.toml"))) {
      return abs;
    }
  }
  return null;
}

const rgctlRepo = resolveRgctlRepo();
if (!rgctlRepo) {
  console.warn(
    "[copy-lang-coverage] no RGCTL_REPO / ../rgctl / ../rbuilder — skip language catalog",
  );
  process.exit(0);
}

console.log(`[copy-lang-coverage] RGCTL_REPO=${rgctlRepo}`);

const cratesDir = join(rgctlRepo, "crates");
const languagesToml = join(rgctlRepo, "languages.toml");

/** Display names for all Tier-1 and Tier-2 language ids. */
const DISPLAY = {
  // Tier 1 (custom + markdown)
  bash: "Bash",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  dart: "Dart",
  elixir: "Elixir",
  erb: "ERB",
  go: "Go",
  groovy: "Groovy",
  hcl: "HCL",
  java: "Java",
  javascript: "JavaScript",
  kotlin: "Kotlin",
  lua: "Lua",
  markdown: "Markdown",
  php: "PHP",
  puppet: "Puppet",
  python: "Python",
  ruby: "Ruby",
  rust: "Rust",
  scala: "Scala",
  sql: "SQL",
  swift: "Swift",
  typescript: "TypeScript",
  // Tier 2 (declarative tags.scm queries)
  clojure: "Clojure",
  cmake: "CMake",
  css: "CSS",
  cuda: "CUDA",
  d: "D",
  elisp: "Emacs Lisp",
  elm: "Elm",
  erlang: "Erlang",
  fortran: "Fortran",
  fsharp: "F#",
  gdscript: "GDScript",
  gleam: "Gleam",
  glsl: "GLSL",
  graphql: "GraphQL",
  haskell: "Haskell",
  html: "HTML",
  json: "JSON",
  julia: "Julia",
  make: "Makefile",
  nix: "Nix",
  objc: "Objective-C",
  ocaml: "OCaml",
  odin: "Odin",
  powershell: "PowerShell",
  prisma: "Prisma",
  proto: "Protocol Buffers",
  r: "R",
  racket: "Racket",
  scheme: "Scheme",
  solidity: "Solidity",
  starlark: "Starlark",
  svelte: "Svelte",
  toml: "TOML",
  verilog: "Verilog / SystemVerilog",
  vhdl: "VHDL",
  yaml: "YAML",
  zig: "Zig",
};

/**
 * Minimal parse of `[languages.<id>]` tables we care about.
 * @returns {Record<string, { extensions: string[], aliases: string[], function_kinds: string[], class_kinds: string[], import_kinds: string[], plugin: string, crate: string, handler: string, tags_scm: string }>}
 */
function parseLanguagesToml(text) {
  /** @type {Record<string, any>} */
  const out = {};
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const table = line.match(/^\[languages\.([a-z0-9_]+)\]$/i);
    if (table) {
      current = table[1];
      out[current] = {
        extensions: [],
        aliases: [],
        function_kinds: [],
        class_kinds: [],
        import_kinds: [],
        plugin: "",
        crate: "",
        handler: "",
        tags_scm: "",
      };
      continue;
    }
    if (!current || line.startsWith("[")) {
      current = null;
      continue;
    }
    const kv = line.match(/^([a-z_]+)\s*=\s*(.+)$/i);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith("[")) {
      const items = [...val.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      if (
        key === "extensions" ||
        key === "aliases" ||
        key === "function_kinds" ||
        key === "class_kinds" ||
        key === "import_kinds"
      ) {
        out[current][key] = items;
      }
    } else if (val.startsWith('"')) {
      val = val.replace(/^"|"$/g, "");
      if (
        key === "plugin" ||
        key === "crate" ||
        key === "handler" ||
        key === "tags_scm"
      ) {
        out[current][key] = val;
      }
    }
  }
  return out;
}

function summarizeHandlers(handlers) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const h of Object.values(handlers)) {
    counts[h] = (counts[h] || 0) + 1;
  }
  return counts;
}

/**
 * Extract `@capture` names and occurrence counts from a `tags.scm` source string,
 * ignoring `;` line comments.
 * @param {string} scmText
 */
function parseTagsCaptures(scmText) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const raw of scmText.split(/\r?\n/)) {
    const noComment = raw.replace(/;.*$/, "");
    for (const m of noComment.matchAll(/@([a-zA-Z0-9_.]+)/g)) {
      const cap = m[1];
      counts[cap] = (counts[cap] || 0) + 1;
    }
  }
  const captures = Object.keys(counts).sort();
  return { captures, captureCounts: counts };
}

if (existsSync(destDir)) {
  rmSync(destDir, { recursive: true, force: true });
}
mkdirSync(destDir, { recursive: true });

const meta = existsSync(languagesToml)
  ? parseLanguagesToml(readFileSync(languagesToml, "utf8"))
  : {};

/** @type {Array<Record<string, unknown>>} */
const catalog = [];

if (!existsSync(cratesDir)) {
  console.warn(`[copy-lang-coverage] missing crates/ under ${rgctlRepo}`);
  process.exit(0);
}

for (const name of readdirSync(cratesDir).sort()) {
  if (!name.startsWith("rgctl-lang-")) continue;
  const id = name.slice("rgctl-lang-".length);
  if (id === "runtime") continue;

  const manifest = join(cratesDir, name, `${id}-ast-coverage.json`);
  const tagsScm = join(cratesDir, name, "queries/tags.scm");
  const langMeta = meta[id] || {};

  if (existsSync(manifest)) {
    const dest = join(destDir, `${id}-ast-coverage.json`);
    cpSync(manifest, dest);

    const coverage = JSON.parse(readFileSync(manifest, "utf8"));
    const handlers = coverage.handlers || {};
    const counts = summarizeHandlers(handlers);

    catalog.push({
      id,
      tier: 1,
      displayName: DISPLAY[id] || id,
      grammar: coverage.grammar || langMeta.crate || "",
      crateDir: name,
      manifestFile: `${id}-ast-coverage.json`,
      plugin: langMeta.plugin || "",
      grammarCrate: langMeta.crate || "",
      handler: langMeta.handler || "custom",
      extensions: langMeta.extensions || [],
      aliases: langMeta.aliases || [],
      functionKinds: langMeta.function_kinds || [],
      classKinds: langMeta.class_kinds || [],
      kindCount: Object.keys(handlers).length,
      handlerCounts: counts,
    });
  } else if (existsSync(tagsScm)) {
    const dest = join(destDir, `${id}-tags.scm`);
    cpSync(tagsScm, dest);

    const scmText = readFileSync(tagsScm, "utf8");
    const { captures, captureCounts } = parseTagsCaptures(scmText);

    catalog.push({
      id,
      tier: 2,
      displayName: DISPLAY[id] || id,
      grammar: langMeta.crate || "",
      crateDir: name,
      manifestFile: `queries/tags.scm`,
      tagsFile: `${id}-tags.scm`,
      plugin: langMeta.plugin || "QueryLanguagePlugin",
      grammarCrate: langMeta.crate || "",
      handler: langMeta.handler || "queries",
      extensions: langMeta.extensions || [],
      aliases: langMeta.aliases || [],
      functionKinds: langMeta.function_kinds || [],
      classKinds: langMeta.class_kinds || [],
      kindCount: captures.length,
      handlerCounts: {},
      captures,
      captureCounts,
    });
  }
}

writeFileSync(
  join(destDir, "catalog.json"),
  JSON.stringify(
    { generated_from: "*-ast-coverage.json + queries/tags.scm", languages: catalog },
    null,
    2,
  ) + "\n",
);

writeFileSync(
  join(destDir, "languages-meta.json"),
  JSON.stringify({ source: "languages.toml", languages: meta }, null, 2) + "\n",
);

const tier1Count = catalog.filter((l) => l.tier === 1).length;
const tier2Count = catalog.filter((l) => l.tier === 2).length;
console.log(
  `[copy-lang-coverage] ${catalog.length} language(s) (${tier1Count} Tier-1, ${tier2Count} Tier-2) → content/languages/`,
);
