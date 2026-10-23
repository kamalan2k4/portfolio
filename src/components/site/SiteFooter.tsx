import Link from "next/link";
import { profile } from "@/content/profile";
import { ExternalLink } from "@/components/ui/ExternalLink";

export function SiteFooter() {
  const { links } = profile;
  return (
    <footer className="mt-24 border-t border-line no-print">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-stone-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {profile.name}. Built with Next.js and Three.js.{" "}
          <Link href="/recruiter" className="link">
            Text-only version
          </Link>
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li><ExternalLink href={links.github}>GitHub</ExternalLink></li>
          <li><ExternalLink href={links.linkedin}>LinkedIn</ExternalLink></li>
          <li><ExternalLink href={links.leetcode}>LeetCode</ExternalLink></li>
          <li><ExternalLink href={links.blog}>Blog</ExternalLink></li>
          <li><a className="hover:text-stone" href={`mailto:${profile.email}`}>Email</a></li>
        </ul>
      </div>
    </footer>
  );
}
