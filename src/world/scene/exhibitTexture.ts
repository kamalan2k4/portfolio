import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { Project } from "@/content/types";
import { ProjectVisual } from "@/components/project/ProjectVisual";

const cache = new Map<string, Promise<CanvasTexture>>();

/** Renders the project's SVG concept art (the same component the website uses) to markup. */
function svgMarkup(project: Project) {
  const host = document.createElement("div");
  const root = createRoot(host);
  flushSync(() => root.render(createElement(ProjectVisual, { project })));
  const svg = host.innerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"');
  root.unmount();
  return svg;
}

/**
 * Rasterises an exhibit display: concept art plus a title bar. Created lazily (when the visitor
 * approaches a district) and cached; `disposeExhibitTextures` frees GPU memory on world exit.
 */
export function exhibitTexture(project: Project, scale: number): Promise<CanvasTexture> {
  const key = `${project.slug}@${scale}`;
  let p = cache.get(key);
  if (p) return p;
  p = new Promise((resolve, reject) => {
    // Defer out of React's commit phase; flushSync isn't allowed inside it.
    setTimeout(() => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        const w = Math.round(640 * scale);
        const h = Math.round(400 * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        const bar = h * 0.2;
        const grad = ctx.createLinearGradient(0, h - bar * 1.6, 0, h);
        grad.addColorStop(0, "rgba(7,17,13,0)");
        grad.addColorStop(1, "rgba(7,17,13,0.92)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, h - bar * 1.6, w, bar * 1.6);
        ctx.fillStyle = project.accent;
        ctx.fillRect(w * 0.05, h - bar * 0.95, w * 0.012, bar * 0.62);
        ctx.fillStyle = "#ece6d6";
        ctx.font = `700 ${Math.round(bar * 0.42)}px system-ui, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(project.title, w * 0.08, h - bar * 0.64);
        const tex = new CanvasTexture(canvas);
        tex.colorSpace = SRGBColorSpace;
        tex.anisotropy = 4;
        resolve(tex);
      };
      img.onerror = reject;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup(project));
    }, 0);
  });
  cache.set(key, p);
  return p;
}

export function disposeExhibitTextures() {
  for (const p of cache.values()) void p.then((t) => t.dispose()).catch(() => undefined);
  cache.clear();
}
