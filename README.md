# Kamalan C S · Portfolio

An explorable 3D eco-park portfolio with a fast, text-first recruiter mode.

- **Stack:** Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, Three.js / React Three Fiber
- **Content:** typed data in `src/content/`, the single source of truth for the 3D world, pages, resume, SEO and NOVA
- **No-WebGL path:** `/recruiter`, `/projects`, `/resume` and every other content page are static HTML

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

Copy `.env.example` to `.env.local` to configure the site URL and contact delivery.

Planning docs: [`docs/`](docs/).
