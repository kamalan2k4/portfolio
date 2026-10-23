import Link from "next/link";
import type { Project } from "@/content/types";
import { ProjectVisual } from "./ProjectVisual";

const ORIGIN: Record<Project["origin"], string> = {
  personal: "Independent build",
  professional: "Professional work",
  client: "Client work",
  hackathon: "Hackathon",
  lab: "Lab",
};

export function ProjectCard({ project, headingLevel = 3 }: { project: Project; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as const;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-night-2 transition-colors hover:border-line-strong">
      <div className="aspect-[16/10] overflow-hidden border-b border-line">
        <ProjectVisual project={project} className="transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="eyebrow" style={{ color: project.accent }}>
          {ORIGIN[project.origin]} · {project.year}
        </p>
        <H className="font-display text-xl font-bold tracking-tight">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </H>
        {project.codename && <p className="-mt-2 text-sm text-stone-dim">{project.codename}</p>}
        <p className="text-[0.95rem] leading-relaxed text-stone/85">{project.tagline}</p>
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="Tech stack">
          {project.stack.slice(0, 5).map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
