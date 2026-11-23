"use client";

import { useEffect, useRef } from "react";
import { destinationById, destinations } from "@/content/destinations";
import type { DistrictId } from "@/content/types";
import { DistrictPanel } from "@/world/hud/DistrictPanel";
import { NovaPanel } from "@/world/hud/NovaPanel";
import { Sheet, SheetHeader } from "@/world/hud/Sheet";
import { useWorld } from "@/world/store";
import { cityPlacement } from "../city/CityDistricts";
import { BLOCK, blockKind, ISLAND, N, PITCH } from "../city/layout";
import { HEROES } from "../heroes";
import { rt, useGame } from "../state";
import { TouchControls } from "./TouchControls";

const btn = "btn btn-ghost min-h-11 gap-2 bg-black/50 px-3 backdrop-blur-md sm:px-4";

export function GameHud({ touch, onExit, onSwitchHero, teleport }: { touch: boolean; onExit: () => void; onSwitchHero: () => void; teleport: (id: DistrictId) => void }) {
  const heroId = useGame((s) => s.hero);
  const phase = useGame((s) => s.phase);
  const overlay = useWorld((s) => s.overlay);
  const hero = HEROES[heroId];
  const open = useWorld((s) => s.openOverlay);
  if (phase !== "play") return phase === "intro" ? <Intro name={hero.name} accent={hero.accent} tagline={hero.tagline} /> : null;
  return (
    <>
      <SpeedLines />
      <SlowMo />
      {touch && overlay === "none" && <TouchControls hero={heroId} />}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:p-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <button type="button" className={btn} onClick={onSwitchHero} style={{ borderColor: hero.accent }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: hero.accent }} />
            <span className="max-w-[9rem] truncate font-semibold">{hero.name}</span>
            <span className="sr-only">: switch hero</span>
          </button>
          <Location />
        </div>
        <nav aria-label="Game controls" className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <button type="button" className={btn} onClick={() => open("map")}>
            Map
          </button>
          <button type="button" className={btn} onClick={() => open("nova")}>
            NOVA
          </button>
          <button type="button" className={`${btn} hidden sm:inline-flex`} onClick={() => open("help")}>
            ?<span className="sr-only">Controls help</span>
          </button>
          <button type="button" className="btn btn-primary min-h-11 px-4" onClick={onExit}>
            Exit
          </button>
        </nav>
      </div>
      <Reticle />
      <Speedometer touch={touch} />
      {!touch && <Prompts />}
      <DistrictPanel />
      <NovaPanel />
      <CityMap teleport={teleport} />
      <GameHelp touch={touch} />
    </>
  );
}

function Location() {
  const nearby = useGame((s) => s.nearby);
  return (
    <p className="hidden rounded-xl bg-black/50 px-3 py-2 text-sm backdrop-blur-md md:block" aria-live="polite">
      {nearby ? destinationById(nearby).name : "Neo York"}
    </p>
  );
}

function Reticle() {
  const mode = useGame((s) => s.mode);
  if (mode === "drive") return null;
  return (
    <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="h-6 w-6 rounded-full border-2 border-white/70 shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
      <div className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
    </div>
  );
}

/** Updated outside React: the speed changes every frame. */
function Speedometer({ touch }: { touch: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mode = useGame((s) => s.mode);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) ref.current.textContent = String(Math.round(rt.speed * 3.6));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  const label = mode === "fly" ? "Flight" : mode === "drive" ? "Driving" : mode === "swing" ? "Swinging" : mode === "wall" ? "Wall-crawl" : "";
  return (
    <div aria-hidden className={`pointer-events-none absolute rounded-xl bg-black/45 px-3 py-1.5 backdrop-blur-md ${touch ? "top-16 left-1/2 -translate-x-1/2 text-center" : "right-6 bottom-6 text-right"}`}>
      <span ref={ref} className="font-display text-2xl font-bold tabular-nums">0</span>
      <span className="ml-1 text-xs text-stone/70">km/h</span>
      {label && <p className="text-[11px] tracking-widest text-aqua uppercase">{label}</p>}
    </div>
  );
}

function Prompts() {
  const nearby = useGame((s) => s.nearby);
  const nearCar = useGame((s) => s.nearCar);
  const mode = useGame((s) => s.mode);
  const locked = useGame((s) => s.locked);
  const overlay = useWorld((s) => s.overlay);
  if (overlay !== "none") return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 px-4 text-sm">
      {!locked && <p className="rounded-full bg-black/60 px-4 py-2 backdrop-blur-md">Click the city to lock the cursor · Esc to release</p>}
      {nearby && mode !== "drive" && (
        <button type="button" className="pointer-events-auto btn btn-primary" onClick={() => useWorld.getState().openPanel(nearby)}>
          <kbd className="rounded border border-night/30 px-1.5 font-mono text-xs">E</kbd> Open {destinationById(nearby).name}
        </button>
      )}
      {(nearCar || mode === "drive") && (
        <p className="rounded-full bg-black/60 px-4 py-2 backdrop-blur-md">
          <kbd className="font-mono">F</kbd> {mode === "drive" ? "Leave the car" : "Drive this car"}
        </p>
      )}
    </div>
  );
}

function SpeedLines() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) ref.current.style.opacity = String(Math.max(0, Math.min(0.75, (rt.speed - 28) / 60)));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 motion-reduce:hidden"
      style={{ background: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.18) 0deg 0.6deg, transparent 0.6deg 7deg)", maskImage: "radial-gradient(circle at center, transparent 32%, black 78%)", WebkitMaskImage: "radial-gradient(circle at center, transparent 32%, black 78%)" }}
    />
  );
}

function SlowMo() {
  const slowmo = useGame((s) => s.slowmo);
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${slowmo ? "opacity-100" : "opacity-0"}`} style={{ boxShadow: "inset 0 0 220px 40px rgba(0, 20, 60, 0.75)" }}>
      <p className="absolute top-20 left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.4em] text-aqua">SLOW MOTION</p>
    </div>
  );
}

/** Letterbox bars and a title card while the camera circles the hero. */
function Intro({ name, accent, tagline }: { name: string; accent: string; tagline: string }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 top-0 h-[12vh] bg-black" />
      <div className="absolute inset-x-0 bottom-0 h-[12vh] bg-black" />
      <div className="absolute inset-x-0 bottom-[16vh] px-6 text-center">
        <p className="font-mono text-xs tracking-[0.5em]" style={{ color: accent }}>
          NOW PLAYING
        </p>
        <h2 className="mt-2 font-display text-5xl font-bold tracking-tight sm:text-7xl" style={{ textShadow: `0 0 40px ${accent}aa` }}>
          {name}
        </h2>
        <p className="mt-2 text-stone/80">{tagline}</p>
      </div>
    </div>
  );
}

const span = 2 * (ISLAND + 10);
const pct = (v: number) => `${((v + span / 2) / span) * 100}%`;

/** City map: blocks, districts, your position; tap a district to fast-travel there. */
function CityMap({ teleport }: { teleport: (id: DistrictId) => void }) {
  const open = useWorld((s) => s.overlay === "map");
  const close = useWorld((s) => s.closeOverlay);
  const me = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const tick = () => {
      if (me.current) {
        me.current.style.left = pct(rt.pos.x);
        me.current.style.top = pct(rt.pos.z);
        me.current.style.transform = `translate(-50%, -50%) rotate(${-rt.yaw}rad)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [open]);
  const blocks = [];
  for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) blocks.push({ i, j, kind: blockKind(i, j) });
  const go = (id: DistrictId) => {
    close();
    teleport(id);
  };
  return (
    <Sheet open={open} onClose={close} labelledBy="citymap-title" variant="center">
      <SheetHeader id="citymap-title" eyebrow="Fast travel" title="City map" onClose={close} />
      <div className="grid gap-4 overflow-y-auto p-4 sm:grid-cols-[1fr_220px] sm:p-5">
        <div className="relative mx-auto aspect-square w-full max-w-[440px] rounded-xl bg-[#0b1630]">
          <svg viewBox={`${-span / 2} ${-span / 2} ${span} ${span}`} className="absolute inset-0 h-full w-full" aria-hidden>
            {blocks.map((b) => (
              <rect key={`${b.i},${b.j}`} x={b.i * PITCH - BLOCK / 2} y={b.j * PITCH - BLOCK / 2} width={BLOCK} height={BLOCK} rx={2} fill={b.kind === "park" ? "#163d24" : b.kind === "district" ? "#2b3150" : "#1d2335"} />
            ))}
          </svg>
          {destinations.map((d) => {
            const [x, z] = cityPlacement(d.id).position;
            return (
              <button key={d.id} type="button" tabIndex={-1} aria-hidden onClick={() => go(d.id)} style={{ left: pct(x), top: pct(z) }} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1">
                <span className="block h-4 w-4 rounded-full border-2 border-black shadow-lg" style={{ background: d.accent }} />
                <span className="absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1 text-[10px] font-semibold">{d.short}</span>
              </button>
            );
          })}
          <div ref={me} aria-hidden className="pointer-events-none absolute h-0 w-0 border-x-[7px] border-b-[14px] border-x-transparent border-b-white" />
        </div>
        <ul className="space-y-1" aria-label="Districts">
          {destinations.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => go(d.id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: d.accent }} />
                <span className="text-sm font-semibold">
                  <span className="sr-only">Travel to </span>
                  {d.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}

function GameHelp({ touch }: { touch: boolean }) {
  const open = useWorld((s) => s.overlay === "help");
  const close = useWorld((s) => s.closeOverlay);
  const hero = HEROES[useGame((s) => s.hero)];
  return (
    <Sheet open={open} onClose={close} labelledBy="gamehelp-title" variant="center">
      <SheetHeader id="gamehelp-title" eyebrow={hero.name} title="Controls" onClose={close} />
      <div className="space-y-4 overflow-y-auto p-5 text-sm">
        {touch ? (
          <p>Left stick to move (push all the way to sprint). Drag anywhere to look. The buttons on the right change with your hero: jump or swing, attack, fly up and down, drive, and open districts.</p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
            {hero.controls.map(([k, v]) => (
              <div key={k} className="contents">
                <dt>
                  <kbd className="rounded border border-white/25 px-2 py-0.5 font-mono text-xs">{k}</kbd>
                </dt>
                <dd className="text-stone/85">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="text-stone-dim">Every portfolio district is a plaza in the city. Walk onto it and open it, or use the map to travel instantly.</p>
      </div>
    </Sheet>
  );
}
