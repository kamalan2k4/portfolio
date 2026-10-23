"use client";

import { useEffect, useRef } from "react";
import { resetInput } from "./input";
import { disposeExhibitTextures } from "./scene/exhibitTexture";
import type { Capability } from "./quality";
import { Hud } from "./hud/Hud";
import { useWorld } from "./store";
import World from "./World";

/** Full-screen 3D experience: canvas + HUD. Loaded on demand as its own chunk. */
export default function WorldExperience({ capability, tour, onExit }: { capability: Capability; tour: boolean; onExit: () => void }) {
  const ready = useWorld((s) => s.ready);
  const root = useRef<HTMLDivElement>(null);
  const startedTour = useRef(false);

  useEffect(() => {
    performance.mark("world:mount");
    useWorld.setState({ ...useWorld.getInitialState(), quality: capability.level, reducedMotion: capability.reducedMotion });
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    root.current?.focus();
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      document.body.style.cursor = "";
      resetInput();
      disposeExhibitTextures();
      useWorld.setState(useWorld.getInitialState());
    };
  }, [capability]);

  useEffect(() => {
    if (ready && tour && !startedTour.current) {
      startedTour.current = true;
      useWorld.getState().startTour();
    }
  }, [ready, tour]);

  return (
    <div ref={root} tabIndex={-1} role="application" aria-roledescription="3D portfolio world" aria-label="Kamalan C S portfolio world. Use the Map or Ask NOVA buttons to navigate." className="fixed inset-0 z-50 bg-night outline-none">
      <World />
      <Hud onExit={onExit} touch={capability.coarsePointer} />
      <div
        aria-hidden={ready}
        className={`pointer-events-none absolute inset-0 grid place-items-center bg-night transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
      >
        <div className="text-center" role="status">
          <span className="mx-auto mb-4 block h-10 w-10 animate-spin rounded-full border-2 border-stone/20 border-t-aqua motion-reduce:animate-none" />
          <p className="font-display text-lg">Growing the eco-park…</p>
          <p className="mt-1 text-sm text-stone-dim">Procedural world · no heavy downloads</p>
        </div>
      </div>
    </div>
  );
}
