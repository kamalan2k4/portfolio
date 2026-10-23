import type { Post, Product, Service } from "./types";

const CSBROS_RELEASE = "https://github.com/kamalan2k4/csbros-releases/releases/tag/v0.1.0";
const CSBROS_DOWNLOAD = "https://github.com/kamalan2k4/csbros-releases/releases/download/v0.1.0";

export const products: Product[] = [
  {
    slug: "csbros-companion",
    name: "csbros companion",
    tagline: "A desktop character that reminds you to drink water.",
    description:
      "An animated 3D character flies or swings onto your screen, hands you a glass of water, and leaves when you answer. Pick your character, set how often it visits, and pause it for the day whenever you like. It runs fully offline, with no account and no telemetry.",
    status: "Release candidate",
    version: "0.1.0",
    released: "2026-10-22",
    price: "Free",
    platforms: [
      { label: "Windows", requires: "Windows 10 or 11, 64-bit", size: "108 MB", href: `${CSBROS_DOWNLOAD}/csbros-setup-0.1.0.exe` },
      { label: "macOS", requires: "macOS 12+, Intel or Apple Silicon", size: "225 MB", href: `${CSBROS_DOWNLOAD}/csbros-0.1.0-mac.dmg` },
    ],
    features: [
      "Characters perform live in 3D on your desktop",
      "Reminders every 30 min to 8 hours, or a custom interval",
      "Pause for today, show me now, remind me later",
      "Five-step guided setup",
      "Offline: no account, no telemetry",
    ],
    site: "https://csbros.in",
    siteStatus: "unreachable",
    media: [
      { src: "/media/csbros/app-welcome.webp", alt: "csbros companion welcome screen", width: 759, height: 953 },
      { src: "/media/csbros/app-how-it-works.webp", alt: "csbros companion explaining how a visit works", width: 759, height: 953 },
    ],
    projectSlug: "csbros-companion",
  },
];

export const csbrosReleaseUrl = CSBROS_RELEASE;

export const posts: Post[] = [
  { slug: "ssr_vs_csr_blog", title: "SSR vs CSR: The Interview Question That Made Me Rethink Rendering", summary: "Server-side vs client-side rendering: trade-offs, when each wins, and how to explain it in an interview.", topics: ["web", "rendering"] },
  { slug: "solid_principles_blog", title: "SOLID Principles in LLD: Writing Code That Doesn't Collapse Under Pressure", summary: "A practical guide to SOLID in low-level design, with examples and code.", topics: ["design", "lld"] },
  { slug: "top_down_vs_bottom_up", title: "Top-Down vs Bottom-Up: The Day I Finally Stopped Getting Confused", summary: "Memoisation vs tabulation in dynamic programming, explained plainly.", topics: ["dsa"] },
  { slug: "stack_blog", title: "Stack Sorcery: NSE, NGE, PGE & PSE Explained With Drama", summary: "Monotonic stack patterns for next/previous greater and smaller elements.", topics: ["dsa"] },
  { slug: "the_closer_mentality_blog", title: "The Harvey Specter Mindset: The Mentality Every Student Needs", summary: "Lessons on confidence and preparation, borrowed from Suits.", topics: ["career"] },
  { slug: "hono_blog", title: "Hono: The New Hero of Web Frameworks", summary: "An introduction to Hono, the lightweight, fast, edge-ready web framework.", topics: ["backend", "runtimes"] },
  { slug: "usestate_blog", title: "useState Hook: Your React BFF!", summary: "A beginner-friendly guide to React's useState.", topics: ["react"] },
  { slug: "deno_blog", title: "Deno: The New Kid in Town", summary: "Deno as a modern contender in backend JavaScript.", topics: ["backend", "runtimes"] },
  { slug: "06", title: "React Hooks: From 'What the Hook?!' to Hooked for Life", summary: "useState, useRef and useEffect without the confusion.", topics: ["react"] },
  { slug: "05", title: "Promises in JavaScript", summary: "How promises work and how to use them well.", topics: ["javascript"] },
  { slug: "04", title: "JavaScript Hoisting EXPOSED!", summary: "What actually gets hoisted, and why.", topics: ["javascript"] },
  { slug: "03", title: "Mr. John Doe", summary: "A short story post from the archive.", topics: ["misc"] },
  { slug: "02", title: "My TLE Tragedy", summary: "How string concatenation in a loop cost me a Time Limit Exceeded, and the fix.", topics: ["dsa", "performance"] },
];

export const services: Service[] = [
  {
    id: "product-build",
    title: "Full-stack product builds",
    summary: "From idea to deployed product: UI, API, database, auth and payments, built so the next engineer can keep going.",
    deliverables: ["Product scoping", "React / Next.js front end", "Node.js or Spring Boot API", "Auth, roles and payments", "Deployment and handover docs"],
    stack: ["Next.js", "React", "Node.js", "Spring Boot", "PostgreSQL", "MongoDB"],
  },
  {
    id: "ai-features",
    title: "AI & RAG features",
    summary: "Assistants grounded in your own data: document ingestion, vector search, LLM integration and safe server-side APIs.",
    deliverables: ["Document ingestion and chunking", "Vector database setup", "Grounded Q&A endpoints", "Prompt design and guardrails"],
    stack: ["Python", "FastAPI", "LangChain", "ChromaDB", "OpenAI / Gemini"],
  },
  {
    id: "dashboards",
    title: "Admin consoles & dashboards",
    summary: "Secure internal tools with role-based access, data tables, analytics and one-click reporting.",
    deliverables: ["RBAC design", "Data grids and filters", "Charts", "PDF / Excel export"],
    stack: ["React", "TypeScript", "Firebase", "TanStack Table", "Recharts"],
  },
  {
    id: "cloud-devops",
    title: "Cloud, CI/CD & performance",
    summary: "Containerise, automate and speed up: Docker, CI pipelines, cloud deployment and Core Web Vitals tuning.",
    deliverables: ["Dockerisation", "GitHub Actions / Jenkins pipelines", "AWS / Vercel / Firebase deployment", "Lighthouse and Web Vitals audits"],
    stack: ["Docker", "GitHub Actions", "Jenkins", "AWS", "Vercel"],
  },
];
