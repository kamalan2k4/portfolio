export type QualityLevel = "high" | "balanced" | "low";

export type QualitySettings = {
  level: QualityLevel;
  dpr: [number, number];
  antialias: boolean;
  shadows: boolean;
  terrainSegments: number;
  trees: number;
  rocks: number;
};

export const QUALITY: Record<QualityLevel, QualitySettings> = {
  high: { level: "high", dpr: [1, 1.75], antialias: true, shadows: true, terrainSegments: 200, trees: 900, rocks: 140 },
  balanced: { level: "balanced", dpr: [1, 1.4], antialias: true, shadows: false, terrainSegments: 150, trees: 520, rocks: 80 },
  low: { level: "low", dpr: [0.75, 1], antialias: false, shadows: false, terrainSegments: 96, trees: 220, rocks: 30 },
};

export type Capability = { webgl: boolean; level: QualityLevel; reducedMotion: boolean; coarsePointer: boolean; saveData: boolean };

/** Best-effort device classification. The runtime FPS monitor can step the level down later. */
export function detectCapability(): Capability {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = matchMedia("(pointer: coarse)").matches;
  const saveData = !!nav.connection?.saveData;

  let webgl = false;
  let weakGpu = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    webgl = !!gl;
    if (gl) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
      weakGpu = /swiftshader|llvmpipe|software|mali-4|adreno \(tm\) [3-5]\d\d|powervr/i.test(renderer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    webgl = false;
  }

  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  let level: QualityLevel = "high";
  if (coarsePointer || memory <= 4 || cores <= 4) level = "balanced";
  if (weakGpu || saveData || memory <= 2 || (coarsePointer && cores <= 4)) level = "low";

  return { webgl, level, reducedMotion, coarsePointer, saveData };
}

export const stepDown = (l: QualityLevel): QualityLevel => (l === "high" ? "balanced" : "low");
