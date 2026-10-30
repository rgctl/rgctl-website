import { withBase, cn } from "@/lib/utils";
import type { GuideDemoMeta } from "@/lib/guide-demos";

type GuideDemoProps = {
  meta: GuideDemoMeta;
  className?: string;
};

export function GuideDemo({ meta, className }: GuideDemoProps) {
  const mp4 = withBase(`/demos/guide-${meta.slug}.mp4`);

  return (
    <figure className={cn("mb-8 space-y-3", className)}>
      <div className="overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface)]">
        <div className="flex items-center gap-1.5 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--mute)]/40" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--mute)]/40" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--mute)]/40" aria-hidden />
          <span className="ml-2 font-[family-name:var(--font-mono)] text-[11px] text-[var(--mute)]">
            {meta.title} · CLI walkthrough (VHS)
          </span>
        </div>
        <video
          className="block h-auto w-full"
          controls
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label={`${meta.title}: ${meta.blurb}`}
        >
          <source src={mp4} type="video/mp4" />
        </video>
      </div>
      <figcaption className="text-sm text-[var(--mute)]">{meta.blurb}</figcaption>
    </figure>
  );
}
