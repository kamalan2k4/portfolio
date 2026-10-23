import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { destinations } from "@/content/destinations";
import type { DistrictId } from "@/content/types";
import { player } from "../input";

export const LABEL_HEIGHT: Partial<Record<DistrictId, number>> = { citadel: 23, nexus: 5.5, arrival: 8.5 };
const v = new Vector3();

/**
 * Positions the DOM labels rendered by the HUD (`[data-label]` inside #world-labels)
 * by projecting each district anchor to screen space. Writes styles directly; no React state.
 */
export function LabelProjector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const nodes = useRef<Map<string, HTMLElement> | null>(null);

  useFrame(() => {
    if (!nodes.current || nodes.current.size === 0) {
      const root = document.getElementById("world-labels");
      if (!root) return;
      nodes.current = new Map([...root.querySelectorAll<HTMLElement>("[data-label]")].map((el) => [el.dataset.label!, el]));
    }
    for (const d of destinations) {
      const el = nodes.current.get(d.id);
      if (!el) continue;
      const dist = Math.hypot(d.position[0] - player.x, d.position[1] - player.z);
      v.set(d.position[0], LABEL_HEIGHT[d.id] ?? 11, d.position[1]).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 && dist > 6;
      if (!visible) {
        if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
        continue;
      }
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.visibility = "visible";
      el.style.opacity = String(Math.max(0.35, Math.min(1, 1.25 - dist / 140)));
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  });
  return null;
}
