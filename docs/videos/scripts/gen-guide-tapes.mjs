#!/usr/bin/env node
/**
 * Generate VHS .tape + .srt for every CLI-friendly guide in manifest.json.
 *
 * Usage (from website root):
 *   node docs/videos/scripts/gen-guide-tapes.mjs
 *   node docs/videos/scripts/gen-guide-tapes.mjs blast-radius-analysis
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const videosRoot = join(here, "..");
const guidesDir = join(videosRoot, "guides");
const manifest = JSON.parse(
  readFileSync(join(guidesDir, "manifest.json"), "utf8"),
);

const only = process.argv[2];

const HEADER = `# {{TITLE}} — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh {{SLUG}}
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh {{SLUG}}
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs {{SLUG}}

Output "docs/videos/guides/{{SLUG}}-no-captions.gif"
Output "docs/videos/guides/{{SLUG}}-no-captions.mp4"

Require rgctl
Require jq

Set Shell "bash"
Set FontSize 15
Set FontFamily "Menlo, Monaco, Consolas, monospace"
Set Width 1400
Set Height 800
Set Padding 16
Set Margin 20
Set MarginFill "#0d1117"
Set WindowBar Colorful
Set WindowBarSize 40
Set BorderRadius 8
Set Theme "Catppuccin Mocha"
Set TypingSpeed 18ms
Set Framerate 30
Set PlaybackSpeed 1.0
Set CursorBlink true
`;

/** @typedef {{ comment: string, cmds: string[], sleep?: string }} Scene */
/** @typedef {{ slug: string, workdir: string, prompt: string, scenes: Scene[], captions: [string, string][] }} TapeDef */

/** @type {Record<string, TapeDef>} */
const tapes = {
  "discovering-and-indexing": {
    slug: "discovering-and-indexing",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Index CoolStore Java backend (AST → RGCL v2 mmap graph)",
        cmds: [
          "rm -rf .rgctl",
          "rgctl discover . -l java --with-cfg --with-harmonic --export-migration-hints",
        ],
        sleep: "8s",
      },
      {
        comment: "# 2. Confirm snapshot readiness",
        cmds: [
          "rgctl -f json status | jq '{status, schema_version, nodes, edges}'",
        ],
        sleep: "2s",
      },
    ],
    captions: [
      [
        "Index CoolStore Once (rgctl discover)",
        "Tree-sitter AST · RGCL v2 mmap · CFG/PDG · harmonic · migration plan",
      ],
      [
        "Zero-Grep Readiness (rgctl status)",
        "schema_version · node/edge counts from graph.snapshot.bin",
      ],
    ],
  },

  "structured-query": {
    slug: "structured-query",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Session status + function inventory",
        cmds: [
          "rgctl -f json status | jq '{status, nodes, edges, schema_version}'",
          "rgctl -f json inventory --by type | jq '.counts[] | select(.key==\"function\")'",
        ],
        sleep: "2.5s",
      },
      {
        comment: "# 2. Exact symbol lookup",
        cmds: [
          "rgctl -f json find priceShoppingCart --exact | jq '.entities[0] | {name, type, file, line}'",
        ],
        sleep: "2s",
      },
      {
        comment: "# 3. Callers + typed CALLS relations",
        cmds: [
          "rgctl -f json callers priceShoppingCart | jq '.callers[:4] | map({name, file})'",
          "rgctl -f json relations priceShoppingCart --edge calls --direction both | jq '{returned: (.edges|length)}'",
        ],
        sleep: "3s",
      },
    ],
    captions: [
      [
        "Graph Readiness & Inventory (status · inventory)",
        "Agent-facing counts before you touch a single source file",
      ],
      [
        "Exact Symbol Lookup (rgctl find)",
        "Deterministic -f json EntityRow — no noisy text grep",
      ],
      [
        "Call Neighborhoods & Typed Edges (callers · relations)",
        "mmap CALLS traversal with explicit direction filters",
      ],
    ],
  },

  "dependency-injection-and-frameworks": {
    slug: "dependency-injection-and-frameworks",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Route + DI edge inventory",
        cmds: [
          "rgctl -f json inventory --by edge | jq '.counts[] | select(.key==\"exposesroute\" or .key==\"injects\")'",
        ],
        sleep: "2s",
      },
      {
        comment: "# 2. JAX-RS routes and Injects wiring",
        cmds: [
          "rgctl -f json relations --edge exposesroute --limit 5 | jq '.edges[:3]'",
          "rgctl -f json relations CartEndpoint --edge injects --direction out | jq '.edges'",
        ],
        sleep: "3s",
      },
      {
        comment: "# 3. Natural-language endpoint search",
        cmds: [
          "rgctl -f json semantic query 'hey give me all my end points' --limit 3 | jq '.hits[:3] | map({name, qualified_name, score})'",
        ],
        sleep: "2.5s",
      },
    ],
    captions: [
      [
        "Framework Edges in Inventory (ExposesRoute · Injects)",
        "Compiled frameworks.bin catalog — routes & DI without grep",
      ],
      [
        "Walk JAX-RS Routes & Injection Wiring (relations)",
        "Who exposes /cart — and what CartEndpoint injects",
      ],
      [
        "Ask for Endpoints in Plain English (semantic)",
        "Offline vocab embedder — zero GPU required",
      ],
    ],
  },

  "watch-mode": {
    slug: "watch-mode",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Detect modified source file (dirty_files: 1)",
        cmds: [
          "rgctl -f json status | jq '{status, index_current, dirty_files, files_changed, dirty_sample}'",
        ],
        sleep: "2.5s",
      },
      {
        comment: "# 2. One-shot incremental update (no full rediscover)",
        cmds: [
          "rgctl update --files src/main/java/com/redhat/coolstore/service/ShoppingCartService.java",
          "rgctl -f json status | jq '{status, index_current, dirty_files, files_changed}'",
        ],
        sleep: "3s",
      },
    ],
    captions: [
      [
        "Check Index Freshness (rgctl status)",
        "Detects modified ShoppingCartService.java (dirty_files: 1)",
      ],
      [
        "Patch the Graph in Place (rgctl update --files)",
        "Sub-200ms incremental update → index_current: true",
      ],
    ],
  },

  "blast-radius-analysis": {
    slug: "blast-radius-analysis",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Upstream blast radius before you edit",
        cmds: ["rgctl blast-radius priceShoppingCart"],
        sleep: "2.5s",
      },
      {
        comment: "# 2. Machine-readable score + callers",
        cmds: [
          "rgctl -f json blast-radius priceShoppingCart | jq '{target: .target.symbol, metrics}'",
        ],
        sleep: "2.5s",
      },
      {
        comment: "# 3. Depth-limited impact on getShoppingCart",
        cmds: ["rgctl blast-radius getShoppingCart --depth 3"],
        sleep: "2.5s",
      },
    ],
    captions: [
      [
        "Know What Breaks Before You Edit (blast-radius)",
        "Score · direct callers · full upstream impact zone",
      ],
      [
        "JSON Envelope for Agents & CI ( -f json )",
        "schema_version metrics — wire into review bots",
      ],
      [
        "Cap Traversal Depth (--depth 3)",
        "Focus the impact zone when planning a safe refactor",
      ],
    ],
  },

  "pr-review": {
    slug: "pr-review",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Structural PR deltas vs indexed HEAD (worktree synth)",
        cmds: [
          "git status -s",
          "rgctl -f json review paths --synthetic-head worktree | jq '{schema_version, command, change_summary}'",
        ],
        sleep: "3s",
      },
      {
        comment: "# 2. Inspect symbol-level call-path deltas",
        cmds: [
          "rgctl -f json review paths --synthetic-head worktree | jq '.symbols[] | select(.name==\"priceShoppingCart\") | {name, kind, deltas: .path_delta[:3]}'",
        ],
        sleep: "3s",
      },
    ],
    captions: [
      [
        "PR Call-Path Deltas Without Dual Snapshots",
        "review paths --synthetic-head worktree vs indexed HEAD",
      ],
      [
        "Symbol-Level Call-Path Deltas",
        "Pinpoint added, removed, and retargeted call edges per symbol",
      ],
    ],
  },

  "ci-policy-checks": {
    slug: "ci-policy-checks",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Local policy gate catches high-impact diff changes",
        cmds: [
          "rgctl -f json check --policy-file ../rgctl-pr-policy.json | jq '{passed, violations: (.violations|length), sample: .violations[:2]}'",
        ],
        sleep: "3s",
      },
      {
        comment: "# 2. Blast-radius policy gate on priceShoppingCart",
        cmds: [
          "rgctl -f json blast-radius priceShoppingCart --policy-file ../rgctl-pr-policy.json | jq '{metrics, gatekeeping}'",
        ],
        sleep: "3s",
      },
    ],
    captions: [
      [
        "CI Policy Gate on Diff Scope (rgctl check)",
        "Catches symbols exceeding max_impact_nodes: 10 → passed: false",
      ],
      [
        "Same Policy on a Single Symbol (blast-radius --policy-file)",
        "Impact zone 13 > max 10 → policy_status: VIOLATED",
      ],
    ],
  },

  "program-slicing": {
    slug: "program-slicing",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Backward slice — what influences sc?",
        cmds: [
          "rgctl -f json slice src/main/java/com/redhat/coolstore/service/ShoppingCartService.java --line 68 --variable sc --direction backward | jq '{criterion, file, lines, nodes: (.nodes|length), edges: (.edges|length)}'",
        ],
        sleep: "3.5s",
      },
      {
        comment: "# 2. Forward slice with alias tracking",
        cmds: [
          "rgctl -f json slice src/main/java/com/redhat/coolstore/service/ShoppingCartService.java --line 68 --variable sc --direction forward --with-alias | jq '{direction, lines, nodes: (.nodes|length), reduction_percent}'",
        ],
        sleep: "3s",
      },
    ],
    captions: [
      [
        "Statement-Level Backward Slicing (rgctl slice)",
        "Lazy CFG/PDG — cut 60–95% of prompt noise for agents",
      ],
      [
        "Forward Slice + Alias Tracking (--with-alias)",
        "Follow the variable (and its aliases) through the method",
      ],
    ],
  },

  "hybrid-cpg": {
    slug: "hybrid-cpg",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Hybrid CPG archive status",
        cmds: [
          "rgctl -f json cpg status | jq '{schema_version, field_write_count, field_write_index_present}'",
        ],
        sleep: "2s",
      },
      {
        comment: "# 2. Call overlay + field mutations on ShoppingCart",
        cmds: [
          "rgctl -f json cpg calls priceShoppingCart | jq '{function_name, edges: (.edges|length), sample: .edges[:2]}'",
          "rgctl -f json cpg mutations --type ShoppingCart --exclude-ctors | jq '{type_name, count: (.mutations|length), sample: (.mutations[:3] | map({member, function, line}))}'",
        ],
        sleep: "3.5s",
      },
      {
        comment: "# 3. Data-flow façade (cpg flows)",
        cmds: [
          "rgctl -f json cpg flows src/main/java/com/redhat/coolstore/service/ShoppingCartService.java --line 68 --variable sc --direction forward --with-alias | jq '{function, variable, steps: (.steps | map({line, code}))}'",
        ],
        sleep: "3.5s",
      },
    ],
    captions: [
      [
        "Hybrid CPG Archive Ready (cpg status)",
        "Call graph + per-function CFG/PDG in one mmap-backed store",
      ],
      [
        "Calls Overlay & Domain Mutations (cpg calls · mutations)",
        "Pinpoints exact fields & lines mutating ShoppingCart",
      ],
      [
        "Flow-Sensitive Slice Façade (cpg flows)",
        "Traces statement-by-statement data flow across priceShoppingCart",
      ],
    ],
  },

  "inspecting-cfg-pdg-dominance": {
    slug: "inspecting-cfg-pdg-dominance",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Control-flow blocks for priceShoppingCart",
        cmds: [
          "rgctl -f json inspect priceShoppingCart cfg | jq '{symbol, layer, blocks: (.nodes|length), edges: (.edges|length), sample_blocks: (.nodes[1:3] | map({id, start_line, statements}))}'",
        ],
        sleep: "3s",
      },
      {
        comment: "# 2. Program dependence graph (data + control edges)",
        cmds: [
          "rgctl -f json inspect priceShoppingCart pdg | jq '{layer, nodes: (.nodes|length), edges: (.edges|length), sample_edges: .edges[:3]}'",
        ],
        sleep: "3s",
      },
      {
        comment: "# 3. Immediate dominator tree (idom)",
        cmds: [
          "rgctl -f json inspect priceShoppingCart dom | jq '{symbol, layer, blocks: (.nodes|length), idom_sample: .idom[:4]}'",
        ],
        sleep: "3s",
      },
    ],
    captions: [
      [
        "Per-Function CFG (inspect … cfg)",
        "Basic blocks, branch conditions & statements",
      ],
      [
        "Program Dependence Graph (inspect … pdg)",
        "Variable-level data + control dependence edges",
      ],
      [
        "Immediate Dominator Tree (inspect … dom)",
        "Block-to-immediate-dominator (idom) relationships over the CFG",
      ],
    ],
  },

  "clone-detection": {
    slug: "clone-detection",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Exact (Type-1) whole-function clones",
        cmds: [
          "rgctl -f json clones --mode exact --min-loc 3 --exclude test | jq '{mode, group_count, top_group: (.groups[0].members | map({name, start_line, loc}))}'",
        ],
        sleep: "2.5s",
      },
      {
        comment: "# 2. Token-bloom structural similarity",
        cmds: [
          "rgctl -f json clones --mode bloom --threshold 0.85 --min-loc 8 --exclude test | jq '{mode, group_count, score: .groups[0].score, members: (.groups[0].members | map({name, start_line, loc}))}'",
        ],
        sleep: "3s",
      },
      {
        comment: "# 3. Sub-function SESE/WL fragment clones",
        cmds: [
          "rgctl -f json clones --mode fragment --min-statements 2 --threshold 0.8 | jq '{mode, group_count, top_hash: .groups[0].structural_hash, members: (.groups[0].members[:3] | map({enclosing_function, start_line, end_line}))}'",
        ],
        sleep: "3s",
      },
    ],
    captions: [
      [
        "Exact Copy-Paste Clones (clones --mode exact)",
        "Type-1 whole-function matches with line numbers & LOC",
      ],
      [
        "Structural Near-Duplicates (clones --mode bloom)",
        "calculateShipping vs calculateShippingInsurance",
      ],
      [
        "Sub-Function Fragment Clones (clones --mode fragment)",
        "SESE regions + 1-WL Weisfeiler-Lehman structural hashing",
      ],
    ],
  },

  "vulnerability-and-osv-analysis": {
    slug: "vulnerability-and-osv-analysis",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Normalize an OSV advisory (offline fixture)",
        cmds: [
          "rgctl -f json vuln triage --osv ../osv/jackson-CVE-2022-42004.json | jq '{id, packages: [.packages[] | {name, introduced, fixed, affected_methods}]}'",
        ],
        sleep: "2.5s",
      },
      {
        comment: "# 2. Catch shaded vulnerable JARs in lib/ (--include-jars)",
        cmds: [
          "rgctl -f json deps check --osv ../osv/jackson-CVE-2022-42004.json --include-jars lib | jq '{verdict, matched: [.matched[] | {name, version, in_range}]}'",
        ],
        sleep: "3s",
      },
      {
        comment: "# 3. Link OSV affected method to discovered code coordinates + call paths",
        cmds: [
          "rgctl -f json vuln analyze --osv ../osv/jackson-CVE-2022-42004.json --include-jars lib | jq '{deps_verdict, exploitability, vex_status: .openvex.statements[0].status, call_sites: .sink_taint.call_sites, paths: .sink_taint.paths}'",
        ],
        sleep: "4s",
      },
    ],
    captions: [
      [
        "Normalize OSV Advisories (vuln triage)",
        "Affected packages · version ranges · vulnerable sink methods",
      ],
      [
        "Catch Shaded Vulnerable JARs (deps check --include-jars)",
        "Finds jackson-databind 2.13.5 shaded inside lib/*.jar → affected_candidate",
      ],
      [
        "Link OSV Sinks to Your Code Coordinates (vuln analyze)",
        "Transformers.jsonToOrder (Transformers.java:79) ← OrderServiceMDB.onMessage",
      ],
    ],
  },

  "community-detection": {
    slug: "community-detection",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Fast-Leiden domain communities (non-singleton clusters)",
        cmds: [
          "rgctl -f json communities list | jq '{modularity, non_singleton_clusters: ([.communities[] | select(.member_count > 1)] | length), top: (.communities[:4] | map({id, label, member_count}))}'",
        ],
        sleep: "3s",
      },
      {
        comment: "# 2. Community partition summary",
        cmds: [
          "rgctl -f json metrics --communities | jq '.communities'",
        ],
        sleep: "2.5s",
      },
    ],
    captions: [
      [
        "Map Domain Architecture (communities list)",
        "12 multi-member Fast-Leiden clusters with μ+4σ hub stripping",
      ],
      [
        "Community Partition Summary (metrics --communities)",
        "Assignments · cluster count · modularity score",
      ],
    ],
  },

  "graph-metrics": {
    slug: "graph-metrics",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Production-aware PageRank hotspots",
        cmds: [
          "rgctl -f json metrics --pagerank | jq '.pagerank.top[:3] | map({kind, qualified_name, pagerank})'",
        ],
        sleep: "2.5s",
      },
      {
        comment: "# 2. Sampled betweenness bridges",
        cmds: [
          "rgctl -f json metrics --betweenness | jq '.betweenness[:3] | map({kind, qualified_name, score})'",
        ],
        sleep: "2.5s",
      },
      {
        comment: "# 3. Community metrics overlay",
        cmds: [
          "rgctl -f json metrics --communities | jq '.communities'",
        ],
        sleep: "2s",
      },
    ],
    captions: [
      [
        "FastPageRank Hotspots (metrics --pagerank)",
        "Pull-based CSR ranking — production-aware centrality",
      ],
      [
        "Architectural Bridges (metrics --betweenness)",
        "Sampled Brandes pivots — high-risk cut vertices",
      ],
      [
        "Communities as Metrics (--communities)",
        "Same Fast-Leiden partition — scored for dashboards",
      ],
    ],
  },

  "semantic-search": {
    slug: "semantic-search",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Offline vocab semantic index (no GPU)",
        cmds: ["rgctl semantic index"],
        sleep: "3s",
      },
      {
        comment: "# 2. Natural-language code search",
        cmds: [
          "rgctl -f json semantic query 'shopping cart checkout' --limit 3 | jq '.hits | map({name, score, file_path})'",
        ],
        sleep: "2.5s",
      },
      {
        comment: "# 3. Named domain communities matching query (--scope community)",
        cmds: [
          "rgctl -f json semantic query 'checkout' --scope community --limit 500 | jq '[.hits[] | select(.name | startswith(\"Community \") | not)][:3] | map({name, qualified_name, score})'",
        ],
        sleep: "3s",
      },
    ],
    captions: [
      [
        "Build an Offline Semantic Index (semantic index)",
        "Compiled vocab embedder · 256-d · zero GPU",
      ],
      [
        "Ask the Codebase in English (semantic query)",
        "Graph-distance score fusion in ~30ms",
      ],
      [
        "Scope Hits to Domain Communities (--scope community)",
        "Ranks named Fast-Leiden clusters matching 'checkout'",
      ],
    ],
  },

  "migration-planning": {
    slug: "migration-planning",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Dependency-aware migration roadmap artifact",
        cmds: [
          "jq '{schema_version, preset, order_mode, steps: (.steps|length)}' .rgctl/migration_plan.json",
        ],
        sleep: "2s",
      },
      {
        comment: "# 2. Domain package extraction steps (strangler-fig order)",
        cmds: [
          "jq '[.steps[] | select(.label != \"root\")][:4] | map({step, label, schedule_step, priority_rank, avg_pagerank})' .rgctl/migration_plan.json",
        ],
        sleep: "3s",
      },
      {
        comment: "# 3. Pair with communities + blast-radius",
        cmds: [
          "rgctl -f json communities list | jq '.communities[:3] | map({id, label, member_count})'",
          "rgctl blast-radius getShoppingCart --depth 3",
        ],
        sleep: "3s",
      },
    ],
    captions: [
      [
        "Migration Plan on Disk (migration_plan.json)",
        "Written by discover --export-migration-hints",
      ],
      [
        "Dependency-Aware Package Extraction Order",
        "model → persistence → utils → rest strangler-fig sequence",
      ],
      [
        "Validate Before You Extract (communities · blast-radius)",
        "Confirm boundaries and upstream risk on CoolStore",
      ],
    ],
  },

  "markdown-context-graph": {
    slug: "markdown-context-graph",
    workdir: "docs/videos/.work/markdown-context",
    prompt: "markdown-context",
    scenes: [
      {
        comment: "# 1. Index docs + Java in one graph",
        cmds: ["rm -rf .rgctl", "rgctl discover . -l markdown,java"],
        sleep: "3.5s",
      },
      {
        comment: "# 2. Checkout-related headings",
        cmds: [
          "rgctl -f json find 'Checkout*' --type module --limit 5 | jq '{returned, names: [.entities[].name]}'",
        ],
        sleep: "2s",
      },
      {
        comment: "# 3. Traverse Markdown section → Java file reference edges",
        cmds: [
          "rgctl -f json relations 'Checkout Flow' --edge references --direction out | jq '.edges | map({source: .source.name, edge, target: (.target.name | split(\"/\")[-1]), type: .target.type})'",
        ],
        sleep: "3s",
      },
    ],
    captions: [
      [
        "Docs + Code in One Knowledge Graph",
        "discover -l markdown,java on the in-tree fixture",
      ],
      [
        "Find Headings Like Code Symbols (find --type module)",
        "Checkout* modules — agent-ready EntityRows",
      ],
      [
        "Follow Doc Links into Java Code (relations --edge references)",
        "Checkout Flow section → CheckoutService.java & ADR modules",
      ],
    ],
  },

  "exporting-graphs": {
    slug: "exporting-graphs",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Export connected Mermaid call graph (157 nodes, 119 edges)",
        cmds: [
          "rgctl export --export-format mermaid --export-output /tmp/coolstore-fns.mmd --query 'type:Function'",
          "wc -l /tmp/coolstore-fns.mmd && grep -- '-->' /tmp/coolstore-fns.mmd | head -8",
        ],
        sleep: "3s",
      },
      {
        comment: "# 2. GraphML for external network tools (Gephi / Cytoscape)",
        cmds: [
          "rgctl export --export-format graphml --export-output /tmp/coolstore-fns.graphml --query 'type:Function'",
          "wc -c /tmp/coolstore-fns.graphml",
        ],
        sleep: "2.5s",
      },
    ],
    captions: [
      [
        "Mermaid Call Graph for PRs & Docs (export --export-format mermaid)",
        "Exports 157 functions & 119 directed call edges (A --> B)",
      ],
      [
        "GraphML for External Tools (export --export-format graphml)",
        "Interchange format for Function-node subgraphs",
      ],
    ],
  },

  "agent-skill": {
    slug: "agent-skill",
    workdir: "docs/videos/.work/coolstore",
    prompt: "coolstore",
    scenes: [
      {
        comment: "# 1. Supported AI coding agents",
        cmds: [
          "rgctl -f json install --list-agents | jq '.agents[:5] | map({id, skills_path})'",
        ],
        sleep: "2s",
      },
      {
        comment: "# 2. Install the Cursor skill pack into CoolStore",
        cmds: [
          "rgctl -f json install --skill --tools cursor --force | jq '{schema_version, scope, writes: [.writes[] | {agent, kind, status}]}'",
        ],
        sleep: "3s",
      },
      {
        comment: "# 3. Agent loop — blast-radius via the skill",
        cmds: [
          "rgctl -f json blast-radius priceShoppingCart | jq '{target: .target.symbol, metrics}'",
        ],
        sleep: "2.5s",
      },
    ],
    captions: [
      [
        "Drop-In Skills for Every Agent Host (install --list-agents)",
        "Cursor · Claude · Codex · Antigravity · AGENTS.md",
      ],
      [
        "One Command Pack Install (install --skill)",
        "SKILL.md + workflows — NL intents → rgctl verbs",
      ],
      [
        "The Agent Loop Starts With Structure",
        "blast-radius / find / slice — not whole-file greps",
      ],
    ],
  },
};

function sleepToMs(sleep) {
  if (!sleep) return 2000;
  if (sleep.endsWith("ms")) return parseInt(sleep, 10);
  if (sleep.endsWith("s")) return Math.round(parseFloat(sleep) * 1000);
  return 2000;
}

function formatSrtTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function estimateSceneDurationMs(scene) {
  // typing + sleeps + clear transitions — rough until retimed after record
  const typeMs = scene.cmds.reduce((n, c) => n + c.length * 18 + 400, 0);
  const commentMs = (scene.comment?.length ?? 0) * 18 + 500;
  return commentMs + typeMs + sleepToMs(scene.sleep) + 900;
}

function renderTape(def) {
  const title =
    manifest.guides.find((g) => g.slug === def.slug)?.title ?? def.slug;
  let out = HEADER.replaceAll("{{SLUG}}", def.slug).replaceAll(
    "{{TITLE}}",
    title,
  );
  out += `
Hide
Type "cd ${def.workdir}"
Enter
Sleep 300ms
Type "export PS1='\\[\\e[1;36m\\]${def.prompt}\\[\\e[0m\\] \\[\\e[1;32m\\]❯\\[\\e[0m\\] '"
Enter
Sleep 100ms
Type "clear"
Enter
Show
`;

  def.scenes.forEach((scene, i) => {
    if (i > 0) {
      out += `
Hide
Type "clear"
Enter
Show
`;
    }
    out += `
${scene.comment}
Type "${scene.comment}"
Enter
`;
    for (const cmd of scene.cmds) {
      // Prefer backtick form when the command contains double quotes
      if (cmd.includes('"')) {
        out += `Type \`${cmd.replace(/`/g, "\\`")}\`\nEnter\n`;
      } else {
        out += `Type "${cmd}"\nEnter\n`;
      }
    }
    out += `Sleep ${scene.sleep ?? "2s"}\n`;
  });

  return out;
}

function renderSrt(def) {
  let t = 0;
  const cues = [];
  def.scenes.forEach((scene, i) => {
    const dur = estimateSceneDurationMs(scene);
    const [line1, line2] = def.captions[i] ?? [
      scene.comment.replace(/^#\s*\d+\.\s*/, ""),
      "rgctl CoolStore walkthrough",
    ];
    const start = t + (i === 0 ? 0 : 40);
    const end = t + dur - 40;
    cues.push({ i: i + 1, start, end, line1, line2 });
    t += dur;
  });

  return cues
    .map(
      (c) =>
        `${c.i}\n${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}\n${c.line1}\n${c.line2}\n`,
    )
    .join("\n");
}

mkdirSync(guidesDir, { recursive: true });

const slugs = only ? [only] : Object.keys(tapes);
let n = 0;
for (const slug of slugs) {
  const def = tapes[slug];
  if (!def) {
    console.error(`unknown slug: ${slug}`);
    process.exit(1);
  }
  if (!manifest.guides.some((g) => g.slug === slug)) {
    console.warn(`[gen] warning: ${slug} missing from manifest.json`);
  }
  writeFileSync(join(guidesDir, `${slug}.tape`), renderTape(def));
  writeFileSync(join(guidesDir, `${slug}.srt`), renderSrt(def));
  console.log(`[gen] ${slug}.tape + ${slug}.srt`);
  n += 1;
}

// ensure every manifest guide has a tape def
for (const g of manifest.guides) {
  if (!tapes[g.slug]) {
    console.warn(`[gen] missing tape definition for manifest slug: ${g.slug}`);
  }
}

console.log(`[gen] wrote ${n} guide tape(s) → ${guidesDir}`);
