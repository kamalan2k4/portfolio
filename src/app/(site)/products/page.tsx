import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { csbrosReleaseUrl, products } from "@/content/catalog";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { PageIntro } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Products · CSBROS",
  description: "CSBROS is Kamalan C S's product studio. Its first release is csbros companion, a 3D desktop hydration companion for Windows and macOS.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <>
      <PageIntro eyebrow="Product City" title="CSBROS: tech and digital creations">
        <p>CSBROS is my product studio, where I design, build and ship my own software, from the 3D engine and onboarding to the installers and the release pipeline.</p>
      </PageIntro>

      {products.map((p) => (
        <section key={p.slug} aria-labelledby={`${p.slug}-title`} className="mt-12 grid gap-10 rounded-3xl border border-line bg-night-2 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex items-center gap-4">
              <Image src="/media/csbros/logo.webp" alt="" width={56} height={56} className="rounded-xl" />
              <div>
                <h2 id={`${p.slug}-title`} className="font-display text-3xl font-bold">
                  {p.name}
                </h2>
                <p className="text-stone-dim">{p.tagline}</p>
              </div>
            </div>
            <p className="mt-6 leading-relaxed text-stone/85">{p.description}</p>

            <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <div className="glass p-3">
                <dt className="text-stone-dim">Version</dt>
                <dd className="font-semibold">{p.version}</dd>
              </div>
              <div className="glass p-3">
                <dt className="text-stone-dim">Price</dt>
                <dd className="font-semibold">{p.price}</dd>
              </div>
              <div className="glass p-3">
                <dt className="text-stone-dim">Status</dt>
                <dd className="font-semibold">{p.status}</dd>
              </div>
            </dl>

            <ul className="mt-6 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                  {f}
                </li>
              ))}
            </ul>

            <h3 className="mt-8 font-display text-lg font-bold">Download</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {p.platforms.map((pl) => (
                <li key={pl.label}>
                  <a href={pl.href} className="glass flex flex-col p-4 hover:border-line-strong">
                    <span className="font-semibold">Download for {pl.label}</span>
                    <span className="text-sm text-stone-dim">
                      {pl.requires} · {pl.size}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-stone-dim">
              Installers are unsigned, so your OS will ask you to confirm the first launch.{" "}
              <ExternalLink href={csbrosReleaseUrl} className="link">
                Release notes
              </ExternalLink>
              {p.siteStatus === "live" && (
                <>
                  {" · "}
                  <ExternalLink href={p.site} className="link">
                    csbros.in
                  </ExternalLink>
                </>
              )}
            </p>
            <p className="mt-6">
              <Link href={`/projects/${p.projectSlug}`} className="link">
                How it&apos;s built →
              </Link>
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-4 self-start" aria-label="Screenshots">
            {p.media.map((m) => (
              <li key={m.src}>
                <Image src={m.src} alt={m.alt} width={m.width} height={m.height} sizes="(min-width: 1024px) 22vw, 45vw" className="rounded-xl border border-line" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
