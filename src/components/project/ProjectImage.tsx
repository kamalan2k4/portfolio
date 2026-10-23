import type { Project } from "@/content/types";

export const visualSrc = (slug: string) => `/generated/visuals/${slug}.svg`;

/**
 * Project concept art as a static, cacheable SVG (generated at build time by
 * scripts/gen-visuals.tsx). Plain <img>: SVG gains nothing from the image optimizer.
 */
export function ProjectImage({ project, priority = false, className = "" }: { project: Pick<Project, "slug" | "title">; priority?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={visualSrc(project.slug)}
      alt={`Concept illustration for ${project.title}`}
      width={640}
      height={400}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`block h-auto w-full ${className}`}
    />
  );
}
