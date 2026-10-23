import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/profile";
import { ContactForm } from "@/components/site/ContactForm";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { PageIntro } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Kamalan C S about software engineering roles or freelance projects.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const { links } = profile;
  return (
    <>
      <PageIntro eyebrow="Launch Terminal" title="Let's build something">
        <p>{profile.availability} I usually reply within a day.</p>
      </PageIntro>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <ContactForm kind="general" />
        <aside className="space-y-3" aria-label="Other ways to reach me">
          <a href={`mailto:${profile.email}`} className="glass flex flex-col p-4 hover:border-line-strong">
            <span className="text-sm text-stone-dim">Email</span>
            <span className="font-semibold">{profile.email}</span>
          </a>
          {profile.showPhone && (
            <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className="glass flex flex-col p-4 hover:border-line-strong">
              <span className="text-sm text-stone-dim">Phone</span>
              <span className="font-semibold">{profile.phone}</span>
            </a>
          )}
          {[
            ["LinkedIn", links.linkedin],
            ["GitHub", links.github],
            ["LeetCode", links.leetcode],
            ["Blog", links.blog],
          ].map(([label, href]) => (
            <ExternalLink key={label} href={href} className="glass flex flex-col p-4 hover:border-line-strong">
              <span className="text-sm text-stone-dim">{label}</span>
              <span className="font-semibold break-all">{href.replace(/^https:\/\/(www\.)?/, "")}</span>
            </ExternalLink>
          ))}
          <Link href="/resume" className="glass flex flex-col p-4 hover:border-line-strong">
            <span className="text-sm text-stone-dim">Resume</span>
            <span className="font-semibold">View and save as PDF</span>
          </Link>
          <p className="pt-2 text-sm text-stone-dim">{profile.location}</p>
        </aside>
      </div>
    </>
  );
}
