import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  coverageHandledCount,
  formatExtensions,
  HANDLER_ORDER,
  listLanguages,
} from "@/lib/languages";
import { GITHUB_REPO } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Languages · Docs",
};

export default function LanguagesIndexPage() {
  const languages = listLanguages();
  const tier1 = languages.filter((l) => (l.tier ?? 1) === 1);
  const tier2 = languages.filter((l) => l.tier === 2 && !l.structural);
  const structural = languages.filter((l) => l.structural);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Badge className="mb-4">Language support</Badge>
      <h1 className="text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
        Languages ({languages.length})
      </h1>
      <p className="mt-3 max-w-3xl text-[var(--body)]">
        rgctl ships with <strong>{tier1.length} Tier-1 custom AST plugins</strong>{" "}
        (<code className="text-sm">handler = &quot;custom&quot;</code>, verified by{" "}
        <code className="text-sm">*-ast-coverage.json</code> manifests),{" "}
        <strong>{tier2.length} Tier-2 declarative query plugins</strong> (
        <code className="text-sm">handler = &quot;queries&quot;</code>, powered by{" "}
        <code className="text-sm">QueryLanguagePlugin</code> and{" "}
        <code className="text-sm">queries/tags.scm</code>)
        {structural.length > 0 && (
          <>
            , and{" "}
            <strong>
              {structural.length} Mainframe &amp; batch structural extractors
            </strong>{" "}
            (COBOL, PL/I, and JCL)
          </>
        )}
        .
      </p>
      <p className="mt-2 text-sm text-[var(--mute)]">
        Architecture &amp; contributor docs:{" "}
        <Link href="/docs/tier-1-language-support/" className="underline">
          Tier 1 language support
        </Link>
        {" · "}
        <Link href="/docs/tier-2-language-support/" className="underline">
          Tier 2 language support
        </Link>
        . Plugin crates live under{" "}
        <a
          href={`${GITHUB_REPO}/tree/main/crates`}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          crates/rgctl-lang-*
        </a>
        .
      </p>

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-medium text-[var(--ink)]">
            Tier 1 — Custom AST Plugins ({tier1.length})
          </h2>
          <Link
            href="/docs/tier-1-language-support/"
            className="text-xs text-[var(--mute)] underline"
          >
            Tier 1 requirements &amp; Layer F checklist →
          </Link>
        </div>
        <p className="mt-1 text-sm text-[var(--mute)]">
          Dedicated <code className="text-xs">LanguagePlugin</code>{" "}
          implementations with grammar-verified{" "}
          <code className="text-xs">*-ast-coverage.json</code> manifests, call
          graphs, inheritance/MRO, CFG/PDG, taint rules, and hybrid CPG support.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-left text-[var(--mute)]">
                <th className="p-2 font-medium">Language</th>
                <th className="p-2 font-medium">Extensions</th>
                <th className="p-2 font-medium">Grammar</th>
                <th className="p-2 font-medium">Kinds</th>
                <th className="p-2 font-medium">Handled</th>
                <th className="p-2 font-medium">Skip</th>
              </tr>
            </thead>
            <tbody>
              {tier1.map((lang) => {
                const handled = coverageHandledCount(lang.handlerCounts);
                const skip = lang.handlerCounts.Skip ?? 0;
                return (
                  <tr
                    key={lang.id}
                    className="border-b border-[var(--hairline)] text-[var(--body)]"
                  >
                    <td className="p-2">
                      <Link
                        href={`/docs/languages/${lang.id}/`}
                        className="font-medium text-[var(--ink)] underline"
                      >
                        {lang.displayName}
                      </Link>
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {formatExtensions(lang.extensions)}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {lang.grammar || "—"}
                    </td>
                    <td className="p-2">{lang.kindCount}</td>
                    <td className="p-2">{handled}</td>
                    <td className="p-2">{skip}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <h3 className="mt-8 text-base font-medium text-[var(--ink)]">
        Tier 1 handler legend
      </h3>
      <ul className="mt-3 grid gap-2 text-sm text-[var(--body)] sm:grid-cols-2">
        {HANDLER_ORDER.map((h) => (
          <li
            key={h}
            className="rounded-[4px] border border-[var(--hairline)] p-3"
          >
            <span className="font-mono text-[var(--ink)]">{h}</span>
            <span className="mt-1 block text-[var(--mute)]">
              {handlerBlurb(h)}
            </span>
          </li>
        ))}
      </ul>

      {tier2.length > 0 && (
        <section className="mt-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-medium text-[var(--ink)]">
              Tier 2 — Declarative Query Plugins ({tier2.length})
            </h2>
            <Link
              href="/docs/tier-2-language-support/"
              className="text-xs text-[var(--mute)] underline"
            >
              How Tier 2 tags.scm queries work →
            </Link>
          </div>
          <p className="mt-1 text-sm text-[var(--mute)]">
            Driven by <code className="text-xs">QueryLanguagePlugin</code> (
            <code className="text-xs">rgctl-lang-runtime</code>) and precompiled{" "}
            <code className="text-xs">queries/tags.scm</code> files validated
            against the Tier-2 capture vocabulary (
            <code className="text-xs">@definition.*</code>,{" "}
            <code className="text-xs">@reference.call</code>,{" "}
            <code className="text-xs">@reference.class</code>,{" "}
            <code className="text-xs">@reference.implementation</code>,{" "}
            <code className="text-xs">@import.path</code>).
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--hairline)] text-left text-[var(--mute)]">
                  <th className="p-2 font-medium">Language</th>
                  <th className="p-2 font-medium">Extensions</th>
                  <th className="p-2 font-medium">Grammar Crate</th>
                  <th className="p-2 font-medium">Captures</th>
                  <th className="p-2 font-medium">Function / Class Kinds</th>
                </tr>
              </thead>
              <tbody>
                {tier2.map((lang) => {
                  const kinds = [
                    ...(lang.functionKinds ?? []),
                    ...(lang.classKinds ?? []),
                  ];
                  return (
                    <tr
                      key={lang.id}
                      className="border-b border-[var(--hairline)] text-[var(--body)]"
                    >
                      <td className="p-2">
                        <Link
                          href={`/docs/languages/${lang.id}/`}
                          className="font-medium text-[var(--ink)] underline"
                        >
                          {lang.displayName}
                        </Link>
                      </td>
                      <td className="p-2 font-mono text-xs">
                        {formatExtensions(lang.extensions)}
                      </td>
                      <td className="p-2 font-mono text-xs">
                        {lang.grammarCrate || lang.grammar || "—"}
                      </td>
                      <td className="p-2 font-mono text-xs">
                        {(lang.captures ?? []).length} captures
                      </td>
                      <td className="p-2 font-mono text-xs text-[var(--mute)]">
                        {kinds.length ? kinds.join(", ") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {structural.length > 0 && (
        <section className="mt-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-medium text-[var(--ink)]">
              Mainframe &amp; Batch Structural Plugins ({structural.length})
            </h2>
            <Link
              href="/docs/tier-1-language-support/#mainframe-triad"
              className="text-xs text-[var(--mute)] underline"
            >
              Mainframe triad architecture →
            </Link>
          </div>
          <p className="mt-1 text-sm text-[var(--mute)]">
            Custom structural extractors for z/OS mainframe modernization (COBOL,
            PL/I, and JCL). Models inter-program batch execution (
            <code className="text-xs">EXEC PGM=</code>,{" "}
            <code className="text-xs">IKJEFT01 SYSTSIN RUN PROGRAM</code>,{" "}
            <code className="text-xs">CALL</code>,{" "}
            <code className="text-xs">PERFORM</code>,{" "}
            <code className="text-xs">EXEC CICS LINK/XCTL</code>), copybook /{" "}
            <code className="text-xs">%INCLUDE</code> imports, and{" "}
            <code className="text-xs">DD DSN=</code> dataset producer→consumer
            pipelines.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--hairline)] text-left text-[var(--mute)]">
                  <th className="p-2 font-medium">Language</th>
                  <th className="p-2 font-medium">Extensions</th>
                  <th className="p-2 font-medium">Plugin Crate</th>
                  <th className="p-2 font-medium">Extracted Constructs</th>
                </tr>
              </thead>
              <tbody>
                {structural.map((lang) => {
                  const kinds = [
                    ...(lang.functionKinds ?? []),
                    ...(lang.classKinds ?? []),
                    ...(lang.importKinds ?? []),
                  ];
                  return (
                    <tr
                      key={lang.id}
                      className="border-b border-[var(--hairline)] text-[var(--body)]"
                    >
                      <td className="p-2">
                        <Link
                          href={`/docs/languages/${lang.id}/`}
                          className="font-medium text-[var(--ink)] underline"
                        >
                          {lang.displayName}
                        </Link>
                      </td>
                      <td className="p-2 font-mono text-xs">
                        {formatExtensions(lang.extensions)}
                      </td>
                      <td className="p-2 font-mono text-xs">
                        {lang.plugin ? `${lang.plugin} (${lang.crateDir})` : lang.crateDir}
                      </td>
                      <td className="p-2 font-mono text-xs text-[var(--mute)]">
                        {kinds.length ? kinds.join(", ") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!languages.length && (
        <p className="mt-8 text-sm text-[var(--mute)]">
          No coverage catalog found. Run{" "}
          <code className="text-xs">node scripts/copy-lang-coverage.mjs</code>{" "}
          from this repo (via <code className="text-xs">RGCTL_REPO</code>) (also
          runs on <code className="text-xs">predev</code> /{" "}
          <code className="text-xs">prebuild</code>).
        </p>
      )}
    </div>
  );
}

function handlerBlurb(h: string): string {
  switch (h) {
    case "Symbol":
      return "Emits graph symbols / nodes (functions, types, …).";
    case "Relation":
      return "Emits typed edges (calls, imports, heritage, …).";
    case "CfgStatement":
      return "Feeds CFG / control-flow construction.";
    case "AstSkeleton":
      return "Kept for analysis skeleton / field-write paths.";
    case "Literal":
      return "Leaf / literal tokens walked but not promoted to symbols.";
    case "Skip":
      return "Named grammar kind intentionally not mapped.";
    default:
      return "";
  }
}
