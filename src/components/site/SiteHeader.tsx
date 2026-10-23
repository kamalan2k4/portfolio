import Link from "next/link";
import { profile } from "@/content/profile";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-night/85 backdrop-blur-md no-print">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-[1.05rem] font-bold tracking-tight">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full border border-line-strong text-[0.7rem] text-aqua">
            KCS
          </span>
          {profile.name}
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <NavLinks className="flex items-center gap-1" />
        </nav>

        {/* No-JS friendly mobile menu */}
        <details className="group relative lg:hidden">
          <summary className="btn btn-ghost list-none cursor-pointer [&::-webkit-details-marker]:hidden" aria-label="Open menu">
            Menu
          </summary>
          <nav aria-label="Primary" className="glass absolute right-0 mt-2 w-60 p-2 shadow-2xl">
            <NavLinks className="flex flex-col" />
          </nav>
        </details>
      </div>
    </header>
  );
}
