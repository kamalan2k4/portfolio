"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "@/lib/site";

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <ul className={className}>
      {nav.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-full px-3 py-2 text-sm transition-colors hover:text-stone ${
                active ? "bg-stone/10 text-stone" : "text-stone-dim"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
