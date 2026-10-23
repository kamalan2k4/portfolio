# Content update guide

All content is typed data in `src/content/`. Changing it updates **every surface at once**: the 3D world, the in-world
panels, the static pages, the printable resume, the sitemap and NOVA's answers. There is no CMS and no database.

| File | What lives there |
|---|---|
| `profile.ts` | Name, title, summary, contact details, links, experience, education, achievements, skills |
| `projects.ts` | Every project exhibit, plus the "Lab" shelf |
| `catalog.ts` | CSBROS products, blog posts, freelance services |
| `destinations.ts` | World districts: positions, viewpoints, colours, tour order |
| `types.ts` | The schema (TypeScript checks every edit) |

Run `npm run check` (lint + types + tests) after editing.

## Common edits

**Show your phone number:** set `showPhone: true` in `profile.ts`.

**Change availability or headline:** edit `availability`, `title`, `tagline` or `summary` in `profile.ts`.

**Add a blog post:** append to `posts` in `catalog.ts`, using the slug from the blog URL (`/posts/<slug>`).
The Writing page, Knowledge Falls and NOVA pick it up.

**Add a job:** append to `experience` in `profile.ts`. Leave `org` generic if the employer shouldn't be named.

**Add a project:**
1. Append an object to `projects` in `projects.ts`. TypeScript lists every required field.
2. Pick a `district`: `ai-dome`, `innovation`, `creator-bay` or `product-city`. It appears there as a walkable exhibit,
   and the exhibit arc re-spaces itself automatically.
3. Pick a `visual` archetype for the concept art: `mobile`, `dashboard`, `desktop-companion`, `pipeline`, `canvas`, `chat`,
   `terminal`, `helix` or `storefront`. Choose an `accent` colour.
4. Describe the architecture as `nodes` (lane 0 clients · 1 edge/API · 2 services · 3 data/external) and `edges`.
   The diagram is generated from this data.
5. Add `live` only for a URL that actually works. `node scripts/check-links.mjs` verifies it.
6. Set `featured: true` to include it on the home page, in recruiter mode and on the resume.

The project page (`/projects/<slug>`), the sitemap entry, the exhibit texture and NOVA's knowledge of it (by title and stack)
are all automatic.

**Update CSBROS:** edit `products` in `catalog.ts` (version, download URLs, sizes). When csbros.in is back online, set
`siteStatus: "live"` to show the link again.

## Images

- **Project concept art** is generated from code (`src/components/project/ProjectVisual.tsx`) into
  `public/generated/visuals/` by `scripts/gen-visuals.tsx`, which runs automatically before `dev` and `build`.
- **Hero and social image** are real renders of the world. After changing the world's look, regenerate them:
  ```bash
  npm run build && npx next start -p 3000
  node scripts/capture-hero.mjs http://localhost:3000   # writes public/media/hero/*
  npm run build                                          # bakes the new OG base into /opengraph-image
  ```
- **CSBROS screenshots** live in `public/media/csbros/`. Don't add the Iron Man or Spider-Man screens: their character rights
  aren't cleared for public use.

## The world

- **Move or add a district:** edit `destinations.ts` (`position` is the landmark and `viewpoint` is where travel lands).
  `npm test` checks that every viewpoint is walkable and that every walkway crossing the river has a bridge.
- **District architecture** is in `src/world/scene/Districts.tsx` and `Landmarks.tsx`. Static parts are data (`part.box(...)` etc.)
  merged per material by `<Batch>`. Keep animated pieces separate, and reuse material keys so the draw-call count stays low.
- **Quality profiles** are in `src/world/quality.ts` (tree counts, terrain detail, shadows, texture scale).

## NOVA

NOVA's answers come from `src/nova/engine.ts`: keyword intents, project-name matching and technology matching, all over the
content data. It needs no network and no API key. To add an intent, add an entry to `intents` and a test in `engine.test.ts`.
New projects and skills are understood automatically.
