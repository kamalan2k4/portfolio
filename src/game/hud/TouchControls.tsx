"use client";

import { useRef } from "react";
import type { HeroId } from "../heroes";
import { pad, type Tap } from "../input";
import { useGame } from "../state";

/**
 * Touch layout: left thumb joystick (sprint at full tilt), drag anywhere else to look,
 * and a right-hand action cluster whose buttons change with the hero and the situation.
 */
export function TouchControls({ hero }: { hero: HeroId }) {
  const mode = useGame((s) => s.mode);
  const nearCar = useGame((s) => s.nearCar);
  const nearby = useGame((s) => s.nearby);
  const driving = mode === "drive";
  return (
    <>
      <LookSurface />
      <Joystick />
      <div className="pointer-events-none absolute right-3 bottom-4 flex flex-col items-end gap-3 pb-[env(safe-area-inset-bottom)] sm:right-6 sm:bottom-6">
        <div className="flex gap-3">
          {nearby && !driving && <ActionButton label="Open" tap="interact" small />}
          {(nearCar || driving) && <ActionButton label={driving ? "Exit car" : "Drive"} tap="car" small />}
        </div>
        <div className="flex items-end gap-3">
          {!driving && hero !== "spiderman" && <ActionButton label={hero === "ironman" ? "Unibeam" : "Charge"} tap="alt" hold="altHeld" />}
          {!driving && <ActionButton label={hero === "ironman" ? "Repulsor" : hero === "cap" ? "Shield" : "Web-zip"} tap="fire" hold="fireHeld" />}
          {hero === "ironman" && (mode === "fly" || driving) ? (
            <div className="flex flex-col gap-3">
              <ActionButton label="Up" hold="up" />
              <ActionButton label="Down" hold="down" />
            </div>
          ) : (
            <ActionButton label={driving ? "Brake" : hero === "spiderman" ? "Jump / Swing" : hero === "ironman" ? "Take off" : "Jump"} tap="jump" hold="jumpHeld" big />
          )}
        </div>
      </div>
    </>
  );
}

type HoldKey = "jumpHeld" | "fireHeld" | "altHeld" | "up" | "down";

function ActionButton({ label, tap, hold, big, small }: { label: string; tap?: Tap; hold?: HoldKey; big?: boolean; small?: boolean }) {
  const size = big ? "h-20 w-20 text-sm" : small ? "h-11 px-4 text-xs" : "h-16 w-16 text-xs";
  return (
    <button
      type="button"
      className={`pointer-events-auto grid touch-none select-none place-items-center rounded-full border border-white/25 bg-black/45 font-bold text-white shadow-lg backdrop-blur-md active:scale-95 active:bg-white/25 ${size}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        if (tap) pad.taps[tap]++;
        if (hold) pad[hold] = true;
        if (hold === "up") pad.jumpHeld = true;
      }}
      onPointerUp={() => {
        if (hold) pad[hold] = false;
        if (hold === "up") pad.jumpHeld = false;
      }}
      onPointerCancel={() => {
        if (hold) pad[hold] = false;
      }}
    >
      <span className="px-1 text-center leading-tight">{label}</span>
    </button>
  );
}

function Joystick() {
  const knob = useRef<HTMLSpanElement>(null);
  const pid = useRef<number | null>(null);
  const R = 52;
  const update = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > R) {
      dx = (dx / len) * R;
      dy = (dy / len) * R;
    }
    pad.move.x = dx / R;
    pad.move.y = -dy / R;
    // Full tilt sprints (boosts for Iron Man).
    pad.sprint = len > R * 0.95;
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const end = () => {
    pid.current = null;
    pad.move.x = pad.move.y = 0;
    pad.sprint = false;
    if (knob.current) knob.current.style.transform = "";
  };
  return (
    <div
      role="presentation"
      className="absolute bottom-6 left-4 grid h-36 w-36 touch-none place-items-center rounded-full border border-white/20 bg-black/35 backdrop-blur-md sm:left-8 sm:bottom-8 mb-[env(safe-area-inset-bottom)]"
      onPointerDown={(e) => {
        pid.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => e.pointerId === pid.current && update(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span ref={knob} className="h-14 w-14 rounded-full bg-white/80 shadow-lg" />
    </div>
  );
}

/** Drag anywhere that isn't a control to look around. */
function LookSurface() {
  const last = useRef<{ id: number; x: number; y: number } | null>(null);
  return (
    <div
      className="absolute inset-0 touch-none"
      onPointerDown={(e) => {
        if (last.current) return;
        last.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const l = last.current;
        if (!l || l.id !== e.pointerId) return;
        pad.look.x += (e.clientX - l.x) * 1.4;
        pad.look.y += (e.clientY - l.y) * 1.4;
        l.x = e.clientX;
        l.y = e.clientY;
      }}
      onPointerUp={(e) => {
        if (last.current?.id === e.pointerId) last.current = null;
      }}
      onPointerCancel={() => {
        last.current = null;
      }}
    />
  );
}
