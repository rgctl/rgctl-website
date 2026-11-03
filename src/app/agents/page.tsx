import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TerminalBlock } from "@/components/terminal";
import { GITHUB_REPO } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Agents",
};

const steps = [
  {
    n: "1",
    title: "Install the pack",
    body: "rgctl install --skill writes rgctl plus rgctl-review / rgctl-vuln / rgctl-migrate (and /rgctl:* slash commands).",
  },
  {
    n: "2",
    title: "Discover once",
    body: "rgctl discover . builds {repo}/.rgctl/ — later questions are graph lookups, not full-repo reads.",
  },
  {
    n: "3",
    title: "Ask in natural language",
    body: "The agent loads the rgctl skill (or /rgctl:review · /rgctl:vuln · /rgctl:migrate) and runs rgctl -f json.",
  },
  {
    n: "4",
    title: "Reason from JSON",
    body: "Parse schema_version on stdout — then edit, and re-check with review check / check when needed.",
  },
];

const topics = [
  {
    title: "Index",
    blurb: "Build or refresh the graph (SCIP / git churn optional).",
    cli: "discover · update · watch · merge",
  },
  {
    title: "Impact",
    blurb: "Upstream blast radius and callers.",
    cli: "blast-radius · callers · relations",
  },
  {
    title: "Data flow",
    blurb: "Lazy slices, mutations, CPG flows.",
    cli: "slice · cpg · inspect",
  },
  {
    title: "Search",
    blurb: "Symbol lookup and semantic query.",
    cli: "find · inventory · semantic query",
  },
  {
    title: "Migration",
    blurb: "Strangler-Fig brief and extraction order.",
    cli: "/rgctl:migrate · discover --export-migration-hints",
  },
  {
    title: "Vuln / OSV",
    blurb: "Advisory triage, reachability, OpenVEX.",
    cli: "/rgctl:vuln · vuln · deps · taint",
  },
  {
    title: "PR review",
    blurb: "Call-path deltas and REVIEW_REPORT.md.",
    cli: "/rgctl:review · review paths · review check",
  },
];

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Badge className="mb-4">Agent pack</Badge>
      <h1 className="text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
        Built for coding agents
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--body)]">
        Install the{" "}
        <strong className="font-medium text-[var(--ink)]">agent pack</strong>:
        core skill <code className="font-mono text-sm">rgctl</code> for
        day-to-day graph questions, plus three slash workflows —{" "}
        <code className="font-mono text-sm">/rgctl:review</code>,{" "}
        <code className="font-mono text-sm">/rgctl:vuln</code>,{" "}
        <code className="font-mono text-sm">/rgctl:migrate</code>. Agents answer
        with <code className="font-mono text-sm">rgctl -f json</code> instead of
        dumping whole files into context.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg text-[var(--ink)]">Install into your repo</h2>
        <TerminalBlock
          lines={[
            "cd /path/to/your-app",
            "rgctl install --skill --tools cursor,claude,codex,antigravity,agents",
            "rgctl discover .",
            "# Optional: remove leftover rgctl-discover / rgctl-impact / … dirs from older packs",
          ]}
        />
        <p className="text-sm text-[var(--mute)]">
          Writes{" "}
          <code className="font-mono">.cursor/skills/rgctl/</code>, companion
          skills, and{" "}
          <code className="font-mono">.cursor/commands/rgctl-*.md</code> (and
          the equivalent paths for other adapters). Optional{" "}
          <code className="font-mono">--with-policy</code> adds a Cursor
          structural-rules snippet. Full flags:{" "}
          <Link href="/docs/guides/agent-skill/" className="underline">
            agent pack guide
          </Link>
          .
        </p>
      </section>

      <ol className="mt-10 grid gap-4 sm:grid-cols-2">
        {steps.map((s) => (
          <li
            key={s.n}
            className="rounded-[4px] border border-[var(--hairline)] p-4"
          >
            <p className="font-mono text-[11px] text-[var(--mute)]">
              Step {s.n}
            </p>
            <h2 className="mt-1 text-base text-[var(--ink)]">{s.title}</h2>
            <p className="mt-1 text-sm text-[var(--body)]">{s.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="text-lg text-[var(--ink)]">What the pack covers</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--body)]">
          Day-to-day routing lives in meta skill{" "}
          <code className="font-mono text-xs">rgctl</code> (
          <code className="font-mono text-xs">references/workflows.md</code>).
          Review, vuln, and migrate use dedicated skills / slash commands. The
          engine is still the terminal CLI.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((w) => (
            <div
              key={w.title}
              className="flex flex-col rounded-[4px] border border-[var(--hairline)] bg-[var(--canvas-soft)]/50 p-5"
            >
              <h3 className="text-base font-medium text-[var(--ink)]">
                {w.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--body)]">{w.blurb}</p>
              <p className="mt-3 font-mono text-[11px] text-[var(--mute)]">
                {w.cli}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="text-lg text-[var(--ink)]">Minimal agent loop</h2>
        <TerminalBlock
          lines={[
            'export REPO=/path/to/repo',
            'cd "$REPO" && rgctl discover .',
            'rgctl -r "$REPO" -f json find --type function --count-only | jq \'.total\'',
            'rgctl -r "$REPO" -f json find priceShoppingCart --exact | jq \'.entities[0]\'',
            'rgctl -r "$REPO" -f json blast-radius priceShoppingCart \\',
            "  | jq '{score: .metrics.score, callers: .metrics.direct_callers_count}'",
          ]}
        />
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/docs/guides/agent-skill/">Agent pack guide</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/docs/guides/structured-query/">Structured queries</Link>
        </Button>
        <Button variant="ghost" asChild>
          <a
            href={`${GITHUB_REPO}/blob/main/docs/agents/USER_AGENTS_TEMPLATE.md`}
            target="_blank"
            rel="noreferrer"
          >
            USER_AGENTS_TEMPLATE
          </a>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/install/">Install rgctl</Link>
        </Button>
      </section>
    </div>
  );
}
