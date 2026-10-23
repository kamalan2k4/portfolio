import type { Metadata } from "next";
import { achievements, education, experience, profile, skills } from "@/content/profile";
import { featuredProjects } from "@/content/projects";
import { formatMonth, SITE_URL } from "@/lib/site";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Resume",
  description: `Resume of ${profile.name}, ${profile.title}.`,
  alternates: { canonical: "/resume" },
};

export default function ResumePage() {
  const { links } = profile;
  const host = (u: string) => u.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-stone-dim">A one-page resume generated from the same data as this site.</p>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-[820px] rounded-lg bg-white px-8 py-10 text-[13.5px] leading-snug text-neutral-800 shadow-2xl sm:px-12 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-950">{profile.name.toUpperCase()}</h1>
          <p className="mt-1 font-semibold text-neutral-700">{profile.title}</p>
          <p className="mt-2 text-neutral-600">
            {profile.email}
            {profile.showPhone && ` · ${profile.phone}`} · {profile.location}
          </p>
          <p className="mt-1 text-neutral-600">
            {host(links.linkedin)} · {host(links.github)} · {host(links.blog)} · {host(SITE_URL)}
          </p>
        </header>

        <R title="Summary">
          <p>{profile.summary}</p>
        </R>

        <R title="Technical skills">
          <ul className="space-y-0.5">
            {skills.map((g) => (
              <li key={g.id}>
                <b className="text-neutral-950">{g.label}:</b> {g.skills.join(", ")}
              </li>
            ))}
          </ul>
        </R>

        <R title="Experience">
          {experience.map((j) => (
            <div key={j.id} className="mb-3 break-inside-avoid">
              <div className="flex justify-between gap-4">
                <b className="text-neutral-950">
                  {j.role}, {j.org}
                </b>
                <span className="shrink-0">
                  {formatMonth(j.start)} – {j.end ? formatMonth(j.end) : "Present"}
                </span>
              </div>
              <ul className="mt-1 list-disc pl-5">
                {j.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </R>

        <R title="Selected projects">
          {featuredProjects.map((p) => (
            <div key={p.slug} className="mb-2.5 break-inside-avoid">
              <div className="flex justify-between gap-4">
                <b className="text-neutral-950">
                  {p.title}: {p.codename}
                </b>
                <span className="shrink-0 text-right text-neutral-600">{p.stack.slice(0, 4).join(", ")}</span>
              </div>
              <p>{p.tagline}</p>
            </div>
          ))}
        </R>

        <R title="Education & achievements">
          {education.map((e) => (
            <div key={e.school} className="flex justify-between gap-4">
              <span>
                <b className="text-neutral-950">{e.school}</b>, {e.degree}
              </span>
              <span className="shrink-0">{e.end}</span>
            </div>
          ))}
          <ul className="mt-1 list-disc pl-5">
            {achievements.map((a) => (
              <li key={a.title}>
                {a.title}: {a.detail}
              </li>
            ))}
          </ul>
        </R>
      </article>
    </>
  );
}

function R({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-1.5 border-b border-neutral-300 pb-0.5 font-display text-[15px] font-bold uppercase tracking-wide text-neutral-950">{title}</h2>
      {children}
    </section>
  );
}
