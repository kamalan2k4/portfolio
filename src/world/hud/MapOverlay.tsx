"use client";

import { useEffect, useRef } from "react";
import { destinations } from "@/content/destinations";
import { player } from "../input";
import { useWorld } from "../store";
import { paths, river, WORLD_RADIUS } from "../terrain";
import { Sheet, SheetHeader } from "./Sheet";

const R = WORLD_RADIUS + 6;
const pct = (v: number) => `${((v + R) / (2 * R)) * 100}%`;

/** Always-available world map: one click/tap travels to any destination. */
export function MapOverlay() {
  const open = useWorld((s) => s.overlay === "map");
  const close = useWorld((s) => s.closeOverlay);
  const travelTo = useWorld((s) => s.travelTo);
  const nearby = useWorld((s) => s.nearby);
  const me = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const tick = () => {
      if (me.current) {
        me.current.style.left = pct(player.x);
        me.current.style.top = pct(player.z);
        me.current.style.transform = `translate(-50%, -50%) rotate(${-player.yaw}rad)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return (
    <Sheet open={open} onClose={close} labelledBy="map-title" variant="center">
      <SheetHeader id="map-title" eyebrow="Fast travel" title="World map" onClose={close} />
      <div className="grid gap-5 overflow-y-auto p-5 sm:grid-cols-[1fr_220px]">
        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          <svg viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`} className="absolute inset-0 h-full w-full" aria-hidden>
            <circle r={WORLD_RADIUS} fill="#12271f" stroke="#2f5d46" strokeWidth="1" />
            <polyline points={river.map((p) => p.join(",")).join(" ")} fill="none" stroke="#7dd3c0" strokeOpacity="0.6" strokeWidth="5" strokeLinecap="round" />
            {paths.map((p) => (
              <line key={p.to} x1={p.a[0]} y1={p.a[1]} x2={p.b[0]} y2={p.b[1]} stroke="#d5c9ad" strokeOpacity="0.45" strokeWidth="2.4" />
            ))}
            <circle r="11" fill="#d5c9ad" fillOpacity="0.25" />
          </svg>
          {destinations.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => travelTo(d.id)}
              style={{ left: pct(d.position[0]), top: pct(d.position[1]) }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1"
              aria-label={`Travel to ${d.name}${nearby === d.id ? " (you are here)" : ""}`}
            >
              <span className="block h-4 w-4 rounded-full border-2 border-night shadow-lg transition-transform group-hover:scale-125" style={{ background: d.accent }} />
              <span className="pointer-events-none absolute top-full left-1/2 mt-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-night/80 px-1.5 text-[11px] font-semibold">
                {d.short}
              </span>
            </button>
          ))}
          <div ref={me} aria-hidden className="pointer-events-none absolute h-0 w-0 border-x-[7px] border-b-[14px] border-x-transparent border-b-white drop-shadow" />
        </div>
        <ul className="space-y-1.5" aria-label="Destinations">
          {destinations.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => travelTo(d.id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-stone/5">
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.accent }} />
                <span className="text-sm font-semibold">{d.name}</span>
                {nearby === d.id && <span className="ml-auto text-xs text-aqua">Here</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
