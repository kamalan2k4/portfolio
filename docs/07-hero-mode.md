# Hero mode (flagged off in production)

An explorable night city where visitors pick a hero (Spider-Man, Iron Man or Captain America), swing, fly or drive
around, and open the same portfolio districts, NOVA and map as the eco-park.

**Status:** code is in the repo but **disabled in production builds**. With the flag off, `next.config.ts` aliases
`@/game/GameExperience` to an empty stub, so no game code ships. It is always on under `npm run dev`.

## Run it locally

```bash
gh auth status                       # the models come from the private csbros-companion repo
node scripts/fetch-hero-models.mjs   # → public/dev-assets/heroes/ (git-ignored, Iron Man meshopt-compressed to ~3.6 MB)
npm run dev                          # "Hero mode DEV" button appears on the home page
```

## Turn it on in production later

1. Set `NEXT_PUBLIC_HERO_GAME=1` in Vercel (Project → Settings → Environment Variables).
2. The models are not in git and `.vercelignore` excludes `public/dev-assets`, so a deploy won't include them. Either:
   - remove `public/dev-assets` from `.vercelignore`, fetch the models locally, and deploy from your machine with
     `npx vercel deploy --prod` (the CLI uploads local files); or
   - host the two `.glb` files elsewhere and change `model` in `src/game/heroes.ts` to their URLs.
3. Redeploy and open the home page: the **Hero mode** button appears next to "Guided tour".

**Licensing:** the 3D models are CC BY 4.0 (credits in the csbros-companion character packs). The characters themselves
are Marvel IP whose rights are not cleared. Enabling this on a public site is your call.

## Controls

| | Desktop | Touch |
|---|---|---|
| Move / look | WASD · mouse (click to lock the cursor) | Left stick · drag anywhere |
| Jump · swing · take off | Space (hold in the air to swing) | Big button |
| Attack | Click / J (web-zip, repulsor, shield) | Attack button |
| Heavy | Right-click / K (unibeam, shield charge) | Second button |
| Sprint / afterburner | Shift | Push the stick all the way |
| Fly down | Ctrl / C | Down button |
| Car | F | Drive button (when near a car) |
| District | E | Open button (on a plaza) |
| Slow motion · map · NOVA | V · M · N | — · Map · NOVA |

## Code map

`src/game/`: `city/` (procedural skyline, streets, harbour, signage, district plazas), `rig/` (Mixamo pose solver and
poses ported from csbros-companion, model loading, Cap costume shader), `HeroController.tsx` (physics, abilities,
cinematic camera), `HeroAvatar.tsx` (procedural animation), `vehicles.ts` / `Traffic.tsx`, `fx.ts` / `Effects.tsx`,
`hud/` (character select, HUD, touch controls). Play-test scripts: `scripts/game-*.mjs`.
