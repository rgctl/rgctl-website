# Kantra Migration Rules

## Introduction

rgctl evaluates [Konveyor Kantra](https://github.com/konveyor/kantra) rules **natively** against the session graph and source cache — no Kantra CLI, LSP, or containers. Release binaries embed the Konveyor `stable/java` catalog (~2.6k rules).

The workflow that ships with recent builds is:

1. **Index once** with `discover` (optionally `--with-kantra` to eval in the same pass).
2. **Or** index first, then run **`rgctl rules run`** against the existing `.rgctl/graph.snapshot.bin` (embedded catalog when you omit the ruleset directory).
3. **Query by migration target** with `rules targets` and `rules findings --target …` — one full eval, many filtered views. Findings are token-compact for agents (`summary`, `per_rule[]`, truncated `violations[]`).

This guide walks that loop on a **large Java corpus**.

## Use Cases

- **Target-scoped migration readiness.** Answer “what would Quarkus / EAP 8 / OpenJDK 17+ rules hit?” without re-running the catalog for each label.
- **Agent-friendly Kantra triage.** Keep LLM context small: `summary` + unique rule metadata in `per_rule[]`, then page through `--limit` violations.
- **Post-discover overlays.** Re-eval after `discover` with `rules run` (optional `--target`) without wiping the structural graph.
- **Catalog inventory.** List every `konveyor.io/target` / `konveyor.io/source` in the embedded catalog, with hit counts once findings exist.
- **Dashboard Static rules.** Pair with `discover --with-kantra --with-universe` and open the Universe **Static rules** room in `rgctl serve --open`.

## Example Project

This guide uses **metasfresh 4.9.8b** (`example/metasfresh-4.9.8b` in the [rgctl product repo](https://github.com/rgctl/rgctl)) — an old public snapshot of the [metasfresh](https://github.com/metasfresh/metasfresh) ERP codebase used as a **scale corpus** for discover / Kantra gates.

> **Not a product judgment.** Numbers below come from this **very old** checkout on purpose. They stress a large Java tree and the embedded Kantra catalog; they are **not** a statement about current metasfresh quality, modernity, or migration readiness. Prefer a current tree (or your own monolith) for real planning.

### Corpus size (this snapshot)

After `discover` + embedded-catalog `rules run` on the machine used for this guide:

| Metric | Value |
|--------|------:|
| File nodes | **~10,941** (`inventory --by type`) |
| Graph nodes | **~321,647** (includes indexed `KantraRule` nodes after eval) |
| Graph edges | **~1,131,421** |
| Functions / classes | **~133,961** / **~10,667** |
| Embedded rules evaluated | **2,656** (`rules run`) |
| Violations (all targets) | **110,942** across **65** rules / **16,918** files |
| Wall time (`rules run`) | **~1 minute** on a recent Apple Silicon laptop (eval only; discover is separate) |

Fetch the corpus (product repo):

```bash
# from the rgctl checkout
./scripts/fetch-profile-repos.sh   # or clone metasfresh 4.9.8b into example/metasfresh-4.9.8b
cd example/metasfresh-4.9.8b
```

## Step-by-Step

### 1. Discover the graph (once)

Build the structural index. Kantra does **not** require `--with-cfg`.

```bash
cd example/metasfresh-4.9.8b
rgctl discover . --full
# --full includes --with-kantra (plus CFG, Universe, harmonic, taint)

# Kantra-only after a basic discover:
# rgctl discover . --with-kantra
```

**Status after a warm `--full` index (JSON):**

```bash
rgctl -f json status | jq '{status, schema_version, nodes, edges, kantra_findings, index_current}'
```

**Output (after `--full`):** `kantra_findings` is `true` (deep stage already evaluated the embedded catalog). Example:

```json
{
  "status": "ok",
  "schema_version": 3,
  "nodes": 321647,
  "edges": 1131421,
  "kantra_findings": true,
  "index_current": true
}
```

**What happened:** tree-sitter Java extraction filled `.rgctl/graph.snapshot.bin`. `--full` builds deep overlays including Kantra; for Kantra alone after a basic discover, `discover . --with-kantra` or `rgctl rules run` is enough.

### 2. Evaluate the embedded catalog (`rules run`)

Omit the ruleset directory to use the compiled-in Konveyor `stable/java` catalog. This writes `.rgctl/kantra_findings.json` and indexes `KantraRule` / `KantraRuleset` nodes into the snapshot.

```bash
rgctl -f json rules run | jq '{
  schema_version, command, catalog_id,
  evaluated_rules, skipped_rules_count,
  summary, returned_violations
}'
```

**Output (metasfresh 4.9.8b, truncated):**

```json
{
  "schema_version": 2,
  "command": "rules_run",
  "catalog_id": "stable-java@022bbd34b34eca53d04b6cb2b97b27e47fef479b",
  "evaluated_rules": 2656,
  "skipped_rules_count": 16,
  "summary": {
    "unique_files": 16918,
    "unique_rules": 65,
    "violations": 110942
  },
  "returned_violations": 50
}
```

**What this tells you:**

- **One pass, all targets.** Hits for `quarkus`, `eap8`, `openjdk17+`, `cloud-readiness`, … share the same findings file.
- **Token-compact stdout.** Full violation lists are huge (~110k here); JSON keeps a `summary`, deduplicated `per_rule[]`, and a capped `violations` sample (`returned_violations`: 50). Use `rules findings` to page/filter.
- **Skipped rules** (unsupported providers / bad patterns) are counted, not dumped raw on the compact path.

Optional filters at eval time:

```bash
rgctl -f json rules run --target quarkus
# or a local tree instead of the embed:
# rgctl -f json rules run --catalog /path/to/rulesets/stable/java
```

Equivalent during discover:

```bash
rgctl discover . --with-kantra
rgctl discover . --with-kantra --kantra-target quarkus
```

### 3. List catalog targets and hit counts (`rules targets`)

```bash
rgctl -f json rules targets | jq '{
  schema_version, findings_present, catalog_id,
  targets: [
    .targets[]
    | select(.name=="quarkus" or .name=="eap8"
        or .name=="cloud-readiness" or .name=="openjdk17+"
        or .name=="openjdk11+" or .name=="discovery")
    | {name, rules, hits}
  ]
}'
```

**Output:**

```json
{
  "schema_version": 1,
  "findings_present": true,
  "catalog_id": "stable-java@022bbd34b34eca53d04b6cb2b97b27e47fef479b",
  "targets": [
    { "name": "cloud-readiness", "rules": 24, "hits": 1273 },
    { "name": "discovery", "rules": 10, "hits": 9544 },
    { "name": "eap8", "rules": 235, "hits": 50667 },
    { "name": "openjdk11+", "rules": 17, "hits": 173 },
    { "name": "openjdk17+", "rules": 13, "hits": 8 },
    { "name": "quarkus", "rules": 243, "hits": 163 }
  ]
}
```

**What this tells you:** `rules` is catalog size for that label; `hits` is how many violations in `kantra_findings.json` carry that `konveyor.io/target`. Large `eap8` / `discovery` counts on an ancient ERP tree are expected — use them as **filters**, not as a scorecard for the project.

### 4. Filter findings by target (`rules findings`)

```bash
rgctl -f json rules findings --target quarkus --limit 2 | jq '{
  schema_version, total_matched, summary,
  per_rule: [.per_rule[:2][] | {rule_id, category, effort, targets, message}],
  violations: [.violations[:2][] | {rule_id, file, line, category, effort, targets}]
}'
```

**Output (paths relative to the repo root):**

```json
{
  "schema_version": 1,
  "total_matched": 163,
  "summary": {
    "unique_files": 70,
    "unique_rules": 5,
    "violations": 163
  },
  "per_rule": [
    {
      "rule_id": "jdbc-jpa-mixed-to-quarkus-00002",
      "category": "optional",
      "effort": 3,
      "targets": ["quarkus"],
      "message": "Direct JDBC Connection usage detected."
    },
    {
      "rule_id": "jdbc-jpa-mixed-to-quarkus-00003",
      "category": "optional",
      "effort": 3,
      "targets": ["quarkus"],
      "message": "Direct JDBC Statement usage detected."
    }
  ],
  "violations": [
    {
      "rule_id": "jdbc-jpa-mixed-to-quarkus-00002",
      "file": "de.metas.adempiere.adempiere/base/src/main/java-legacy/org/adempiere/pipo/PackInHandler.java",
      "line": 26,
      "category": "optional",
      "effort": 3,
      "targets": ["quarkus"]
    },
    {
      "rule_id": "jdbc-jpa-mixed-to-quarkus-00002",
      "file": "de.metas.adempiere.adempiere/base/src/main/java-legacy/org/adempiere/pipo/handler/ColumnElementHandler.java",
      "line": 21,
      "category": "optional",
      "effort": 3,
      "targets": ["quarkus"]
    }
  ]
}
```

**What this tells you:**

- **`total_matched` / `summary`** are computed over the **full** matched set **before** `--limit` truncates `violations[]`.
- **`per_rule[]`** carries `message`, `category`, `effort`, and `targets` once per rule so individual violation rows stay small for agents.
- **`--limit`** only caps the violation sample, not the summary math.

### 5. Combine target, category, and file filters

Mandatory OpenJDK 17+ hits on this corpus (still the old snapshot — illustrative only):

```bash
rgctl -f json rules findings --target openjdk17+ --category mandatory --limit 2
```

**Output (trimmed):**

```json
{
  "total_matched": 8,
  "summary": {
    "unique_files": 8,
    "unique_rules": 2,
    "violations": 8
  },
  "per_rule": [
    {
      "rule_id": "applet-api-deprecation-00000",
      "category": "mandatory",
      "effort": 3,
      "targets": ["openjdk17+", "openjdk", "spring6+"],
      "message": "The Java Applet API has been deprecated and will be removed in future releases, since modern web browsers no longer support Java applets any references to it should be removed."
    },
    {
      "rule_id": "security-manager-deprecation-00060",
      "category": "mandatory",
      "effort": 5,
      "targets": ["openjdk17+", "openjdk"],
      "message": "The java.util.concurrent.Executors::{{methodNames}} method has been deprecated in Java 17. "
    }
  ],
  "violations": [
    {
      "rule_id": "applet-api-deprecation-00000",
      "file": "de.metas.adempiere.adempiere/client/src/main/java-legacy/org/compiere/apps/AApplet.java",
      "line": 19,
      "category": "mandatory"
    },
    {
      "rule_id": "applet-api-deprecation-00000",
      "file": "de.metas.adempiere.adempiere/base/src/main/java-legacy/org/compiere/util/MimeType.java",
      "line": 222,
      "category": "mandatory"
    }
  ]
}
```

File substring filter (any target):

```bash
rgctl -f json rules findings --file OrderBL --limit 5 | jq '{total_matched, summary}'
```

Comma-separated OR on targets/sources:

```bash
rgctl -f json rules findings --target 'quarkus,cloud-readiness' --limit 5
rgctl -f json rules findings --source 'eap7' --limit 5
```

### 6. Optional: graph edges and the dashboard

After eval, `violates` edges link rules to matched code nodes:

```bash
rgctl -f json find --type kantrarule --limit 5 | jq '{returned}'
rgctl -f json relations --edge violates --from-type kantrarule --limit 10 | jq '{returned}'
```

For the browser UI:

```bash
rgctl discover . --with-kantra --with-universe
rgctl serve --open
# open the Static rules room — category + Konveyor target filters
```

## Flags cheat sheet

| Command / flag | Purpose |
|----------------|---------|
| `discover --with-kantra` | Eval + index rules during discover |
| `--kantra-target NAME` | Eval only rules labeled `konveyor.io/target=NAME` |
| `--kantra-rules DIR` | Single ruleset directory (CI / fixtures) |
| `--kantra-catalog ROOT` | Local `stable/java`-style tree instead of the embed |
| `--kantra-index-only` | Index catalog nodes; skip eval |
| `rules run [DIR]` | Post-discover eval; omit `DIR` → embedded catalog |
| `rules run --target` / `--catalog` | Narrow eval or override catalog |
| `rules targets` | Catalog labels (+ hit counts when findings exist) |
| `rules findings --target/--source/--category/--file/--limit` | Token-compact filtered query |

## Benefits

- **Native Kantra at scale.** Embedded ~2.6k-rule catalog on 10k+ file graphs without containers.
- **Eval once, filter many times.** Target/source/category/file queries over `.rgctl/kantra_findings.json`.
- **Agent-sized JSON.** Summaries and `per_rule[]` metadata before truncated violation rows.
- **Honest large-corpus demos.** metasfresh 4.9.8b shows real wall time and hit volumes — without pretending the snapshot is a modern product baseline.

## Related Guides

- [Discovering and Indexing a Codebase](discovering-and-indexing.md) — `discover` flags including `--with-kantra`
- [Migration Planning](migration-planning.md) — strangler-fig roadmap (`--export-migration-hints`); Kantra is the rules overlay
- [Dependency Injection and Frameworks](dependency-injection-and-frameworks.md) — `Injects` / `ExposesRoute` edges that often sit next to migration work
- [Agent pack](agent-skill.md) — `/rgctl:migrate` and Kantra as an optional target matrix
- [CLI Command Reference](cli-command-reference.md) — full verb taxonomy
