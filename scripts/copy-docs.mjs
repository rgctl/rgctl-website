/**
 * Assemble website/content/docs for the static site.
 *
 * SSOT in this repo:
 *   - docs/guides/**  (user-facing feature guides)
 *
 * Pulled from the rgctl product repo (RGCTL_REPO):
 *   - other published docs (Introduction, user-guide, json-api, …)
 *   - AGENTS.md
 *   - scripts/install.sh  (falls back to vendor/install.sh)
 *
 * Resolve product repo as:
 *   $RGCTL_REPO → ../rgctl → ../rbuilder
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, "..");
const localDocs = join(siteRoot, "docs");
const destDocs = join(siteRoot, "content/docs");
const publicDir = join(siteRoot, "public");

function resolveRgctlRepo() {
  const candidates = [
    process.env.RGCTL_REPO,
    join(siteRoot, "../rgctl"),
    join(siteRoot, "../rbuilder"),
  ].filter(Boolean);
  for (const c of candidates) {
    const abs = resolve(c);
    if (existsSync(join(abs, "docs")) || existsSync(join(abs, "AGENTS.md"))) {
      return abs;
    }
  }
  return null;
}

const rgctlRepo = resolveRgctlRepo();
if (rgctlRepo) {
  console.log(`[copy-docs] RGCTL_REPO=${rgctlRepo}`);
} else {
  console.warn(
    "[copy-docs] no RGCTL_REPO / ../rgctl / ../rbuilder — guides-only local docs",
  );
}

/** @param {string} srcRoot @param {string} destRoot @param {(rel: string, src: string) => boolean} filter */
function copyTree(srcRoot, destRoot, filter) {
  if (!existsSync(srcRoot)) return;
  mkdirSync(destRoot, { recursive: true });
  cpSync(srcRoot, destRoot, {
    recursive: true,
    filter: (src) => {
      const rel = relative(srcRoot, src);
      if (!rel) return true;
      return filter(rel, src);
    },
  });
}

function publishedDocFilter(rel, src) {
  if (rel.startsWith("internal")) return false;
  if (rel.startsWith("videos")) return false;
  if (rel === "languages" || rel.startsWith("languages/")) return false;
  if (rel === "design" || rel.startsWith("design/")) return false;
  if (rel === "releases" || rel.startsWith("releases/")) return false;
  // Guides SSOT is local — skip when copying from product repo
  if (rel === "guides" || rel.startsWith("guides/")) return false;
  if (statSync(src).isDirectory()) return true;
  return (
    src.endsWith(".md") ||
    src.endsWith(".txt") ||
    /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(src)
  );
}

function guideFilter(rel, src) {
  if (statSync(src).isDirectory()) return true;
  return (
    src.endsWith(".md") ||
    src.endsWith(".txt") ||
    /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(src)
  );
}

if (existsSync(destDocs)) {
  rmSync(destDocs, { recursive: true, force: true });
}
mkdirSync(destDocs, { recursive: true });

// 1) Local guides SSOT
const localGuides = join(localDocs, "guides");
if (existsSync(localGuides)) {
  copyTree(localGuides, join(destDocs, "guides"), guideFilter);
  console.log("[copy-docs] docs/guides → content/docs/guides");
} else {
  console.warn("[copy-docs] missing docs/guides/");
}

// 2) Other published docs from product repo (or leftover local docs/)
if (rgctlRepo) {
  copyTree(join(rgctlRepo, "docs"), destDocs, publishedDocFilter);
  console.log("[copy-docs] product docs/ → content/docs (excl. guides/design/internal/…)");
} else if (existsSync(localDocs)) {
  copyTree(localDocs, destDocs, (rel, src) => {
    if (rel === "guides" || rel.startsWith("guides/")) return false;
    return publishedDocFilter(rel, src);
  });
}

// AGENTS.md
const agentsCandidates = [
  rgctlRepo ? join(rgctlRepo, "AGENTS.md") : null,
  join(siteRoot, "AGENTS.md"),
].filter(Boolean);
for (const agents of agentsCandidates) {
  if (existsSync(agents)) {
    cpSync(agents, join(destDocs, "AGENTS.md"));
    console.log(`[copy-docs] ${relative(siteRoot, agents)} → content/docs/AGENTS.md`);
    break;
  }
}

// install.sh
const installCandidates = [
  rgctlRepo ? join(rgctlRepo, "scripts/install.sh") : null,
  join(siteRoot, "vendor/install.sh"),
].filter(Boolean);
mkdirSync(publicDir, { recursive: true });
for (const installSh of installCandidates) {
  if (existsSync(installSh)) {
    cpSync(installSh, join(publicDir, "install.sh"));
    console.log(`[copy-docs] ${installSh} → public/install.sh`);
    break;
  }
}

const llmsTxt = `# rgctl

> Open-source code knowledge graph for LLM agents. Index once (\`discover\`), then query compact JSON — callers, blast radius, CFG/PDG slices, communities, semantic search, OSV reachability, and migration planning.

Website: https://rgctl.io/
Repository: https://github.com/sshaaf/rgctl
Website source: https://github.com/sshaaf/rgctl-website
Install: \`curl -fsSL https://rgctl.io/install.sh | sh\`

## Capabilities

- Typed code knowledge graph across 61 language plugins: 24 Tier-1 custom AST plugins (Bash, C, C++, C#, Dart, Elixir, ERB, Go, Groovy, HCL, Java, JavaScript, Kotlin, Lua, Markdown, PHP, Puppet, Python, Ruby, Rust, Scala, SQL, Swift, TypeScript) and 37 Tier-2 declarative \`tags.scm\` query plugins (Clojure, CMake, CSS, CUDA, D, Emacs Lisp, Elm, Erlang, Fortran, F#, GDScript, Gleam, GLSL, GraphQL, Haskell, HTML, JSON, Julia, Makefile, Nix, Objective-C, OCaml, Odin, PowerShell, Prisma, Protocol Buffers, R, Racket, Scheme, Solidity, Starlark, Svelte, TOML, Verilog/SystemVerilog, VHDL, YAML, Zig)
- Structured queries: \`find\`, \`callers\`, \`callees\`, \`relations\`, \`inventory\`
- Blast radius; Fast-Leiden communities; PageRank / betweenness / harmonic metrics; git churn (\`discover --with-git\`, \`metrics --churn\`)
- Hybrid CPG / CFG / PDG: \`rgctl slice\` builds single-function CFG/PDG lazily on demand; \`discover --with-cfg\` pre-builds the full repo archive
- Cross-language MRO (\`relations -e overrides\`), SCIP overlay (\`discover --scip\`), frameworks / DI routes
- Semantic search over functions and docs
- OSV / vuln reachability and OpenVEX
- Agent skills via \`rgctl install --skill\`

## CLI (JSON-first)

- \`rgctl discover .\` — index repo → \`.rgctl/\` (optional \`--with-git\`, \`--scip <PATH.scip>\`, \`--with-cfg\`)
- \`rgctl update\` / \`rgctl watch\` / \`rgctl merge\` — incremental refresh, file watch, multi-repo park-and-resolve
- \`rgctl -f json find|callers|callees|relations|inventory|blast-radius|cpg|slice|metrics|status\`
- \`rgctl relations <SYM> -e overrides\` / \`rgctl relations <FILE> -e cochangeswith\`
- \`rgctl metrics --pagerank\` / \`--churn\` / \`--communities\`
- \`rgctl slice <FILE> --line <N> --variable <VAR>\` — lazy CFG/PDG (optional \`--with-alias\`, \`--taint\`)
- \`rgctl clones --mode exact|bloom|fragment\` — Type 1–4 (SESE + 1-WL fragment)
- \`rgctl semantic index\` / \`rgctl semantic query\`
- \`rgctl review paths\` / \`rgctl review check\` (PR gates; \`pr-check\` is a compatibility alias)
- \`rgctl rules\` / \`discover --with-kantra\` — Konveyor-style rules

## Guides

- https://rgctl.io/docs/guides/
- https://rgctl.io/docs/guides/cli-command-reference/
- https://rgctl.io/docs/guides/discovering-and-indexing/
- https://rgctl.io/docs/guides/agent-skill/
- https://rgctl.io/docs/guides/dependency-injection-and-frameworks/
- https://rgctl.io/docs/guides/blast-radius-analysis/
- https://rgctl.io/docs/guides/hybrid-cpg/
- https://rgctl.io/docs/guides/program-slicing/
- https://rgctl.io/docs/guides/clone-detection/
- https://rgctl.io/docs/guides/community-detection/
- https://rgctl.io/docs/guides/vulnerability-and-osv-analysis/
- https://rgctl.io/docs/guides/migration-planning/

## Reference

- https://rgctl.io/docs/user-guide/
- https://rgctl.io/docs/json-api/
- https://rgctl.io/docs/policy-format/
- https://rgctl.io/docs/languages/

## Optional

- https://rgctl.io/docs/contributor-checklist/
- https://rgctl.io/docs/tier-1-language-support/
- https://rgctl.io/docs/tier-2-language-support/
- https://rgctl.io/docs/analysis-architecture/
- https://rgctl.io/llms.txt
`;

writeFileSync(join(publicDir, "llms.txt"), llmsTxt, "utf8");
console.log("[copy-docs] wrote public/llms.txt");
