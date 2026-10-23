import type { Achievement, Education, Experience, Profile, SkillGroup } from "./types";

export const profile: Profile = {
  name: "Kamalan C S",
  shortName: "Kamalan",
  title: "Software Engineer · Full-Stack, AI & Cloud",
  roles: ["Full-Stack Engineer", "AI / RAG Engineer", "Cloud & DevOps", "Freelance Product Builder"],
  tagline: "I design and ship full-stack products end to end: interfaces, APIs, data, AI pipelines and the infrastructure that runs them.",
  summary:
    "Software engineer who builds across the whole stack. I've shipped a cross-platform 3D desktop app with automated release pipelines, an AI interview coach driven by an adaptive learning engine and scheduled cloud functions, retrieval-augmented assistants over vector databases, and production-style platforms in Spring Boot, Node.js and Next.js. I freelance for clients who need a product built properly, and I work through problems with a strong algorithms foundation: 475+ LeetCode problems solved.",
  location: "Coimbatore, Tamil Nadu, India",
  email: "cskamalan@gmail.com",
  phone: "+91 7339514400",
  showPhone: false,
  availability: "Open to full-time software engineering roles and freelance projects.",
  links: {
    github: "https://github.com/kamalan2k4",
    linkedin: "https://www.linkedin.com/in/kamalan-cs-829679241/",
    leetcode: "https://leetcode.com/u/Tzjc9aKApH/",
    blog: "https://blogs-of-kamal.vercel.app",
    csbros: "https://csbros.in",
  },
};

export const experience: Experience[] = [
  {
    id: "dev-engineer",
    role: "Dev Engineer Trainee",
    org: "Digital Engineering Unit",
    kind: "trainee",
    start: "2026-07",
    end: null,
    location: "India",
    highlights: [
      "Build across application components, backend services and API integrations in Java and JavaScript.",
      "Own application logic, service integration and debugging across development layers.",
      "Work in Linux environments with Git, Docker and Jenkins pipelines; hands-on with AWS deployment and Kubernetes orchestration.",
      "Engineered containerised AI-agent benchmark tasks with reference solutions and automated verifiers.",
    ],
    stack: ["Java", "Spring Boot", "JavaScript", "React", "Docker", "Jenkins", "AWS", "Kubernetes", "Linux"],
    projectSlugs: ["helpdesk", "agent-benchmarks"],
  },
  {
    id: "freelance",
    role: "Freelance Software Engineer",
    org: "Independent",
    kind: "freelance",
    start: "2024-11",
    end: null,
    location: "Remote",
    highlights: [
      "Deliver client products end to end, from requirements and UI to backend, cloud and launch.",
      "Built a role-secured operations console on Firebase with admin-only provisioning, analytics and PDF/Excel export.",
      "Built a legal document-review platform with pre-signed AWS S3 uploads and a payment-gated review workflow.",
      "Run CSBROS, my own product studio, which ships a cross-platform 3D desktop companion.",
    ],
    stack: ["React", "TypeScript", "Next.js", "Firebase", "Spring Boot", "AWS S3", "Node.js"],
    projectSlugs: ["ibots-ops-console", "vakeelsaab", "nestmakers", "csbros-companion"],
  },
];

export const education: Education[] = [
  {
    degree: "M.Tech, Computer Science and Engineering",
    school: "Sri Krishna College of Engineering and Technology",
    location: "Coimbatore",
    end: "Expected 2027",
    notes: ["Finalist, PSG iTech / SAP HackFest 2025"],
  },
];

export const achievements: Achievement[] = [
  {
    title: "475+ LeetCode problems",
    detail: "149 easy · 268 medium · 58 hard, plus a 365-day streak badge",
    href: "https://leetcode.com/u/Tzjc9aKApH/",
  },
  { title: "Hackathon finalist", detail: "PSG iTech / SAP HackFest 2025" },
  { title: "Shipped a desktop product", detail: "CSBROS Companion v0.1.0 for Windows and macOS" },
  { title: "Technical writer", detail: "13 deep-dives on rendering, LLD, DSA patterns and runtimes", href: "https://blogs-of-kamal.vercel.app" },
];

export const skills: SkillGroup[] = [
  { id: "languages", label: "Languages", skills: ["Java", "TypeScript", "JavaScript", "Python", "SQL"] },
  { id: "frontend", label: "Frontend", skills: ["React", "Next.js", "React Native / Expo", "Tailwind CSS", "Three.js", "Astro"] },
  {
    id: "backend",
    label: "Backend",
    skills: ["Node.js", "Express", "Spring Boot", "Spring Security", "FastAPI", "REST APIs", "Socket.io", "Zod"],
  },
  {
    id: "data",
    label: "Data",
    skills: ["PostgreSQL", "MySQL", "MongoDB", "Firestore", "Redis (Upstash)", "Drizzle ORM", "Mongoose"],
  },
  {
    id: "ai",
    label: "AI Engineering",
    skills: [
      "LLM APIs (OpenAI, Gemini)",
      "RAG",
      "Embeddings & chunking",
      "Vector search (ChromaDB, Atlas)",
      "LangChain",
      "Hugging Face Transformers",
      "Prompt engineering",
      "Agent evaluation",
    ],
  },
  {
    id: "cloud",
    label: "Cloud",
    skills: ["AWS EC2", "AWS S3", "AWS SES", "IAM", "Firebase Functions", "Cloud Scheduler", "Vercel", "Cloudflare Pages"],
  },
  {
    id: "devops",
    label: "DevOps",
    skills: ["Docker", "Kubernetes", "Jenkins", "GitHub Actions", "CI/CD", "Linux", "Git"],
  },
];
