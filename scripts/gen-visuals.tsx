/**
 * Renders the per-project SVG concept art to static files
 * at build time, so pages reference cacheable images instead of hydrating large inline SVG.
 * Runs automatically before `dev` and `build`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectVisual } from "@/components/project/ProjectVisual";
import { projects } from "@/content/projects";

async function main() {
  const out = join(process.cwd(), "public", "generated");
  mkdirSync(join(out, "visuals"), { recursive: true });

  const withNs = (svg: string, w: number, h: number) => svg.replace("<svg", `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"`);

  for (const p of projects) {
    writeFileSync(join(out, "visuals", `${p.slug}.svg`), withNs(renderToStaticMarkup(<ProjectVisual project={p} />), 640, 400));
  }
  console.log(`gen-visuals: ${projects.length} project visuals → public/generated/visuals`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
