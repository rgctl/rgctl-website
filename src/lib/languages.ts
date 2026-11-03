import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const contentRoot = join(process.cwd(), "content/languages");

/** Fallback display names when catalog.json is missing an entry (keep in sync with copy-lang-coverage.mjs). */
export const LANGUAGE_DISPLAY: Record<string, string> = {
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
  matlab: "MATLAB",
  nix: "Nix",
  objc: "Objective-C",
  ocaml: "OCaml",
  odin: "Odin",
  pascal: "Pascal / Delphi",
  perl: "Perl",
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
  ada: "Ada",
  apex: "Apex (Salesforce)",
  cobol: "COBOL",
  jcl: "JCL",
  pli: "PL/I",
};

export function displayNameFor(id: string, fallback?: string): string {
  return LANGUAGE_DISPLAY[id] || fallback || id;
}

export const HANDLER_ORDER = [
  "Symbol",
  "Relation",
  "CfgStatement",
  "AstSkeleton",
  "Property",
  "Literal",
  "SkipWrapper",
  "SkipTypeToken",
  "Unimplemented",
] as const;

/** Labels counted as handled for semantic coverage (mirrors rgctl-ast-coverage). */
export const HANDLED_HANDLERS = new Set([
  "Symbol",
  "Relation",
  "Property",
  "CfgStatement",
  "AstSkeleton",
  "Literal",
]);

export type HandlerKind = (typeof HANDLER_ORDER)[number] | string;

export type LanguageCatalogEntry = {
  id: string;
  tier?: 1 | 2;
  displayName: string;
  grammar: string;
  crateDir: string;
  manifestFile: string;
  tagsFile?: string;
  plugin: string;
  grammarCrate: string;
  handler: string;
  extensions: string[];
  aliases: string[];
  functionKinds?: string[];
  classKinds?: string[];
  importKinds?: string[];
  kindCount: number;
  handlerCounts: Record<string, number>;
  captures?: string[];
  captureCounts?: Record<string, number>;
  structural?: boolean;
};

export type AstCoverageManifest = {
  grammar: string;
  handlers: Record<string, string>;
};

export type LanguageCatalog = {
  generated_from: string;
  languages: LanguageCatalogEntry[];
};

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function languagesContentRoot(): string {
  return contentRoot;
}

export function listLanguages(): LanguageCatalogEntry[] {
  const catalog = readJson<LanguageCatalog>(join(contentRoot, "catalog.json"));
  if (!catalog?.languages?.length) return [];
  return [...catalog.languages]
    .map((l) => ({
      ...l,
      tier: l.tier ?? (l.handler === "queries" ? 2 : 1),
      displayName: displayNameFor(l.id, l.displayName),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function getLanguage(id: string): LanguageCatalogEntry | null {
  return listLanguages().find((l) => l.id === id) ?? null;
}

export function loadCoverage(id: string): AstCoverageManifest | null {
  return readJson<AstCoverageManifest>(
    join(contentRoot, `${id}-ast-coverage.json`),
  );
}

export function loadTagsScm(id: string): string | null {
  const p = join(contentRoot, `${id}-tags.scm`);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

export function groupHandlers(
  handlers: Record<string, string>,
): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const kind of HANDLER_ORDER) {
    groups.set(kind, []);
  }
  for (const [nodeKind, handler] of Object.entries(handlers)) {
    const list = groups.get(handler) ?? [];
    list.push(nodeKind);
    groups.set(handler, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.localeCompare(b));
  }
  return groups;
}

export function formatExtensions(exts: string[]): string {
  if (!exts.length) return "—";
  return exts.map((e) => (e.startsWith(".") ? e : `.${e}`)).join(", ");
}

/** Handled kind count (Symbol/Relation/Property/Cfg/AstSkeleton/Literal). */
export function coverageHandledCount(counts: Record<string, number>): number {
  let n = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (HANDLED_HANDLERS.has(k)) n += v;
  }
  return n;
}

/**
 * Semantic coverage: handled / (total − SkipWrapper − SkipTypeToken).
 * Grade floor A+ is ≥98% (raw `"Skip"` is banned in Tier-1 manifests).
 */
export function semanticCoverage(counts: Record<string, number>): {
  handled: number;
  denom: number;
  pct: number;
  grade: "A+" | "A" | "B" | "C";
  wrapperOrType: number;
  unimplemented: number;
  rawSkip: number;
} {
  const skipW = counts.SkipWrapper ?? 0;
  const skipT = counts.SkipTypeToken ?? 0;
  const rawSkip = counts.Skip ?? 0;
  const unimplemented = counts.Unimplemented ?? 0;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const denom = Math.max(0, total - skipW - skipT);
  const handled = coverageHandledCount(counts);
  const pct = denom === 0 ? 100 : (100 * handled) / denom;
  const grade: "A+" | "A" | "B" | "C" =
    pct >= 98 ? "A+" : pct >= 75 ? "A" : pct >= 50 ? "B" : "C";
  return {
    handled,
    denom,
    pct,
    grade,
    wrapperOrType: skipW + skipT,
    unimplemented,
    rawSkip,
  };
}
