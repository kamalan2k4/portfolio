"use client";

import { Component, lazy, type ReactNode, Suspense, useCallback, useEffect, useState } from "react";
import type { Capability } from "@/world/quality";

const load = () => import("@/world/WorldExperience");
const WorldExperience = lazy(load);

/**
 * Hero mode (the city game with licensed-character models) is for development only:
 * on under `next dev`, or when NEXT_PUBLIC_HERO_GAME=1. Production builds compile it out.
 */
const HERO_GAME = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_HERO_GAME === "1";
const loadGame = HERO_GAME ? () => import("@/game/GameExperience") : null;
const GameExperience = loadGame ? lazy(loadGame) : null;

type Mode = { state: "idle" } | { state: "open"; capability: Capability; tour: boolean; game?: boolean } | { state: "unsupported" } | { state: "failed" };

class WorldBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("3D world failed", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Hero call-to-action that loads the 3D world on demand. The page is fully usable without it. */
export function WorldLauncher() {
  const [mode, setMode] = useState<Mode>({ state: "idle" });

  const enter = useCallback(async (tour: boolean, game = false) => {
    performance.mark("world:request");
    const { detectCapability } = await import("@/world/quality");
    const capability = detectCapability();
    if (!capability.webgl) {
      setMode({ state: "unsupported" });
      return;
    }
    setMode({ state: "open", capability, tour, game });
    if (location.hash !== "#explore") history.pushState({ world: true }, "", "#explore");
  }, []);

  const exit = useCallback(() => {
    setMode({ state: "idle" });
    if (location.hash === "#explore") history.back();
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (location.hash !== "#explore") setMode((m) => (m.state === "open" ? { state: "idle" } : m));
    };
    window.addEventListener("popstate", onPop);
    // Deep link: /#explore opens the world directly. `enter` only sets state after an await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (location.hash === "#explore") void enter(false);
    return () => window.removeEventListener("popstate", onPop);
  }, [enter]);

  const prefetch = () => void load();

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => enter(false)} onPointerEnter={prefetch} onFocus={prefetch}>
        Explore the world
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => enter(true)} onPointerEnter={prefetch} onFocus={prefetch}>
        Guided tour
      </button>
      {GameExperience && (
        <button type="button" className="btn btn-ghost border-amber/60 text-amber" onClick={() => enter(false, true)} onPointerEnter={() => void loadGame?.()} onFocus={() => void loadGame?.()}>
          Hero mode <span className="font-mono text-[10px] opacity-70">DEV</span>
        </button>
      )}

      {(mode.state === "unsupported" || mode.state === "failed") && (
        <p role="alert" className="w-full text-sm text-amber">
          {mode.state === "unsupported" ? "Your browser or device can't run the 3D world (WebGL 2 is unavailable)." : "The 3D world couldn't start on this device."}{" "}
          <a className="link" href="/recruiter">
            Open recruiter mode
          </a>{" "}
          for everything in text.
        </p>
      )}

      {mode.state === "open" && (
        <WorldBoundary onError={() => setMode({ state: "failed" })}>
          <Suspense
            fallback={
              <div className="fixed inset-0 z-50 grid place-items-center bg-night" role="status">
                <p className="font-display text-lg">Loading the 3D engine…</p>
              </div>
            }
          >
            {mode.game && GameExperience ? <GameExperience capability={mode.capability} onExit={exit} /> : <WorldExperience capability={mode.capability} tour={mode.tour} onExit={exit} />}
          </Suspense>
        </WorldBoundary>
      )}
    </>
  );
}
