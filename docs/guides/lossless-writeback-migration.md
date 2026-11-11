# Lossless Write-Back and Framework Migration

## Introduction

Modernizing a codebase (such as migrating Java EE `javax.*` to Jakarta EE / Quarkus, upgrading Spring Boot or NestJS decorators, or refactoring Rust / C# / PHP attributes) requires two capabilities that traditional text search cannot provide:

1. **Structural migration census & impact analysis:** Knowing every imported legacy namespace (`inventory --by import-prefix`), every stereotype or decorator with its exact raw arguments (`find --annotation ... --show-attributes`), every dependency-injection or route edge (`relations --edge injects|exposesroute`), and the class-level upstream blast radius (`blast-radius <Container> --summary` and `callers <Container>`).
2. **Lossless, syntax-gated code write-back:** Applying token-aware renames or structured byte-span edit plans (`rgctl writeback`) backed by Zstd-compressed original source frames (`.rgctl/content_store.bin`) and a Succinct Green Concrete Syntax Tree archive (`.rgctl/cst.archive.bin`), verified with 32-byte BLAKE3 digests and tree-sitter re-parse gates so comments, formatting, and untouched byte spans remain 100% intact.

## Use Cases

- **Framework & namespace upgrades.** Inventory all `javax.*`, `@nestjs/*`, `tokio::*`, or `Symfony\*` imports and inspect every annotated class/method before generating edit plans.
- **Container-level risk assessment.** Compute blast radius and upstream callers across an entire `Class`, `Interface`, `Struct`, `Enum`, or `Module` (aggregating all member methods and DI `Injects` edges) before modifying a service bean.
- **Deterministic refactoring & agent write-back.** Verify byte-identical source reconstruction (`writeback verify`), preview or apply token-aware renames (`writeback patch --rename`), apply multi-file JSON span plans (`writeback patch --plan`), or reconstruct a working tree solely from `.rgctl/` (`writeback export`).

## Example Project

This guide uses **CoolStore** (`example/coolstore`), a Java EE e-commerce monolith with EJB stereotypes (`@Stateful`, `@Stateless`, `@MessageDriven`), CDI `@Inject` wiring, JPA entities, and JAX-RS endpoints.

## Step-by-Step

### 1. Index with Lossless CST and Content Sidecars

Pass `--lossless` (or set `RGCTL_LOSSLESS=1`) during `discover` to write `.rgctl/content_store.bin` (`RGCS` v2) and `.rgctl/cst.archive.bin` (`RGCT` v1) alongside `.rgctl/graph.snapshot.bin`:

```bash
rgctl -r example/coolstore -f json discover . -l java --lossless | jq '{command, metrics}'
```

**Output:**

```json
{
  "command": "discover",
  "metrics": {
    "files_discovered": 26,
    "files_indexed": 26,
    "files_skipped": 0,
    "nodes_generated": 548,
    "edges_generated": 1680,
    "duration_ms": 395
  }
}
```

Every symbol node in `graph.snapshot.bin` also records Red-Green byte spans (`start_byte`, `end_byte`, `name_start_byte`, `name_end_byte`), while the worker's already-parsed `tree_sitter::Tree` and precomputed BLAKE3 digest are reused with zero double-parsing.

### 2. Run a Namespace Import-Prefix Census

Use `inventory --by import-prefix` to group `Import` nodes by two-segment package/namespace prefix (or filter with `--prefix`):

```bash
rgctl -r example/coolstore -f json inventory --by import-prefix --prefix javax. | jq '.counts'
```

**Output:**

```json
[
  { "key": "javax.persistence", "count": 30 },
  { "key": "javax.ws", "count": 17 },
  { "key": "javax.ejb", "count": 13 },
  { "key": "javax.inject", "count": 11 },
  { "key": "javax.enterprise", "count": 9 },
  { "key": "javax.jms", "count": 8 },
  { "key": "javax.json", "count": 6 },
  { "key": "javax.annotation", "count": 3 },
  { "key": "javax.naming", "count": 3 },
  { "key": "javax.xml", "count": 1 }
]
```

#### Cross-Language Import-Prefix Normalization

`inventory --by import-prefix` works across all Tier-1 languages by normalizing language-specific import statements and separators:

| Ecosystem | Import forms normalized | Separator | Example prefix key |
|-----------|-------------------------|-----------|--------------------|
| Java / Kotlin / Scala / Groovy | `import`, `import static` | `.` | `javax.persistence`, `org.springframework` |
| Python | `import a.b`, `from a.b.c import X` | `.` | `fastapi.routing` |
| C# | `using`, `global using`, `using static`, alias `=` | `.` | `Microsoft.AspNetCore` |
| Rust / C++ | `use a::b::c`, `#include <a::b>` | `::` | `tokio::sync`, `serde::de` |
| Go / TS / JS / Ruby / C | `import "pkg/sub"`, `from '@scope/pkg'` | `/` | `@nestjs/common`, `github.com/gin-gonic` |
| PHP | `use App\Service\Cart;` | `\` | `App\Service`, `Symfony\Component` |

### 3. Inspect Stereotypes, Decorators, and Raw Attributes

Pass `--annotation` (comma-separated list) with `--show-attributes` to find all symbols annotated with target stereotypes and join their raw source arguments from `.rgctl/annotation_args.json`:

```bash
rgctl -r example/coolstore -f json find \
  --annotation Stateless,Singleton,Stateful,MessageDriven \
  --show-attributes \
  | jq '.entities[:5] | map({name, type, file, attributes})'
```

**Output:**

```json
[
  {
    "name": "ShoppingCartService",
    "type": "class",
    "file": "src/main/java/com/redhat/coolstore/service/ShoppingCartService.java",
    "attributes": "@Stateful"
  },
  {
    "name": "ShippingService",
    "type": "class",
    "file": "src/main/java/com/redhat/coolstore/service/ShippingService.java",
    "attributes": "@Stateless"
  },
  {
    "name": "OrderServiceMDB",
    "type": "class",
    "file": "src/main/java/com/redhat/coolstore/service/OrderServiceMDB.java",
    "attributes": "@MessageDriven(name = \"OrderServiceMDB\", activationConfig = {\n\t@ActivationConfigProperty(propertyName = \"destinationLookup\", propertyValue = \"topic/orders\"),\n\t@ActivationConfigProperty(propertyName = \"destinationType\", propertyValue = \"javax.jms.Topic\"),\n\t@ActivationConfigProperty(propertyName = \"acknowledgeMode\", propertyValue = \"Auto-acknowledge\")})"
  },
  {
    "name": "ProductService",
    "type": "class",
    "file": "src/main/java/com/redhat/coolstore/service/ProductService.java",
    "attributes": "@Stateless"
  },
  {
    "name": "ShoppingCartOrderProcessor",
    "type": "class",
    "file": "src/main/java/com/redhat/coolstore/service/ShoppingCartOrderProcessor.java",
    "attributes": "@Stateless"
  }
]
```

> **Cross-language wrappers:** `--annotation` normalizes `@Ann`, `@file:Ann`, `#[attr]`, `#[ns::attr]`, and `[Attr]` across `.`, `::`, and `\`. Unqualified queries (`--annotation Route`) match any namespace, while qualified queries (`--annotation javax.ws.rs.Path` or `--annotation tokio::main`) strictly match the specified namespace.

### 4. Trace DI Wiring and Container-Level Blast Radius

Run a seedless `relations` scan to list all CDI `@Inject` / `@PersistenceContext` edges or HTTP route exposures across the repository:

```bash
rgctl -r example/coolstore -f json relations --edge injects --direction out \
  | jq '{total, sample: [.edges[:4][] | {source: .source.name, target: .target.name}]}'
```

Before changing a stateful EJB like `ShoppingCartService` (for example, converting `@Stateful` to `@ApplicationScoped` or `@RequestScoped`), measure the **container-level** blast radius and callers across the entire class:

```bash
rgctl -r example/coolstore -f json blast-radius ShoppingCartService --depth 2 --summary \
  | jq '{target: .target.symbol, score, distance_buckets}'

rgctl -r example/coolstore -f json callers ShoppingCartService --depth 2 \
  | jq '{total, callers: [.callers[:4][] | {name, type}]}'
```

**Output:**

```json
{
  "target": "ShoppingCartService",
  "score": 40.45,
  "distance_buckets": {
    "direct": 6,
    "transitive": 3,
    "impact_zone_size": 9
  }
}
{
  "total": 10,
  "callers": [
    { "name": "set", "type": "function" },
    { "name": "add", "type": "function" },
    { "name": "delete", "type": "function" },
    { "name": "dedupeCartItems", "type": "function" }
  ]
}
```

When given a `Class`, `Interface`, `Struct`, `Enum`, or `Module`, both `blast-radius` and `callers` automatically aggregate incoming `Calls` across all member functions/methods as well as incoming `Injects` edges targeting the container.

### 5. Verify Sidecars and Apply Lossless Write-Back Patches

Verify that `.rgctl/content_store.bin` and `.rgctl/cst.archive.bin` match the working tree with 100% BLAKE3 byte identity:

```bash
rgctl -r example/coolstore -f json writeback verify \
  | jq '{files_processed, files_verified_identical}'
```

**Output:**

```json
{
  "files_processed": 26,
  "files_verified_identical": 26
}
```

Preview a CST token-aware symbol rename across the codebase with `--dry-run`:

```bash
rgctl -r example/coolstore -f json writeback patch \
  --rename ShoppingCartOrderProcessor=CartOrderProcessor \
  --dry-run \
  | jq '{files_processed, edits_applied, entries: [.entries[] | {file, status}]}'
```

**Output:**

```json
{
  "files_processed": 2,
  "edits_applied": 2,
  "entries": [
    {
      "file": "src/main/java/com/redhat/coolstore/service/ShoppingCartOrderProcessor.java",
      "status": "patched_verified"
    },
    {
      "file": "src/main/java/com/redhat/coolstore/service/ShoppingCartService.java",
      "status": "patched_verified"
    }
  ]
}
```

For multi-span framework edits (such as replacing imports or rewriting annotations discovered via `find --show-attributes`), pass a JSON mutation plan to `writeback patch --plan`:

```json
{
  "mutations": [
    {
      "file": "src/main/java/com/redhat/coolstore/service/ShippingService.java",
      "start_byte": 195,
      "end_byte": 205,
      "replacement": "@ApplicationScoped"
    }
  ]
}
```

```bash
# Preview, write to a separate directory, or apply in-place:
rgctl -r example/coolstore -f json writeback patch --plan mutations.json --dry-run
rgctl -r example/coolstore -f json writeback patch --plan mutations.json --output ./patched
rgctl -r example/coolstore -f json writeback patch --plan mutations.json --in-place
```

Every modified file is spliced in reverse byte-offset order (`end_byte` descending) and re-parsed with the language's tree-sitter grammar before touching disk—any edit that introduces syntax `ERROR` or `MISSING` nodes is rejected with `syntax_error_rejected` in the `TrustLedgerReport`.

## Related Guides

- [Structured graph queries](structured-query.md) -- `find`, `callers`, `callees`, `relations`, and `inventory`
- [Migration Planning](migration-planning.md) -- topological community extraction roadmap (`discover --export-migration-hints`)
- [Blast Radius Analysis](blast-radius-analysis.md) -- upstream impact scoring
- [Dependency Injection and Frameworks](dependency-injection-and-frameworks.md) -- `ExposesRoute` and `Injects` edges
