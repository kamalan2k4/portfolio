# Proposed Implementation Plan

## Stack (stable, mutually compatible)

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript strict | SSG for every content page, route handlers for contact, image optimisation |
| 3D | three r17x, @react-three/fiber 9, @react-three/drei 10 | R3F 9 is the React-19-compatible line |
| Styling | Tailwind CSS 4 + CSS tokens | small CSS, design tokens shared by DOM UI |
| State | zustand (scene ⇄ UI bridge, no per-frame React state) | subscribe-with-selector avoids re-renders |
| Validation | zod (shared client/server) | contact + NOVA input |
| Contact | Route handler → Resend, honeypot + time-trap + IP rate limit | no secrets on client |
| Tests | Vitest + Testing Library (logic/UI), Playwright (e2e, a11y via axe), Lighthouse CI | measured, not promised |
| Deploy | Vercel (static + edge-cached) | zero-config for Next |

## Content model (`src/content/*.ts`, typed)

`profile`, `links`, `experience[]`, `education[]`, `skills{group: Skill[]}`, `projects[]` (slug, title, tier, district, problem, solution,
architecture[], stack[], contribution[], links{repo, live, private}, media[]), `products[]`, `posts[]`, `services[]`, `destinations[]`
(id, name, district, position, camera pose, panel id). One source of truth feeds the 3D world, the DOM panels, `/recruiter`, SEO pages, and NOVA.

## Route map

- `/` — Arrival Gate: static HTML hero (LCP = text + one AVIF poster), CTAs Explore / Guided Tour / Resume / Contact. 3D loads **after** first paint and only on intent or idle + capable device.
- `/recruiter` — Quick mode, no WebGL: summary, experience, top projects, skills, contact, resume PDF.
- `/projects`, `/projects/[slug]` — crawlable, SSG.
- `/products`, `/blog` (links out to the live blog), `/contact`.
- `/resume.pdf`, `sitemap.xml`, `robots.txt`, OG images.

## World (the Eco-Park), procedural first

No external GLBs exist yet, so the first version is built procedurally. That keeps the initial asset payload near zero.
GLBs are added later only where they clearly improve quality (Draco/Meshopt + KTX2).

```
Nexus (centre plaza, NOVA, map pylon)
 ├─ N  Career Citadel      (stone + glass tower)
 ├─ NE AI Research Dome    (geodesic glass dome)
 ├─ E  Innovation District (exhibit pavilions on a river bridge)
 ├─ SE Product City        (CSBROS towers)
 ├─ S  Arrival Gate        (spawn, overlook)
 ├─ SW Creator Bay         (lakeside studio)
 ├─ W  Knowledge Falls     (waterfall, reading terraces)
 └─ NW Launch Terminal     (air-taxi pad)
```

Scene graph: `Canvas > Environment(sky, fog, sun, hemi) > Terrain(heightmap shader) > Water(river+falls shader) > Foliage(InstancedMesh, LOD by distance)
> Districts[lazy] > Paths(navmesh-lite: spline graph + radius collision) > Player(controller) > NOVA > Interactables > AirTaxis(instanced)`.

Navigation: WASD/arrows + pointer-look (desktop), virtual joystick + drag-look (touch), click-to-travel on the always-available map (`M`),
eased camera fly-to, interaction cue rings + `E`/tap to open a DOM panel.

## Performance strategy & initial budgets (validated in Phase 3/6 against prod builds)

| Budget | Target |
|---|---|
| Initial JS (route `/`, no 3D) | ≤ 110 KB gzip |
| 3D engine chunk (deferred) | ≤ 320 KB gzip |
| World assets before first interaction | ≤ 1.5 MB desktop / ≤ 600 KB low-power |
| Draw calls | ≤ 120 desktop / ≤ 60 low-power |
| Triangles | ≤ 400 k / ≤ 120 k |
| LCP / INP / CLS (lab, mid-tier mobile, 4G) | ≤ 2.5 s / ≤ 200 ms / ≤ 0.1 |

Techniques: dynamic import of the scene, `frameloop="demand"` when idle, adaptive DPR, a GPU-tier → quality profile (high / balanced / low-power),
instanced vegetation, a single shadow-casting light with a baked contact-shadow fallback, no heavy post-processing (optional mild tone mapping only),
district-level lazy mounting by distance, disposal on unmount, `prefers-reduced-motion` → no camera easing or foliage sway, and WebGL-unavailable → automatic `/recruiter`.

## NOVA

Deterministic intent router (keywords + synonyms → intent → {reply, action: travel|open|highlight}) over the content model. Works offline.
Optional phase-5 AI: `/api/nova` server route, grounded on the content JSON, with a rate limit and fallback to the deterministic answer. Off unless an API key is set.

## Delivery stages (one commit + push each)

1. Scaffold, tooling, content model, `/recruiter` + SEO pages (fully useful without 3D).
2. Vertical slice: Arrival + Nexus + one path → Career Citadel, NOVA panel, resume action. Measure.
3. Innovation District + AI Dome + project panels.
4. Product City, Creator Bay + contact API, Knowledge Falls, Launch Terminal.
5. Guided tour, map polish, mobile controls, low-power profile.
6. Test/a11y/Lighthouse/link-check pass and fixes.
7. Docs: deploy, env vars, licensing, content-update guide, measured results.
