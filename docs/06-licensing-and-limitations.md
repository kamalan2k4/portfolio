# Asset licensing and known limitations

## Assets and licences

| Asset | Source | Licence / status |
|---|---|---|
| 3D world (terrain, water, trees, architecture, NOVA, air taxis) | Procedural geometry and shaders written for this repo | Original work in this repository |
| Project concept illustrations and architecture diagrams | Generated from code (`ProjectVisual.tsx`, `ArchitectureDiagram.tsx`) | Original work |
| Hero and social images | Screenshots of this repo's own 3D world | Original work |
| CSBROS logo and app screenshots (`public/media/csbros/`) | Kamalan's own product (csbros-site repository) | Owned by Kamalan. The Iron Man / Spider-Man screenshots are deliberately excluded (rights not cleared). |
| Space Grotesk font | Google Fonts via `next/font` (self-hosted at build) | SIL Open Font License 1.1 |
| three.js, React Three Fiber, drei, Next.js, React, zustand, zod | npm | MIT |
| Resend SDK | npm | MIT |

No stock photos, third-party 3D models, placeholder images or tracking scripts are used.

## Known limitations

**Content**
- **csbros.in is unreachable** (DNS/TLS) as of 2026-10-23, so the site isn't linked. The downloads point at the working GitHub
  release. Set `siteStatus: "live"` in `catalog.ts` once the domain is fixed.
- **LinkedIn and LeetCode** block automated checks (999 / 403). Both profiles were verified manually: LeetCode via its public API
  (475 solved), LinkedIn by URL.
- The **resume** is a print-optimised page generated from the content data (Save as PDF), so it never drifts from the site
  and never shows employer names. There is no static PDF file.
- Project write-ups present each project's vision ambitiously, but list only capabilities present in the code.
  There are no invented metrics, clients or testimonials.

**Platform and testing**
- The 3D world was measured on one **integrated AMD GPU** (D3D11) and on an emulated phone viewport on that same GPU.
  It hasn't yet been tested on physical mid-range Android phones, iOS Safari or Apple GPUs. The quality auto-detection and
  the FPS-based step-down are designed for them, but they're unmeasured there.
- Lighthouse numbers are **lab** data. Enable field monitoring (Vercel Speed Insights) after launch for 75th-percentile Core Web Vitals.
- The contact **rate limiter is in-memory** per server instance (see `04-deployment.md` for the Redis upgrade path).
- **NOVA is deterministic** (keyword and entity matching). It doesn't do open-ended conversation. An optional LLM backend
  (server-side, grounded on `src/content`, with the deterministic engine as fallback) is a natural extension but wasn't added,
  to keep the site free of API keys and running costs.
- Collision uses circles and the walkable-terrain rules; you can't climb buildings or swim, by design.
- `THREE.Clock` deprecation warning comes from inside @react-three/fiber 9.8 (harmless).
