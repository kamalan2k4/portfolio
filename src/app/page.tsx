import Link from "next/link";
import { destinations } from "@/content/destinations";
import { profile } from "@/content/profile";
import { HeroLandscape } from "@/components/home/HeroLandscape";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function Home() {
  const directory = destinations.filter((d) => d.id !== "arrival" && d.id !== "nexus");
  return (
    <>
      <main id="main">
        <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
          <HeroLandscape className="absolute inset-0 -z-10 h-full w-full" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/40 to-transparent" />

          <div className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
            <p className="eyebrow">Portfolio · {profile.location}</p>
            <h1 id="hero-title" className="mt-4 font-display text-5xl font-bold tracking-tight text-balance sm:text-7xl">
              {profile.name}
            </h1>
            <p className="mt-3 font-display text-xl text-stone/90 sm:text-2xl">{profile.title}</p>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone/80">{profile.tagline}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/projects" className="btn btn-primary">
                Explore projects
              </Link>
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

        <section aria-labelledby="map-title" className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
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
