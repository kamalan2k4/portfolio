import { profile } from "@/content/profile";

/** Canonical origin. Set NEXT_PUBLIC_SITE_URL in production (no trailing slash). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kamalan-cs.vercel.app").replace(/\/$/, "");

export const SITE_NAME = `${profile.name} · Portfolio`;

export const SITE_DESCRIPTION =
  "Kamalan C S is a software engineer and freelancer building full-stack products, AI/RAG systems and cloud-deployed apps. Explore the 3D portfolio or open quick recruiter mode.";

export const nav = [
  { href: "/", label: "World" },
  { href: "/recruiter", label: "Recruiter mode" },
  { href: "/projects", label: "Projects" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Freelance" },
  { href: "/writing", label: "Writing" },
  { href: "/contact", label: "Contact" },
] as const;

export const formatMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
};
