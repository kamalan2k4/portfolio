# Performance: budgets, measurements, method

All numbers come from **production builds** (`npm run build && npm start`), measured on 2026-10-23.
Lab data only: there is no field (RUM) data until the site is deployed and receives traffic.

## Test environment

| | |
|---|---|
| Machine | Windows 11 laptop, integrated **AMD Radeon** GPU (ANGLE / Direct3D 11) |
| Browser | Chrome (Playwright `channel: "chrome"`, real GPU) |
| Lighthouse | 13.5.0, default mobile profile (Moto G Power, slow 4G, 4× CPU) and `--preset=desktop` |
| Mobile 3D | 390×844 touch emulation on the same GPU ("balanced" profile). **No physical phone test yet**; see limitations. |

## Budgets vs measured

| Budget | Target | Measured | Status |
|---|---|---|---|
| LCP (mobile lab) | ≤ 2.5 s | 2.2 – 2.6 s (home 2.6 s) | ✅ / ⚠️ home at the edge in simulation; observed LCP is 0.26 s |
| INP proxy: TBT (mobile lab) | ≤ 200 ms | 70 – 210 ms | ✅ (1 page at 210 ms) |
| CLS | ≤ 0.1 | 0 – 0.017 | ✅ |
| Initial JS per route | ≤ 185 KB gz¹ | 175.5 – 177.1 KB gz | ✅ |
| App-owned JS on first load | ≤ 20 KB gz | ≈ 15 KB gz | ✅ |
| 3D engine chunk (on demand only) | ≤ 320 KB gz | 275 KB gz | ✅ |
| 3D assets before first interaction | ≤ 1.5 MB | ≈ 0 (procedural world; exhibit art ≈ 1 KB SVG each, loaded by distance) | ✅ |
| World request → first frame (desktop, high) | ≤ 1.5 s | 1.2 – 1.4 s (0.35 s chunk + 0.85 – 1.06 s mount-to-ready) | ✅ |
| Draw calls, steady state | ≤ 120 / ≤ 60 low | 59 (high) | ✅ |
| Triangles, steady state | ≤ 400 k / ≤ 120 k | 180 k (high), 114 k (balanced) | ✅ |
| Frame rate | 60 fps target | 55 – 60 fps (high, iGPU), 60 fps (balanced) | ✅ |
| Shader programs | minimise | 17 (high), 14 (balanced) | ✅ |

¹ The original 110 KB target was set before measuring. Next 16 + React 19 alone account for ≈ 160 KB gz
(react-dom ≈ 70 KB, router ≈ 45 KB, client runtime ≈ 39 KB), so the budget was revised to the measured baseline plus headroom.

## Lighthouse matrix (production)

| Page | Mobile perf | Desktop perf | A11y | Best practices | SEO |
|---|---|---|---|---|---|
| `/` | 97 | 100 | 100 | 100 | 100 |
| `/recruiter` | 97 | 100 | 100 | 100 | 100 |
| `/projects` | 94 | 100 | 100 | 100 | 100 |
| `/projects/vinathi` | 97 | 100 | 100 | 100 | 100 |
| `/products` | 96 | 100 | 100 | 100 | 100 |
| `/services`, `/writing`, `/contact`, `/resume` | 98 | 100 | 100 | 100 | 100 |

## What moved the numbers (and why)

| Change | Effect |
|---|---|
| 3D engine behind a click (`React.lazy` + prefetch on hover/focus) | Home ships no three.js; the 275 KB chunk loads only on intent |
| Removed drei `<Environment>` | It re-renders the scene into a cube map, compiling every shader twice: 30 → 17 programs, compile 2.75 s → 0.4 s |
| Static batching (architecture kit) | Each district's static parts are merged per material: 148 → 59 steady draw calls |
| `compileAsync` before first frame | Parallel shader compilation (KHR_parallel_shader_compile); loader stays responsive |
| Frozen shadow map | Scenery is static, so the shadow map renders once instead of every frame |
| Instanced vegetation, taxis, hologram dots | Hundreds of objects in a handful of draws |
| SVG art rendered to files at build time | Less HTML/RSC payload and hydration; cacheable; reused as exhibit textures |
| Hero = pre-rendered WebP (portrait variant for phones) | No main-thread SVG rasterisation; phones fetch 37 – 63 KB, not a 2400 px image |
| System font for body text, blur only on HUD | Home mobile TBT 470 ms → ≈ 80 ms; Lighthouse 80 → 97 |

## Remaining bottlenecks (honest list)

- **Home LCP in Lighthouse's simulation (2.6 s)** is driven by the hero image and font bytes on throttled 4G, not by rendering: the observed LCP is the hero text at ≈ 0.26 s.
- **Framework baseline JS (≈ 160 KB gz)** is the largest fixed cost; only a framework change would remove it.
- **First-visit shader compile** varies by GPU and driver cache: 0.25 – 1.1 s observed on D3D11. Untested on Metal/Apple GPUs and on mid-range Android hardware.
- **R3F warning**: `THREE.Clock` deprecation is logged from inside @react-three/fiber 9.8; harmless, fixed upstream later.

## How to reproduce

```bash
npm run build && npx next start -p 3000
node scripts/measure-bundle.mjs index recruiter projects/vinathi   # initial JS per route
node scripts/lighthouse.mjs http://localhost:3000 ./lh            # mobile + desktop matrix
GPU=1 node scripts/world-flow.mjs http://localhost:3000 ./shots   # world load timing, draw calls, fps
GPU=1 node scripts/world-districts.mjs http://localhost:3000 ./shots
```

The world records `world:request`, `world:mount`, `world:compile-start`, `world:compiled`, `world:ready` and
`world:steady` User Timing marks (with renderer stats in `detail`), so the same numbers are visible in DevTools → Performance.
