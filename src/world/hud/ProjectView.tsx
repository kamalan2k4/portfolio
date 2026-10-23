import Link from "next/link";
import type { Project } from "@/content/types";
import { ArchitectureDiagram } from "@/components/project/ArchitectureDiagram";
import { ProjectVisual } from "@/components/project/ProjectVisual";
import { ExternalLink } from "@/components/ui/ExternalLink";

/** Compact in-world version of a project page. */
export function ProjectView({ project: p }: { project: Project }) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-line">
        <ProjectVisual project={p} />
      </div>
      <p className="text-stone/85">{p.tagline}</p>
      <section className="rounded-xl border border-line p-4" style={{ background: `linear-gradient(135deg, ${p.accent}18, transparent 70%)` }}>
        <h3 className="eyebrow" style={{ color: p.accent }}>
          The vision
        </h3>
        <p className="mt-2 font-display text-lg leading-snug">{p.vision}</p>
      </section>
      <section>
        <h3 className="font-display text-lg font-bold">How it works</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone/85">{p.solution}</p>
      </section>
      <section>
        <h3 className="mb-3 font-display text-lg font-bold">Architecture</h3>
        <ArchitectureDiagram project={p} />
      </section>
      <section>
        <h3 className="font-display text-lg font-bold">Highlights</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {p.highlights.map((h) => (
            <li key={h} className="flex gap-2.5 leading-relaxed text-stone/85">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: p.accent }} />
              {h}
            </li>
          ))}
        </ul>
      </section>
      <ul className="flex flex-wrap gap-1.5" aria-label="Tech stack">
        {p.stack.map((s) => (
          <li key={s} className="chip">
            {s}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        {p.live && (
          <ExternalLink href={p.live} className="btn btn-primary">
            Live demo
          </ExternalLink>
        )}
        <Link href={`/projects/${p.slug}`} target="_blank" className="btn btn-ghost">
          Full project page<span className="sr-only"> (opens in a new tab)</span>
        </Link>
      </div>
    </div>
  );
}
