import Link from "next/link";
import { posts } from "@/content/catalog";
import { destinations } from "@/content/destinations";
import { achievements, profile } from "@/content/profile";
import { projectBySlug, projects } from "@/content/projects";
import type { ProjectCategory } from "@/content/types";
import { ProjectCard } from "@/components/project/ProjectCard";
import { WorldLauncher } from "@/components/home/WorldLauncher";
import { SiteFooter } from "@/components/site/SiteFooter";

const CAPABILITIES: { cat: ProjectCategory; title: string; body: string; href: string }[] = [
  { cat: "full-stack", title: "Full-stack products", body: "React, Next.js, Node.js and Spring Boot platforms with real auth, payments, roles and data models.", href: "/projects#innovation" },
  { cat: "ai", title: "AI, LLMs & RAG", body: "Retrieval over vector databases, LLM-generated content with adaptive engines, transformer OCR and agent evaluation.", href: "/projects#ai-dome" },
  { cat: "cloud", title: "Cloud & serverless", body: "AWS S3 and SES, Firebase Functions with Cloud Scheduler, Vercel and Cloudflare Pages deployments.", href: "/projects" },
  { cat: "devops", title: "DevOps & release", body: "Docker, Jenkins and GitHub Actions pipelines that ship cross-platform desktop installers and reproducible environments.", href: "/projects/csbros-companion" },
];

const FEATURED = ["vinathi", "leadflow-crm", "csbros-companion"];

export default function Home() {
  const directory = destinations.filter((d) => d.id !== "arrival" && d.id !== "nexus");
  return (
    <>
      <main id="main">
        <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
          {/* A real render of the 3D world (scripts/capture-hero.mjs); decorative. */}
          <picture>
            <source media="(max-aspect-ratio: 1/1)" srcSet="/media/hero/world-portrait-720.webp 720w, /media/hero/world-portrait-1080.webp 1080w" sizes="100vw" />
            <img
              src="/media/hero/world-1600.webp"
              srcSet="/media/hero/world-1080.webp 1080w, /media/hero/world-1600.webp 1600w, /media/hero/world-2400.webp 2400w"
              sizes="(max-aspect-ratio: 16/9) 178vh, 100vw"
              alt=""
              width={1600}
              height={900}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_40%]"
            />
          </picture>
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/55 to-night/10" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-night/70 via-night/20 to-transparent" />

          <div className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
            <p className="eyebrow">Portfolio · {profile.location}</p>
            <h1 id="hero-title" className="mt-4 font-display text-5xl font-bold tracking-tight text-balance sm:text-7xl">
              {profile.name}
            </h1>
            <p className="mt-3 font-display text-xl text-stone/90 sm:text-2xl">{profile.title}</p>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone/80">{profile.tagline}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <WorldLauncher />
              <Link href="/resume" className="btn btn-ghost">
                View resume
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                Contact
              </Link>
              <Link href="/recruiter" className="btn btn-ghost">
                Recruiter mode
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="At a glance" className="border-y border-line bg-night-2/60">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
            {[
              [`${projects.length}`, "projects across full-stack, AI and cloud"],
              ["475+", "LeetCode problems, 58 of them hard"],
              ["v0.1.0", "desktop app shipped for Windows and macOS"],
              [`${posts.length}`, "technical articles published"],
            ].map(([n, label]) => (
              <div key={label} className="py-7 sm:px-2">
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold text-stone sm:text-4xl">{n}</span>
                  <span className="mt-1 block text-sm text-stone-dim">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="cap-title" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <p className="eyebrow">What I do</p>
          <h2 id="cap-title" className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            One engineer, the whole stack: interface to infrastructure.
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c) => (
              <li key={c.cat}>
                <Link href={c.href} className="glass group flex h-full flex-col gap-3 p-5 transition-colors hover:border-line-strong">
                  <span className="font-display text-lg font-bold">{c.title}</span>
                  <span className="text-sm leading-relaxed text-stone/80">{c.body}</span>
                  <span className="mt-auto pt-2 font-mono text-xs text-aqua">
                    {projects.filter((p) => p.categories.includes(c.cat)).length} projects →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="featured-title" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Featured work</p>
              <h2 id="featured-title" className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Built, shipped, explained
              </h2>
            </div>
            <Link href="/projects" className="link">
              All {projects.length} projects →
            </Link>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED.map((slug) => (
              <li key={slug} className="flex">
                <ProjectCard project={projectBySlug(slug)!} />
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-stone-dim">{achievements[1].title}: {achievements[1].detail}.</p>
        </section>

        <section aria-labelledby="map-title" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <p className="eyebrow">World map</p>
          <h2 id="map-title" className="mt-2 font-display text-3xl font-bold tracking-tight">
            Choose a destination
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {directory.map((d) => (
              <li key={d.id}>
                <Link href={d.route} className="glass group flex h-full flex-col gap-2 p-5 transition-colors hover:border-line-strong">
                  <span aria-hidden className="h-1 w-10 rounded-full" style={{ background: d.accent }} />
                  <span className="font-display text-lg font-bold group-hover:text-white">{d.name}</span>
                  <span className="text-sm leading-relaxed text-stone-dim">{d.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
