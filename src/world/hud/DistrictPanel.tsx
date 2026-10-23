"use client";

import Image from "next/image";
import { csbrosReleaseUrl, posts, products, services } from "@/content/catalog";
import { destinationById, destinations, tourOrder } from "@/content/destinations";
import { achievements, education, experience, profile, skills } from "@/content/profile";
import { projectBySlug, projectsIn } from "@/content/projects";
import type { DistrictId, Project } from "@/content/types";
import { ContactForm } from "@/components/site/ContactForm";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { formatMonth } from "@/lib/site";
import { useWorld } from "../store";
import { ProjectView } from "./ProjectView";
import { Sheet, SheetHeader } from "./Sheet";

export function DistrictPanel() {
  const overlay = useWorld((s) => s.overlay);
  const panel = useWorld((s) => s.panel);
  const projectSlug = useWorld((s) => s.project);
  const close = useWorld((s) => s.closeOverlay);
  const open = overlay === "panel" && !!panel;
  const d = panel ? destinationById(panel) : null;
  const project = projectSlug ? projectBySlug(projectSlug) : undefined;

  return (
    <Sheet open={open} onClose={close} labelledBy="district-title">
      {d && (
        <>
          <SheetHeader
            id="district-title"
            eyebrow={project ? d.name : d.short === "Start" ? "Welcome" : "Destination"}
            title={project ? project.title : d.name}
            onClose={close}
            onBack={project ? () => useWorld.getState().openPanel(d.id) : undefined}
          />
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{project ? <ProjectView project={project} /> : <DistrictBody id={d.id} />}</div>
          <TourFooter />
        </>
      )}
    </Sheet>
  );
}

function TourFooter() {
  const tour = useWorld((s) => s.tour);
  const step = useWorld((s) => s.stepTour);
  if (!tour.active) return null;
  const last = tour.index >= tourOrder.length - 1;
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
      <button type="button" className="btn btn-ghost" onClick={() => step(-1)} disabled={tour.index === 0}>
        Previous stop
      </button>
      <button type="button" className="btn btn-primary" onClick={() => {
          if (!last) return step(1);
          useWorld.getState().stopTour();
          useWorld.getState().closeOverlay();
        }}
      >
        {last ? "Finish tour" : "Next stop →"}
      </button>
    </footer>
  );
}

function ProjectList({ items, district }: { items: Project[]; district: DistrictId }) {
  const openProject = useWorld((s) => s.openProject);
  return (
    <ul className="space-y-3">
      {items.map((p) => (
        <li key={p.slug}>
          <button type="button" onClick={() => openProject(p.slug, district)} className="glass group flex w-full flex-col items-start gap-1 p-4 text-left hover:border-line-strong">
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: p.accent }} />
              <span className="font-display text-lg font-bold">{p.title}</span>
            </span>
            {p.codename && <span className="text-sm text-stone-dim">{p.codename}</span>}
            <span className="text-sm leading-relaxed text-stone/80">{p.tagline}</span>
            <span className="mt-1 text-sm text-aqua group-hover:underline">Open exhibit →</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 leading-relaxed text-stone/85">{children}</p>;
}

function DistrictBody({ id }: { id: DistrictId }) {
  const travelTo = useWorld((s) => s.travelTo);
  const startTour = useWorld((s) => s.startTour);

  switch (id) {
    case "arrival":
    case "nexus":
      return (
        <>
          <Lead>
            {id === "arrival" ? (
              <>
                Welcome to {profile.name}&apos;s eco-park. {profile.tagline}
              </>
            ) : (
              "The Nexus connects every district. Pick a destination and NOVA will fly you there, or take the guided tour."
            )}
          </Lead>
          <div className="mb-6 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={startTour}>
              Start guided tour
            </button>
            <a href="/resume" target="_blank" className="btn btn-ghost">
              Resume<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {destinations
              .filter((x) => x.id !== "arrival" && x.id !== id)
              .map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => travelTo(x.id)} className="glass flex h-full w-full flex-col items-start gap-1 p-3 text-left hover:border-line-strong">
                    <span aria-hidden className="h-1 w-8 rounded-full" style={{ background: x.accent }} />
                    <span className="font-semibold">{x.name}</span>
                    <span className="text-xs text-stone-dim">{x.description}</span>
                  </button>
                </li>
              ))}
          </ul>
        </>
      );

    case "citadel":
      return (
        <div className="space-y-7">
          <Lead>{profile.summary}</Lead>
          <div className="-mt-3 flex flex-wrap gap-2">
            <a href="/resume" target="_blank" className="btn btn-primary">
              Open resume<span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a href={`mailto:${profile.email}`} className="btn btn-ghost">
              Email
            </a>
          </div>
          <section>
            <h3 className="font-display text-lg font-bold">Experience</h3>
            <ol className="mt-3 space-y-4">
              {experience.map((e) => (
                <li key={e.id} className="glass p-4">
                  <p className="font-semibold">
                    {e.role} <span className="font-normal text-stone-dim">· {e.org}</span>
                  </p>
                  <p className="font-mono text-xs text-stone-dim">
                    {formatMonth(e.start)} – {e.end ? formatMonth(e.end) : "Present"}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone/85 marker:text-aqua">
                    {e.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h3 className="font-display text-lg font-bold">Skills</h3>
            <dl className="mt-3 space-y-3">
              {skills.map((g) => (
                <div key={g.id}>
                  <dt className="text-sm font-semibold text-stone-dim">{g.label}</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {g.skills.map((s) => (
                      <span key={s} className="chip">
                        {s}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h3 className="font-display text-lg font-bold">Education</h3>
            {education.map((e) => (
              <p key={e.school} className="mt-2 text-sm text-stone/85">
                <b className="text-stone">{e.degree}</b>
                <br />
                {e.school} · {e.end}
              </p>
            ))}
          </section>
          <section>
            <h3 className="font-display text-lg font-bold">Achievements</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {achievements.map((a) => (
                <li key={a.title}>
                  <b>{a.title}</b> <span className="text-stone-dim">· {a.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      );

    case "ai-dome":
    case "innovation":
      return (
        <>
          <Lead>{destinationById(id).description}</Lead>
          <ProjectList items={projectsIn(id)} district={id} />
        </>
      );

    case "creator-bay":
      return (
        <div className="space-y-7">
          <Lead>Freelance: I build products end to end, from scoping and UI through APIs, data and AI to deployment.</Lead>
          <ul className="space-y-3">
            {services.map((s) => (
              <li key={s.id} className="glass p-4">
                <p className="font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-stone/80">{s.summary}</p>
              </li>
            ))}
          </ul>
          <section>
            <h3 className="mb-3 font-display text-lg font-bold">Client work</h3>
            <ProjectList items={projectsIn("creator-bay")} district="creator-bay" />
          </section>
          <section>
            <h3 className="mb-3 font-display text-lg font-bold">Start a project</h3>
            <ContactForm kind="project" />
          </section>
        </div>
      );

    case "product-city": {
      const p = products[0];
      return (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Image src="/media/csbros/logo.webp" alt="" width={48} height={48} className="rounded-xl" />
            <div>
              <p className="font-display text-xl font-bold">{p.name}</p>
              <p className="text-sm text-stone-dim">
                v{p.version} · {p.price} · {p.status}
              </p>
            </div>
          </div>
          <p className="leading-relaxed text-stone/85">{p.description}</p>
          <ul className="grid grid-cols-2 gap-3">
            {p.media.map((m) => (
              <li key={m.src}>
                <Image src={m.src} alt={m.alt} width={m.width} height={m.height} sizes="220px" className="rounded-lg border border-line" />
              </li>
            ))}
          </ul>
          <ul className="space-y-2">
            {p.platforms.map((pl) => (
              <li key={pl.label}>
                <a href={pl.href} className="glass flex flex-col p-3 hover:border-line-strong">
                  <span className="font-semibold">Download for {pl.label}</span>
                  <span className="text-xs text-stone-dim">
                    {pl.requires} · {pl.size}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => useWorld.getState().openProject(p.projectSlug, "product-city")}>
              How it&apos;s built
            </button>
            <ExternalLink href={csbrosReleaseUrl} className="btn btn-ghost">
              Release notes
            </ExternalLink>
          </div>
        </div>
      );
    }

    case "knowledge-falls":
      return (
        <>
          <Lead>A quiet place to read. Every post opens on my live blog.</Lead>
          <ul className="space-y-2">
            {posts.map((p) => (
              <li key={p.slug}>
                <ExternalLink href={`${profile.links.blog}/posts/${p.slug}`} className="glass flex flex-col p-3 hover:border-line-strong">
                  <span className="font-semibold leading-snug">{p.title}</span>
                  <span className="mt-1 text-xs text-stone-dim">{p.summary}</span>
                </ExternalLink>
              </li>
            ))}
          </ul>
          <p className="mt-5">
            <ExternalLink href={profile.links.blog} className="btn btn-primary">
              Open the blog
            </ExternalLink>
          </p>
        </>
      );

    case "launch-terminal":
      return (
        <div className="space-y-6">
          <Lead>{profile.availability}</Lead>
          <ul className="grid grid-cols-2 gap-2">
            <li>
              <a href={`mailto:${profile.email}`} className="glass flex flex-col p-3 hover:border-line-strong">
                <span className="text-xs text-stone-dim">Email</span>
                <span className="truncate font-semibold">{profile.email}</span>
              </a>
            </li>
            {(
              [
                ["LinkedIn", profile.links.linkedin],
                ["GitHub", profile.links.github],
                ["LeetCode", profile.links.leetcode],
              ] as const
            ).map(([label, href]) => (
              <li key={label}>
                <ExternalLink href={href} className="glass flex flex-col p-3 hover:border-line-strong">
                  <span className="text-xs text-stone-dim">Profile</span>
                  <span className="font-semibold">{label}</span>
                </ExternalLink>
              </li>
            ))}
          </ul>
          <ContactForm kind="general" />
        </div>
      );
  }
}
