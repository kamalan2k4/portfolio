# Phase 1 — Content Inventory & Gap Analysis

Sources inspected (2026-10-23): resume PDF, GitHub `kamalan2k4` (55 repos, READMEs, manifests, file trees),
`blogs-of-kamal.vercel.app`, LeetCode public GraphQL, `csbros-site` source config, `csbros-releases`.

Display name everywhere: **Kamalan C S**. Employer names are intentionally omitted from the site.

## 1. Verified identity & links

| Item | Value | Status |
|---|---|---|
| Name | Kamalan C S | ✅ |
| Email | cskamalan@gmail.com | ✅ resume |
| Phone | +91 7339514400 | ✅ resume — **show on site?** (open question) |
| Location | Coimbatore, Tamil Nadu, India | ✅ |
| GitHub | https://github.com/kamalan2k4 | ✅ |
| LinkedIn | https://www.linkedin.com/in/kamalan-cs-829679241/ | ✅ (bot-blocked, normal) |
| LeetCode | https://leetcode.com/u/Tzjc9aKApH/ | ✅ |
| Blog | https://blogs-of-kamal.vercel.app | ✅ 200, 13 posts |
| CSBROS | https://csbros.in | ⚠️ **DNS/TLS not resolving today** |
| CSBROS installers | github.com/kamalan2k4/csbros-releases v0.1.0 | ✅ published 2026-10-22 |

## 2. Verified professional facts

- **Current role:** Dev Engineer Trainee, digital engineering unit — Jul 2026–present (company name omitted by request).
  Full-stack work across app components, backend services, API integrations (Java, JavaScript); Git, Linux, Docker, Jenkins; AWS & Kubernetes exposure.
- **Education:** M.Tech, Computer Science & Engineering — Sri Krishna College of Engineering and Technology (SKCET), Coimbatore, expected 2027.
- **Finalist**, PSG iTech / SAP HackFest 2025.
- **LeetCode (live, verified):** 475 solved — 149 Easy / 268 Medium / 58 Hard; 365-Days badge + yearly 50/100/200-day badges (2024–2026).
  Resume says "350+" — site will use the live 475 figure.
- **Technical blogger:** 13 posts (SSR vs CSR, SOLID in LLD, DP top-down vs bottom-up, monotonic stacks, Hono, Deno, React hooks, Promises, hoisting, …).
- **Skills (resume):** Java, JS, TS, Python, SQL · React, Next.js, React Native, Tailwind · Node, Express, Spring Boot, FastAPI ·
  MongoDB, MySQL, PostgreSQL, Firestore, ChromaDB · LLM APIs, RAG, embeddings, chunking, semantic search, prompt engineering ·
  AWS EC2/S3/IAM · Linux, Git, Docker, Jenkins, Kubernetes, CI/CD.
  **Evidence on GitHub additionally shows:** Expo, Firebase Cloud Functions, Cloud Scheduler, Electron-style desktop packaging + GitHub Actions
  cross-platform builds, Astro, Cloudflare Pages, Drizzle ORM, Upstash Redis, Zod, JWT, Socket.io, Razorpay, AWS SES, AWS S3 (Spring), Hugging Face TrOCR, LangChain, Gemini, OpenAI, Atlas Vector Search, Three.js, GSAP.

## 3. Project evidence (ranked by portfolio strength)

Tier = how strongly the code backs a headline exhibit. "Tutorial-derived" is flagged because recruiters recognise them.

| # | Project | Evidence | Stack | Live | Tier / District |
|---|---|---|---|---|---|
| 1 | **CSBROS Companion** — desktop 3D character that delivers hydration reminders | 143 files, detailed README, Win+macOS installers, CI build workflow, data-pack characters, offline/no telemetry | TypeScript, 3D (CC-BY models, procedural animation), desktop packaging, GitHub Actions | Release v0.1.0 | **S** · Product City |
| 2 | **csbros.in** — product site | Astro, Cloudflare Pages, release-driven config, generated OG/logo/clips | Astro, TS, Cloudflare | ⚠️ down | A · Product City |
| 3 | **VINATHI** — always-on adaptive interview simulator | Expo app + Firebase Functions; scheduled dispatcher, adaptive mastery engine (recency/weakness/exp-smoothing), OpenAI generation, push deep-links | React Native, Expo, Firebase, Cloud Scheduler, OpenAI | private repo | **S** · AI Dome |
| 4 | **LeadFlow CRM** | Clean layered architecture, JWT, Zod, per-user data isolation, tests | React+TS, Vite, Express+TS, MongoDB | repo only | **S** · Innovation |
| 5 | **VakeelSaab** — lawyer document-review platform | Spring Boot + Spring Security, S3 storage, roles (client/lawyer), upload/review/payments pages | Java, Spring Boot, AWS S3, React 19, Tailwind 4 | private | A · Innovation |
| 6 | **DevTinder** (backend) | auth, connection requests, Socket.io chat, Razorpay payments, AWS SES email, cron jobs | Node, Express, MongoDB | fork (course-based) | A · Innovation |
| 7 | **iBots / Flexo dashboard** — ops dashboard | Firebase Auth/Firestore/Functions, admin guard, enquiries, teams, data tables, PDF/XLSX export, charts | React 19, TS, Firebase, TanStack Table | private | A · Creator Bay (client work?) |
| 8 | **Helpdesk ticketing** | Spring Boot + React ticket CRUD, component tests | Java, Spring, React | private | B · Innovation |
| 9 | **RAG chatbot (Atlas Vector Search)** | PDF ingest → chunk → embeddings → vector search → answer | Python, Streamlit, MongoDB Atlas | repo | A · AI Dome |
| 10 | **Text→image vector search** | ChromaDB, LangChain, Gemini, FastAPI/Gradio | Python | repo (no README) | B · AI Dome |
| 11 | **Handwriting Recognition** | canvas → FastAPI → Microsoft TrOCR (ViT+GPT decoder); deployment memory-limit write-up | Next.js, FastAPI, HF Transformers | 200 (frontend) | A · AI Dome |
| 12 | **Cyber-bullying detection** | Next.js app (upload/analysis/prediction/visualisation) + Python API | Next.js, Python ML | 404 | B · AI Dome |
| 13 | **DNA Converter API** (hackathon) | FastAPI + BioPython public API, Next.js frontend | Python, FastAPI, Next.js | 200 | B · Innovation |
| 14 | **StackUp Nexus** library system | Next.js, Postgres/Neon, Drizzle, Upstash, Resend, QStash | Next.js, TS | repo | B — **tutorial-derived** (clone of a JSM course) |
| 15 | Netflix-GPT, Promptopia, Foodie, gaming-site, NestMakers, next.js-calci | small/learning or tutorial | React/Next | some live | C · "Lab" shelf only |
| 16 | **Leetcode-problems-DSA** | 500 files of Java solutions | Java | repo | Career Citadel stat |
| 17 | **fix-task-broken** | Dockerised log-report benchmark task with tests | Python, Docker | repo | B · DevOps |

## 4. Content position on "exaggeration"

You asked me to exaggerate the projects. I'll present them **as ambitiously as the code allows**:
architecture-first write-ups, strong verbs, themes across full-stack / DevOps / AI-RAG / cloud, and the best framing of every real feature.
I will **not** invent users, revenue, metrics, clients, testimonials, or features the code doesn't have. Recruiters open the linked repo,
and interviewers ask about anything on the page, so a claim that falls apart in either place costs you more than it gains.
Tutorial-derived repos go on a "Lab" shelf, not the headline exhibits.

## 5. Gaps — need your input

1. **Work projects:** which repos (if any) came from your job/upskilling? Candidates: `helpdesk`, `vakeelsaab`, `Cognizant-JavaFSE-Upskilling` (renamed on site as "Java Full-Stack Upskilling" to avoid the company name), `fix-task-broken`.
2. **Freelance/client work:** is `ibots` / `flexo-app` / `NestMakers` / `vakeelsaab` client work? Can the client be named? Any freelance rates, packages, availability?
3. **Resume project "RAG-Based Technical Knowledge Assistant"** (FastAPI + HF + ChromaDB): which repo? `text_to_image_vector_search_using_chroma_db` looks closest. If none is public, I'll show it without a repo link.
4. **csbros.in is down** (DNS/TLS). Fix the domain, or should Product City link to the GitHub release page until it's fixed? Pricing: is csbros free?
5. **Private repos** (vinathi, vakeelsaab, helpdesk, ibots, flexo, csbros-companion, csbros-site): make public, or show "private — demo on request"?
6. **Assets:** a professional photo? Screenshots/videos of VINATHI, LeadFlow, CSBROS (I can pull the csbros clips from the repo)?
7. **Phone number:** show publicly or email-only?
8. **Contact delivery:** Resend (free tier, needs an API key + verified sender) or another provider?
9. **Hosting & domain:** Vercel? Custom domain?
10. **GitHub repo for this portfolio:** name and visibility (e.g. public `kamalan2k4/portfolio`).
