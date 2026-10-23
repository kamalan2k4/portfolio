import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/recruiter", "/projects", "/products", "/services", "/writing", "/contact", "/resume"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.8 })),
    ...projects.map((p) => ({ url: `${SITE_URL}/projects/${p.slug}`, changeFrequency: "monthly" as const, priority: p.featured ? 0.7 : 0.5 })),
  ];
}
