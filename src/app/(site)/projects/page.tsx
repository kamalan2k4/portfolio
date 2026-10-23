import type { Metadata } from "next";
import { destinationById } from "@/content/destinations";
import { lab, projectsIn } from "@/content/projects";
import type { DistrictId } from "@/content/types";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { PageIntro, Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Projects",
  description: "Full-stack, AI/RAG, cloud and product work by Kamalan C S, each with its architecture, stack and role.",
  alternates: { canonical: "/projects" },
};

const GROUPS: DistrictId[] = ["ai-dome", "innovation", "creator-bay", "product-city"];

export default function ProjectsPage() {
  return (
    <>
      <PageIntro eyebrow="Exhibits" title="Things I've designed and shipped">
        <p>Each project shows the idea behind it, how it&apos;s built, and what I did. In the 3D world, these are exhibits you can walk up to.</p>
      </PageIntro>

      <nav aria-label="Project districts" className="mt-8 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <a key={g} href={`#${g}`} className="chip hover:text-stone">
            {destinationById(g).name}
          </a>
        ))}
        <a href="#lab" className="chip hover:text-stone">
          Lab
        </a>
      </nav>

      {GROUPS.map((g) => {
        const d = destinationById(g);
        return (
          <Section key={g} id={g} eyebrow={d.name} title={d.description}>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projectsIn(g).map((p) => (
                <li key={p.slug} className="flex">
                  <ProjectCard project={p} />
                </li>
              ))}
            </ul>
          </Section>
        );
      })}

      <Section id="lab" eyebrow="Lab" title="Experiments and learning builds">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lab.map((l) => (
            <li key={l.title} className="glass p-4">
              <ExternalLink href={l.href} className="link font-semibold">
                {l.title}
              </ExternalLink>
              <p className="mt-1 text-sm text-stone-dim">{l.note}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
