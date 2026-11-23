"use client";

import { HERO_ORDER, HEROES } from "../heroes";
import { useGame } from "../state";

/** Hero select: the chosen hero is shown live in 3D behind this panel. */
export function CharacterSelect({ ready, touch, onPlay, onExit }: { ready: boolean; touch: boolean; onPlay: () => void; onExit: () => void }) {
  const heroId = useGame((s) => s.hero);
  const setHero = useGame((s) => s.setHero);
  const hero = HEROES[heroId];
  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/85 via-black/10 to-black/60 p-3 sm:p-6 lg:flex-row lg:items-stretch lg:bg-gradient-to-r lg:from-black/85 lg:via-black/30 lg:to-transparent">
      <section aria-labelledby="select-title" className="flex max-h-full flex-col gap-3 lg:w-[440px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Hero mode · development build</p>
            <h2 id="select-title" className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Choose your hero
            </h2>
          </div>
          <button type="button" className="btn btn-ghost shrink-0" onClick={onExit}>
            Exit
          </button>
        </div>
        <ul role="radiogroup" aria-label="Heroes" className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible">
          {HERO_ORDER.map((id) => {
            const h = HEROES[id];
            const active = id === heroId;
            return (
              <li key={id} className="min-w-[78%] snap-start sm:min-w-[300px] lg:min-w-0">
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setHero(id)}
                  className={`flex h-full w-full flex-col gap-1.5 rounded-2xl border p-4 text-left backdrop-blur-md transition-colors ${active ? "bg-black/60" : "border-white/15 bg-black/35 hover:bg-black/50"}`}
                  style={active ? { borderColor: h.accent, boxShadow: `0 0 0 1px ${h.accent}, 0 0 30px ${h.accent}44` } : undefined}
                >
                  <span className="font-display text-xl font-bold" style={{ color: active ? h.accent : undefined }}>
                    {h.name}
                  </span>
                  <span className="text-sm text-stone/85">{h.tagline}</span>
                  {active && (
                    <ul className="mt-1 hidden space-y-0.5 text-xs text-stone/75 [@media(min-height:560px)]:block">
                      {h.powers.map((p) => (
                        <li key={p}>• {p}</li>
                      ))}
                    </ul>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {!touch && (
          <dl className="hidden grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl border border-white/10 bg-black/45 p-4 text-xs backdrop-blur-md lg:grid">
            {hero.controls.map(([k, v]) => (
              <div key={k} className="contents">
                <dt>
                  <kbd className="rounded border border-white/25 px-1.5 py-0.5 font-mono">{k}</kbd>
                </dt>
                <dd className="text-stone/80">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      <div className="flex flex-col items-stretch gap-2 lg:justify-end">
        {touch && <p className="text-center text-xs text-stone/70">Left stick moves · drag to look · buttons on the right do the rest</p>}
        <button type="button" disabled={!ready} onClick={onPlay} className="btn btn-primary h-14 w-full text-lg disabled:opacity-60 lg:w-72" style={{ background: hero.accent, color: "#07110d" }}>
          {ready ? `Play as ${hero.name}` : "Suiting up…"}
        </button>
      </div>
    </div>
  );
}
