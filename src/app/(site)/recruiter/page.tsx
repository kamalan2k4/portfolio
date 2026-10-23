import type { Metadata } from "next";
import Link from "next/link";
import { achievements, education, experience, profile, skills } from "@/content/profile";
import { featuredProjects } from "@/content/projects";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { PageIntro, Section } from "@/components/ui/Section";
import { formatMonth } from "@/lib/site";

export const metadata: Metadata = {
  title: "Recruiter mode",
  description: `Fast overview of ${profile.name}: summary, experience, strongest projects, skills, resume and contact.`,
  alternates: { canonical: "/recruiter" },
};

export default function RecruiterPage() {
  return (
    <>
      <PageIntro eyebrow="Recruiter mode · 60-second read" title={`${profile.name} — ${profile.title}`}>
        <p>{profile.summary}</p>
        <p className="mt-4 text-base text-aqua">{profile.availability}</p>
      </PageIntro>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/resume" className="btn btn-primary">
          View / download resume
        </Link>
        <a href={`mailto:${profile.email}`} className="btn btn-ghost">
          {profile.email}
        </a>
        <Link href="/contact" className="btn btn-ghost">
          Contact form
        </Link>
        <Link href="/" className="btn btn-ghost">
          Explore the 3D world
        </Link>
      </div>

      <Section id="experience" eyebrow="Where I work" title="Experience">
        <ol className="space-y-6">
          {experience.map((job) => (
            <li key={job.id} className="glass p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-bold">
                  {job.role} <span className="font-sans text-base font-normal text-stone-dim">· {job.org}</span>
                </h3>
                <p className="font-mono text-sm text-stone-dim">
                  {formatMonth(job.start)} – {job.end ? formatMonth(job.end) : "Present"}
                </p>
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-stone/85 marker:text-aqua">
                {job.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
                {job.stack.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="projects" eyebrow="Strongest work" title="Featured projects">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((p) => (
            <li key={p.slug} className="flex">
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link href="/projects" className="link">
            All projects with architecture diagrams →
          </Link>
        </p>
      </Section>

      <Section id="skills" eyebrow="Toolbox" title="Skills">
        <dl className="grid gap-4 sm:grid-cols-2">
          {skills.map((g) => (
            <div key={g.id} className="glass p-5">
              <dt className="font-display font-bold">{g.label}</dt>
              <dd className="mt-3 flex flex-wrap gap-1.5">
                {g.skills.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <div className="grid gap-x-10 lg:grid-cols-2">
        <Section id="education" eyebrow="Foundations" title="Education">
          {education.map((e) => (
            <div key={e.school} className="glass p-6">
              <h3 className="font-display text-lg font-bold">{e.degree}</h3>
              <p className="mt-1 text-stone-dim">
                {e.school}, {e.location} · {e.end}
              </p>
              <ul className="mt-3 list-disc pl-5 marker:text-aqua">
                {e.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section id="achievements" eyebrow="Proof" title="Achievements">
          <ul className="space-y-3">
            {achievements.map((a) => (
              <li key={a.title} className="glass flex flex-col p-4">
                <span className="font-semibold">
                  {a.href ? (
                    <ExternalLink href={a.href} className="link">
                      {a.title}
                    </ExternalLink>
                  ) : (
                    a.title
                  )}
                </span>
                <span className="text-sm text-stone-dim">{a.detail}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section id="contact" eyebrow="Next step" title="Get in touch">
        <ul className="flex flex-wrap gap-3">
          <li><a className="btn btn-primary" href={`mailto:${profile.email}`}>Email me</a></li>
          <li><ExternalLink className="btn btn-ghost" href={profile.links.linkedin}>LinkedIn</ExternalLink></li>
          <li><ExternalLink className="btn btn-ghost" href={profile.links.github}>GitHub</ExternalLink></li>
          <li><ExternalLink className="btn btn-ghost" href={profile.links.leetcode}>LeetCode</ExternalLink></li>
          <li><ExternalLink className="btn btn-ghost" href={profile.links.blog}>Blog</ExternalLink></li>
        </ul>
      </Section>
    </>
  );
}
