"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DistrictId } from "@/content/types";
import type { Capability } from "@/world/quality";
import { disposeExhibitTextures } from "@/world/scene/exhibitTexture";
import { useWorld } from "@/world/store";
import { cityPlacement } from "./city/CityDistricts";
import { PLAZA_HEIGHT } from "./city/layout";
import { fx } from "./fx";
import GameScene, { type GameQuality } from "./GameScene";
import { CharacterSelect } from "./hud/CharacterSelect";
import { GameHud } from "./hud/GameHud";
import { resetPad } from "./input";
import { resetRuntime, rt, useGame } from "./state";
import { cars } from "./vehicles";

const QUALITY: Record<Capability["level"], GameQuality> = {
  high: { dpr: [1, 1.75], antialias: true, texScale: 1, bloom: true },
  balanced: { dpr: [1, 1.4], antialias: true, texScale: 0.75, bloom: true },
  low: { dpr: [0.7, 1], antialias: false, texScale: 0.5, bloom: false },
};

/** Hero mode: an explorable city game over the same portfolio content. Development builds only. */
export default function GameExperience({ capability, onExit }: { capability: Capability; onExit: () => void }) {
  const [ready, setReady] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [contextLost, setContextLost] = useState(false);
  const phase = useGame((s) => s.phase);
  const root = useRef<HTMLDivElement>(null);
  const touch = capability.coarsePointer;

  useEffect(() => {
    // Dev-only inspection hook for automated play tests.
    (window as unknown as { __hero?: unknown }).__hero = { rt, cars };
    const [x, z] = cityPlacement("arrival").viewpoint;
    resetRuntime(x, z);
    fx.shield.state = "held";
    useGame.setState({ phase: "select", slowmo: false, mode: "ground", nearby: null, nearCar: false });
    useWorld.setState({ ...useWorld.getInitialState(), quality: capability.level, reducedMotion: capability.reducedMotion });
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    root.current?.focus();
    return () => {
      document.documentElement.style.overflow = prev;
      resetPad();
      disposeExhibitTextures();
      if (document.pointerLockElement) document.exitPointerLock();
      useWorld.setState(useWorld.getInitialState());
    };
  }, [capability]);

  /** Puts the hero on a district's plaza, facing its landmark. */
  const teleport = useCallback((id: DistrictId) => {
    if (rt.mode === "drive" && rt.car >= 0) cars[rt.car].state = "parked";
    rt.car = -1;
    const [x, z] = cityPlacement(id).viewpoint;
    rt.pos.set(x, PLAZA_HEIGHT, z);
    rt.vel.set(0, 0, 0);
    rt.mode = "ground";
    rt.yaw = 0;
    rt.camYaw = 0;
    rt.camPitch = -0.1;
  }, []);

  // Switching heroes drops any ability state the new hero doesn't have (flight, swinging, wall-crawl).
  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        if (s.hero === prev.hero) return;
        if (rt.mode !== "drive") rt.mode = rt.grounded ? "ground" : "air";
        rt.stunt.t = 1;
        fx.shield.state = "held";
      }),
    [],
  );

  // NOVA and district panels request travel through the shared world store.
  useEffect(
    () =>
      useWorld.subscribe((s, prev) => {
        if (s.travel && s.travel.nonce !== prev.travel?.nonce) {
          const id = s.travel.id;
          teleport(id);
          setTimeout(() => useWorld.getState().openPanel(id), 350);
        }
      }),
    [teleport],
  );

  // Keyboard shortcuts for overlays; opening one releases the cursor so the UI is clickable.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || useGame.getState().phase !== "play") return;
      const w = useWorld.getState();
      if (w.overlay !== "none") return;
      if (e.code === "KeyM") w.openOverlay("map");
      else if (e.code === "KeyN") {
        e.preventDefault();
        w.openOverlay("nova");
      } else if (e.code === "KeyH") w.openOverlay("help");
    };
    window.addEventListener("keydown", down);
    const unsub = useWorld.subscribe((s, prev) => {
      if (s.overlay !== "none" && prev.overlay === "none") {
        resetPad();
        if (document.pointerLockElement) document.exitPointerLock();
      }
    });
    return () => {
      window.removeEventListener("keydown", down);
      unsub();
    };
  }, []);

  const play = () => {
    if (capability.reducedMotion) return useGame.getState().setPhase("play");
    useGame.getState().setPhase("intro");
    setTimeout(() => useGame.getState().phase === "intro" && useGame.getState().setPhase("play"), 2600);
  };

  return (
    <div ref={root} tabIndex={-1} role="application" aria-roledescription="3D hero game" aria-label="Hero mode: explore the portfolio city" className="fixed inset-0 z-50 select-none bg-black outline-none">
      <GameScene
        key={generation}
        quality={QUALITY[capability.level]}
        reducedMotion={capability.reducedMotion}
        onReady={() => setReady(true)}
        onContextLost={() => setContextLost(true)}
      />
      {phase === "select" && <CharacterSelect ready={ready} touch={touch} onPlay={play} onExit={onExit} />}
      <GameHud touch={touch} onExit={onExit} onSwitchHero={() => useGame.getState().setPhase("select")} teleport={teleport} />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black" role="status">
          <div className="text-center">
            <span className="mx-auto mb-4 block h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-aqua motion-reduce:animate-none" />
            <p className="font-display text-lg">Lighting up the city…</p>
          </div>
        </div>
      )}
      {contextLost && (
        <div role="alertdialog" aria-labelledby="game-ctx" className="absolute inset-0 grid place-items-center bg-black/90 p-6 text-center">
          <div>
            <h2 id="game-ctx" className="font-display text-xl font-bold">
              The 3D view was paused by your device
            </h2>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => {
                setContextLost(false);
                setReady(false);
                setGeneration((g) => g + 1);
              }}
            >
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
