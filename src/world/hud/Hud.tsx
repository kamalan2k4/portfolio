"use client";

import { useRef } from "react";
import { destinationById, destinations, tourOrder } from "@/content/destinations";
import { input } from "../input";
import type { QualityLevel } from "../quality";
import { useWorld } from "../store";
import { DistrictPanel } from "./DistrictPanel";
import { MapOverlay } from "./MapOverlay";
import { NovaPanel } from "./NovaPanel";
import { Sheet, SheetHeader } from "./Sheet";

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const hudBtn = "btn btn-ghost min-h-11 gap-2 bg-night/55 px-3 backdrop-blur-md sm:px-4";

export function Hud({ onExit, touch }: { onExit: () => void; touch: boolean }) {
  return (
    <>
      <TopBar onExit={onExit} />
      <LabelsLayer />
      <Prompt touch={touch} />
      <TourBar />
      {touch ? <Joystick /> : <KeysHint />}
      <DistrictPanel />
      <NovaPanel />
      <MapOverlay />
      <HelpOverlay />
    </>
  );
}

function TopBar({ onExit }: { onExit: () => void }) {
  const nearby = useWorld((s) => s.nearby);
  const open = useWorld((s) => s.openOverlay);
  const tourActive = useWorld((s) => s.tour.active);
  const startTour = useWorld((s) => s.startTour);
  const quality = useWorld((s) => s.quality);
  const setQuality = useWorld((s) => s.setQuality);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
      <div className="pointer-events-auto glass hidden px-4 py-2 sm:block">
        <p className="eyebrow">You are at</p>
        <p className="font-display font-bold" aria-live="polite">
          {nearby ? destinationById(nearby).name : "The Eco-Park"}
        </p>
      </div>
      <nav aria-label="World controls" className="pointer-events-auto flex flex-wrap justify-end gap-2">
        <button type="button" className={hudBtn} onClick={() => open("map")} aria-keyshortcuts="M">
          <Icon d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
          <span className="hidden sm:inline">Map</span>
          <span className="sr-only sm:hidden">Map</span>
        </button>
        <button type="button" className={hudBtn} onClick={() => open("nova")} aria-keyshortcuts="N">
          <Icon d="M12 3v3M5 10a7 7 0 0 1 14 0v4a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-4zM9.5 12h.01M14.5 12h.01" />
          <span className="hidden sm:inline">Ask NOVA</span>
          <span className="sr-only sm:hidden">Ask NOVA</span>
        </button>
        {!tourActive && (
          <button type="button" className={hudBtn} onClick={startTour}>
            <Icon d="M5 4l14 8-14 8V4z" />
            <span className="hidden sm:inline">Guided tour</span>
            <span className="sr-only sm:hidden">Guided tour</span>
          </button>
        )}
        <a href="/resume" target="_blank" className={hudBtn}>
          <Icon d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />
          <span className="hidden sm:inline">Resume</span>
          <span className="sr-only">{" "}(opens in a new tab)</span>
          <span className="sr-only sm:hidden">Resume</span>
        </a>
        <label className={`${hudBtn} hidden cursor-pointer sm:inline-flex`}>
          <span className="sr-only">Graphics quality</span>
          <Icon d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
          <select value={quality} onChange={(e) => setQuality(e.target.value as QualityLevel)} className="cursor-pointer bg-transparent text-sm outline-none [&>option]:bg-night">
            <option value="high">High</option>
            <option value="balanced">Balanced</option>
            <option value="low">Low power</option>
          </select>
        </label>
        <button type="button" className={hudBtn} onClick={() => open("help")}>
          <span aria-hidden className="font-bold">?</span>
          <span className="sr-only">Controls help</span>
        </button>
        <button type="button" className="btn btn-primary min-h-11 px-4" onClick={onExit}>
          Exit
          <span className="sr-only"> 3D world</span>
        </button>
      </nav>
    </div>
  );
}

/** DOM labels positioned by the in-canvas LabelProjector. Clicking travels. */
function LabelsLayer() {
  const travelTo = useWorld((s) => s.travelTo);
  return (
    <div id="world-labels" className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {destinations
        .filter((d) => d.id !== "arrival")
        .map((d) => (
          <button
            key={d.id}
            type="button"
            tabIndex={-1}
            data-label={d.id}
            onClick={() => travelTo(d.id)}
            style={{ visibility: "hidden" }}
            className="pointer-events-auto absolute top-0 left-0 flex items-center gap-2 rounded-full border border-line-strong bg-night/70 px-3 py-1.5 text-sm font-semibold whitespace-nowrap backdrop-blur-md will-change-transform hover:bg-night/90"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: d.accent }} />
            {d.name}
          </button>
        ))}
    </div>
  );
}

function Prompt({ touch }: { touch: boolean }) {
  const nearby = useWorld((s) => s.nearby);
  const overlay = useWorld((s) => s.overlay);
  const travelling = useWorld((s) => s.travelling);
  const openPanel = useWorld((s) => s.openPanel);
  if (!nearby || overlay !== "none" || travelling) return null;
  const d = destinationById(nearby);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 flex justify-center px-4 sm:bottom-24">
      <button type="button" onClick={() => openPanel(nearby)} className="pointer-events-auto btn btn-primary shadow-2xl">
        {!touch && <kbd className="rounded border border-night/30 px-1.5 font-mono text-xs">E</kbd>}
        Open {d.name}
      </button>
    </div>
  );
}

function TourBar() {
  const tour = useWorld((s) => s.tour);
  const step = useWorld((s) => s.stepTour);
  const pause = useWorld((s) => s.pauseTour);
  const stop = useWorld((s) => s.stopTour);
  const travelTo = useWorld((s) => s.travelTo);
  if (!tour.active) return null;
  const id = tourOrder[tour.index];
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-3">
      <div role="region" aria-label="Guided tour" className="pointer-events-auto glass flex flex-wrap items-center gap-2 px-3 py-2">
        <p className="px-2 text-sm">
          <span className="text-stone-dim">
            Tour {tour.index + 1}/{tourOrder.length} ·
          </span>{" "}
          <b>{destinationById(id).name}</b>
          {tour.paused && <span className="text-stone-dim"> (paused)</span>}
        </p>
        <button type="button" className="btn btn-ghost min-h-10 px-3 text-sm" onClick={() => step(-1)} disabled={tour.index === 0}>
          Prev
        </button>
        {tour.paused ? (
          <button
            type="button"
            className="btn btn-ghost min-h-10 px-3 text-sm"
            onClick={() => {
              pause(false);
              travelTo(id);
            }}
          >
            Resume
          </button>
        ) : (
          <button type="button" className="btn btn-ghost min-h-10 px-3 text-sm" onClick={() => pause(true)}>
            Pause
          </button>
        )}
        <button type="button" className="btn btn-primary min-h-10 px-3 text-sm" onClick={() => (tour.index >= tourOrder.length - 1 ? stop() : step(1))}>
          {tour.index >= tourOrder.length - 1 ? "Finish" : "Next"}
        </button>
        <button type="button" className="btn btn-ghost min-h-10 px-3 text-sm" onClick={stop}>
          End tour
        </button>
      </div>
    </div>
  );
}

function KeysHint() {
  const tour = useWorld((s) => s.tour.active);
  if (tour) return null;
  return (
    <p className="pointer-events-none absolute bottom-4 left-4 hidden rounded-lg bg-night/55 px-3 py-2 text-xs text-stone-dim backdrop-blur-md md:block">
      <kbd>WASD</kbd> move · <kbd>Shift</kbd> run · drag to look · <kbd>E</kbd> open · <kbd>M</kbd> map · <kbd>N</kbd> NOVA
    </p>
  );
}

function Joystick() {
  const knob = useRef<HTMLSpanElement>(null);
  const pid = useRef<number | null>(null);
  const RADIUS = 46;
  const update = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    input.stick.x = dx / RADIUS;
    input.stick.y = -dy / RADIUS;
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const end = () => {
    pid.current = null;
    input.stick.x = input.stick.y = 0;
    if (knob.current) knob.current.style.transform = "";
  };
  return (
    <div
      role="presentation"
      className="absolute bottom-6 left-6 grid h-32 w-32 touch-none place-items-center rounded-full border border-line-strong bg-night/40 backdrop-blur-md"
      onPointerDown={(e) => {
        pid.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => e.pointerId === pid.current && update(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span ref={knob} className="h-12 w-12 rounded-full bg-stone/80 shadow-lg" />
    </div>
  );
}

function QualityPicker() {
  const quality = useWorld((s) => s.quality);
  const setQuality = useWorld((s) => s.setQuality);
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Graphics</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {(
          [
            ["high", "High"],
            ["balanced", "Balanced"],
            ["low", "Low power"],
          ] as const
        ).map(([v, l]) => (
          <label key={v} className="chip cursor-pointer gap-2 py-2 has-[:checked]:border-aqua has-[:checked]:text-stone">
            <input type="radio" name="quality" value={v} checked={quality === v} onChange={() => setQuality(v)} className="accent-[var(--aqua)]" />
            {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function HelpOverlay() {
  const open = useWorld((s) => s.overlay === "help");
  const close = useWorld((s) => s.closeOverlay);
  const rows: [string, string][] = [
    ["W A S D", "Move (arrow keys: forward/back and turn)"],
    ["Shift", "Run"],
    ["Drag", "Look around (mouse or finger)"],
    ["E / Enter", "Open the nearby destination"],
    ["M", "World map and fast travel"],
    ["N or /", "Ask NOVA"],
    ["Esc", "Close a panel"],
  ];
  return (
    <Sheet open={open} onClose={close} labelledBy="help-title" variant="center">
      <SheetHeader id="help-title" eyebrow="Help" title="Getting around" onClose={close} />
      <div className="space-y-5 overflow-y-auto p-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt>
                <kbd className="rounded border border-line-strong px-2 py-0.5 font-mono text-xs">{k}</kbd>
              </dt>
              <dd className="text-stone/85">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-stone-dim">On touch screens, use the joystick to walk and drag anywhere to look. Every destination is one tap away on the map.</p>
        <QualityPicker />
        <p className="text-sm">
          Prefer reading?{" "}
          <a className="link" href="/recruiter">
            Open the text-only recruiter mode
          </a>
          .
        </p>
      </div>
    </Sheet>
  );
}
