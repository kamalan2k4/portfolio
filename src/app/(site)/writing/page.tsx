import type { Metadata } from "next";
import { posts } from "@/content/catalog";
import { profile } from "@/content/profile";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { PageIntro } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Writing",
  description: "Technical writing by Kamalan C S on rendering, low-level design, DSA patterns, React and JavaScript runtimes.",
  alternates: { canonical: "/writing" },
};

export default function WritingPage() {
  const blog = profile.links.blog;
  return (
    <>
      <PageIntro eyebrow="Knowledge Falls" title="Writing">
        <p>
          I write about the things that confused me until they didn&apos;t: rendering strategies, design principles, DSA patterns and runtimes. The posts live on my blog.
        </p>
      </PageIntro>
      <p className="mt-6">
        <ExternalLink href={blog} className="btn btn-primary">
          Open the blog
        </ExternalLink>
      </p>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {posts.map((p) => (
          <li key={p.slug} className="glass relative p-5 transition-colors hover:border-line-strong">
            <h2 className="font-display text-lg font-bold leading-snug">
              <ExternalLink href={`${blog}/posts/${p.slug}`} className="after:absolute after:inset-0 hover:text-aqua">
                {p.title}
              </ExternalLink>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-dim">{p.summary}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Topics">
              {p.topics.map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}
