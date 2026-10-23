import type { Metadata } from "next";
import { services } from "@/content/catalog";
import { projects } from "@/content/projects";
import { ContactForm } from "@/components/site/ContactForm";
import { ProjectCard } from "@/components/project/ProjectCard";
import { PageIntro, Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Freelance",
  description: "Hire Kamalan C S for full-stack product builds, AI/RAG features, admin dashboards, cloud deployment and performance work.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  const clientWork = projects.filter((p) => p.origin === "client");
  return (
    <>
      <PageIntro eyebrow="Creator Bay" title="Freelance: I build products end to end">
        <p>You bring the problem. I take it from scoping through UI, API, data, AI and deployment, and hand over code your next engineer can keep building on.</p>
      </PageIntro>

      <Section id="services" eyebrow="What I offer" title="Services">
        <ul className="grid gap-5 sm:grid-cols-2">
          {services.map((s) => (
            <li key={s.id} className="glass p-6">
              <h3 className="font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-stone/85">{s.summary}</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-stone-dim marker:text-aqua">
                {s.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Typical stack">
                {s.stack.map((t) => (
                  <li key={t} className="chip">
                    {t}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="client-work" eyebrow="Delivered" title="Client work">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clientWork.map((p) => (
            <li key={p.slug} className="flex">
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="enquiry" eyebrow="Start a project" title="Project enquiry">
        <div className="max-w-2xl">
          <ContactForm kind="project" />
        </div>
      </Section>
    </>
  );
}
