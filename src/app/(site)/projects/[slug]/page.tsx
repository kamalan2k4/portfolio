import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { destinationById } from "@/content/destinations";
import { projectBySlug, projects } from "@/content/projects";
import { ArchitectureDiagram } from "@/components/project/ArchitectureDiagram";
import { ProjectVisual } from "@/components/project/ProjectVisual";
import { ExternalLink } from "@/components/ui/ExternalLink";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) return {};
  return {
    title: `${p.title}: ${p.codename ?? "Project"}`,
    description: p.tagline,
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: { title: p.title, description: p.tagline, type: "article" },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) notFound();
  const district = destinationById(p.district);
  const idx = projects.indexOf(p);
  const next = projects[(idx + 1) % projects.length];

  return (
    <article>
      <nav aria-label="Breadcrumb" className="text-sm text-stone-dim">
        <Link href="/projects" className="hover:text-stone">
          Projects
        </Link>{" "}
        /{" "}
        <Link href={`/projects#${p.district}`} className="hover:text-stone">
          {district.name}
        </Link>
      </nav>

      <header className="mt-6 grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow" style={{ color: p.accent }}>
            {p.codename} · {p.year}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{p.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-stone/85">{p.tagline}</p>
          {p.live && (
            <p className="mt-6">
              <ExternalLink href={p.live} className="btn btn-primary">
                Open live demo
              </ExternalLink>
            </p>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-line">
          <ProjectVisual project={p} />
        </div>
      </header>

      <section aria-labelledby="vision" className="mt-14 rounded-2xl border border-line p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${p.accent}14, transparent 60%)` }}>
        <h2 id="vision" className="eyebrow" style={{ color: p.accent }}>
          The vision
        </h2>
        <p className="mt-3 font-display text-xl leading-relaxed sm:text-2xl">{p.vision}</p>
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="problem">
          <h2 id="problem" className="font-display text-2xl font-bold">
            Problem
          </h2>
          <p className="mt-3 leading-relaxed text-stone/85">{p.problem}</p>
        </section>
        <section aria-labelledby="solution">
          <h2 id="solution" className="font-display text-2xl font-bold">
            Solution
          </h2>
          <p className="mt-3 leading-relaxed text-stone/85">{p.solution}</p>
        </section>
      </div>

      <section aria-labelledby="arch" className="mt-14">
        <h2 id="arch" className="font-display text-2xl font-bold">
          Architecture
        </h2>
        <div className="mt-5">
          <ArchitectureDiagram project={p} />
        </div>
      </section>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="highlights">
          <h2 id="highlights" className="font-display text-2xl font-bold">
            Engineering highlights
          </h2>
          <ul className="mt-4 space-y-3">
            {p.highlights.map((h) => (
              <li key={h} className="flex gap-3 leading-relaxed text-stone/85">
                <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: p.accent }} />
                {h}
              </li>
            ))}
          </ul>
        </section>
        <aside className="space-y-8">
          <section aria-labelledby="stack">
            <h2 id="stack" className="font-display text-lg font-bold">
              Stack
            </h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="role">
            <h2 id="role" className="font-display text-lg font-bold">
              My role
            </h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {p.role.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <nav aria-label="More projects" className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
        <Link href="/projects" className="link">
          ← All projects
        </Link>
        <Link href={`/projects/${next.slug}`} className="link">
          Next: {next.title} →
        </Link>
      </nav>
    </article>
  );
}
