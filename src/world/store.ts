import { create } from "zustand";
import { tourOrder } from "@/content/destinations";
import type { DistrictId } from "@/content/types";
import type { QualityLevel } from "./quality";

export type Overlay = "none" | "map" | "panel" | "nova" | "help";

type WorldState = {
  quality: QualityLevel;
  reducedMotion: boolean;
  ready: boolean;
  /** The browser dropped the WebGL context (GPU reset, backgrounded tab on mobile). */
  contextLost: boolean;
  progress: number;
  overlay: Overlay;
  /** District whose information panel is open. */
  panel: DistrictId | null;
  /** Project opened inside the panel, if any. */
  project: string | null;
  /** District the player is standing near (drives the interaction prompt). */
  nearby: DistrictId | null;
  /** Pending camera travel request; consumed by the player controller. */
  travel: { id: DistrictId; nonce: number } | null;
  travelling: boolean;
  highlight: DistrictId | null;
  tour: { active: boolean; paused: boolean; index: number };

  setQuality: (q: QualityLevel) => void;
  setReady: (stats?: Record<string, number | string>) => void;
  setProgress: (p: number) => void;
  setNearby: (id: DistrictId | null) => void;
  openOverlay: (o: Overlay) => void;
  closeOverlay: () => void;
  openPanel: (id: DistrictId) => void;
  openProject: (slug: string, district: DistrictId) => void;
  travelTo: (id: DistrictId) => void;
  setTravelling: (t: boolean) => void;
  setHighlight: (id: DistrictId | null) => void;
  startTour: () => void;
  stepTour: (dir: 1 | -1) => void;
  pauseTour: (paused: boolean) => void;
  stopTour: () => void;
};

export const useWorld = create<WorldState>()((set, get) => ({
  quality: "balanced",
  reducedMotion: false,
  ready: false,
  contextLost: false,
  progress: 0,
  overlay: "none",
  panel: null,
  project: null,
  nearby: null,
  travel: null,
  travelling: false,
  highlight: null,
  tour: { active: false, paused: false, index: 0 },

  setQuality: (quality) => set({ quality }),
  setReady: (stats) => {
    performance.mark("world:ready", { detail: stats });
    set({ ready: true, progress: 1 });
  },
  setProgress: (progress) => set({ progress }),
  setNearby: (nearby) => get().nearby !== nearby && set({ nearby }),
  openOverlay: (overlay) => set({ overlay }),
  closeOverlay: () => set({ overlay: "none", panel: null, project: null }),
  openPanel: (id) => set({ overlay: "panel", panel: id, project: null }),
  openProject: (slug, district) => set({ overlay: "panel", panel: district, project: slug }),
  travelTo: (id) => set((s) => ({ travel: { id, nonce: (s.travel?.nonce ?? 0) + 1 }, overlay: "none", panel: null, project: null, highlight: id })),
  setTravelling: (travelling) => set({ travelling }),
  setHighlight: (highlight) => set({ highlight }),

  startTour: () => {
    set({ tour: { active: true, paused: false, index: 0 } });
    get().travelTo(tourOrder[0]);
  },
  stepTour: (dir) => {
    const { tour } = get();
    const index = Math.min(tourOrder.length - 1, Math.max(0, tour.index + dir));
    set({ tour: { ...tour, index, paused: false } });
    get().travelTo(tourOrder[index]);
  },
  pauseTour: (paused) => set((s) => ({ tour: { ...s.tour, paused } })),
  stopTour: () => set({ tour: { active: false, paused: false, index: 0 }, highlight: null }),
}));
