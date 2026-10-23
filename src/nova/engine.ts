import { products, services } from "@/content/catalog";
import { destinationById } from "@/content/destinations";
import { achievements, education, experience, profile, skills } from "@/content/profile";
import { featuredProjects, projects } from "@/content/projects";
import type { DistrictId, Project } from "@/content/types";

export type NovaAction =
  | { type: "travel"; id: DistrictId }
  | { type: "project"; slug: string }
  | { type: "link"; href: string; label: string }
  | { type: "tour" }
  | { type: "map" };

export type NovaReply = { text: string; action?: NovaAction; suggestions: string[] };

export const STARTER_SUGGESTIONS = ["Explore projects", "Show me your skills", "View resume", "Explore AI work", "Freelance services", "Contact Kamalan"];

type Intent = { id: string; keywords: string[]; reply: () => NovaReply };

const list = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

const intents: Intent[] = [
  {
    id: "greet",
    keywords: ["hi", "hello", "hey", "yo", "namaste", "morning", "evening"],
    reply: () => ({
      text: `Hi! I'm NOVA. I can walk you to any part of ${profile.shortName}'s world, summarise his work, or open his resume. What would you like to see?`,
      suggestions: STARTER_SUGGESTIONS,
    }),
  },
  {
    id: "nova",
    keywords: ["nova", "robot", "who are you", "what are you"],
    reply: () => ({
      text: "I'm NOVA, the guide for this park. I don't speak out loud or use a microphone. I answer from Kamalan's portfolio data and fly you to the right place.",
      suggestions: ["Start the guided tour", "Open the map", "Explore projects"],
    }),
  },
  {
    id: "about",
    keywords: ["about", "who is", "summary", "introduce", "yourself", "background"],
    reply: () => ({ text: profile.summary, action: { type: "travel", id: "citadel" }, suggestions: ["Show me your skills", "Explore projects", "View resume"] }),
  },
  {
    id: "projects",
    keywords: ["project", "projects", "built", "build", "work", "portfolio", "showcase", "best", "exhibit", "made"],
    reply: () => ({
      text: `Headline projects: ${list(featuredProjects.map((p) => p.title))}. The full-stack exhibits are in the Innovation District. I'm flying you there now.`,
      action: { type: "travel", id: "innovation" },
      suggestions: featuredProjects.slice(0, 4).map((p) => `Tell me about ${p.title}`),
    }),
  },
  {
    id: "ai",
    keywords: ["ai", "ml", "rag", "llm", "llms", "gpt", "openai", "gemini", "vector", "embedding", "embeddings", "machine", "learning", "genai", "chatbot", "langchain", "model", "agent", "agents", "vision", "ocr"],
    reply: () => {
      const ai = projects.filter((p) => p.categories.includes("ai"));
      return {
        text: `AI work spans LLM-generated content, retrieval-augmented generation over vector databases, transformer OCR and AI-agent evaluation. Exhibits: ${list(ai.map((p) => p.title))}.`,
        action: { type: "travel", id: "ai-dome" },
        suggestions: ["Tell me about VINATHI", "Tell me about Technical Knowledge Assistant", "Show me your skills"],
      };
    },
  },
  {
    id: "skills",
    keywords: ["skill", "skills", "stack", "tech", "technologies", "tools", "languages", "framework", "frameworks", "know", "proficient"],
    reply: () => ({
      text: skills.map((g) => `${g.label}: ${g.skills.slice(0, 5).join(", ")}`).join(". ") + ".",
      action: { type: "travel", id: "citadel" },
      suggestions: ["Explore AI work", "Explore projects", "View resume"],
    }),
  },
  {
    id: "experience",
    keywords: ["experience", "job", "jobs", "career", "history", "role", "roles", "employment", "working", "currently", "trainee"],
    reply: () => ({
      text: experience.map((e) => `${e.role} (${e.org}), ${e.highlights[0]}`).join(" "),
      action: { type: "travel", id: "citadel" },
      suggestions: ["View resume", "Freelance services", "Show me your skills"],
    }),
  },
  {
    id: "resume",
    keywords: ["resume", "cv", "pdf", "download"],
    reply: () => ({ text: "Here's the resume. It's a one-page view you can save as a PDF.", action: { type: "link", href: "/resume", label: "Open resume" }, suggestions: ["Contact Kamalan", "Explore projects"] }),
  },
  {
    id: "freelance",
    keywords: ["freelance", "freelancer", "hire", "hiring", "services", "service", "client", "clients", "rate", "rates", "price", "pricing", "quote", "contract", "gig"],
    reply: () => ({
      text: `Kamalan takes on freelance work: ${list(services.map((s) => s.title.toLowerCase()))}. Client work includes VakeelSaab and the iBots operations console. Creator Bay has the enquiry form.`,
      action: { type: "travel", id: "creator-bay" },
      suggestions: ["Contact Kamalan", "Tell me about VakeelSaab", "Explore projects"],
    }),
  },
  {
    id: "contact",
    keywords: ["contact", "email", "mail", "reach", "talk", "connect", "linkedin", "message", "touch", "call"],
    reply: () => ({
      text: `You can email ${profile.email}, connect on LinkedIn, or use the form at the Launch Terminal.`,
      action: { type: "travel", id: "launch-terminal" },
      suggestions: ["View resume", "Freelance services"],
    }),
  },
  {
    id: "products",
    keywords: ["csbros", "product", "products", "companion", "desktop", "app", "download", "hydration", "water"],
    reply: () => {
      const p = products[0];
      return {
        text: `CSBROS is Kamalan's product studio. Its first release is ${p.name} v${p.version}: ${p.tagline} It's free for Windows and macOS.`,
        action: { type: "travel", id: "product-city" },
        suggestions: ["Tell me about CSBROS Companion", "Explore projects"],
      };
    },
  },
  {
    id: "blog",
    keywords: ["blog", "blogs", "write", "writing", "article", "articles", "post", "posts", "read"],
    reply: () => ({
      text: "Kamalan writes about rendering, SOLID and low-level design, DSA patterns, React and JavaScript runtimes. Knowledge Falls links to every post.",
      action: { type: "travel", id: "knowledge-falls" },
      suggestions: ["Explore projects", "Contact Kamalan"],
    }),
  },
  {
    id: "education",
    keywords: ["education", "college", "degree", "university", "study", "studying", "mtech", "m.tech", "school", "hackathon", "hackfest"],
    reply: () => ({
      text: `${education[0].degree} at ${education[0].school} (${education[0].end}). ${education[0].notes.join(". ")}.`,
      action: { type: "travel", id: "citadel" },
      suggestions: ["Show me your skills", "DSA and LeetCode"],
    }),
  },
  {
    id: "dsa",
    keywords: ["leetcode", "dsa", "algorithm", "algorithms", "problem", "solving", "competitive", "data structures"],
    reply: () => ({
      text: `${achievements[0].title}: ${achievements[0].detail}. Most solutions are in Java.`,
      action: { type: "link", href: profile.links.leetcode, label: "Open LeetCode profile" },
      suggestions: ["Show me your skills", "Explore projects"],
    }),
  },
  {
    id: "tour",
    keywords: ["tour", "guide", "guided", "around", "walkthrough", "everything"],
    reply: () => ({ text: "Starting the guided tour. You can pause, skip or stop it at any time from the bar at the bottom.", action: { type: "tour" }, suggestions: [] }),
  },
  {
    id: "map",
    keywords: ["map", "where", "navigate", "directions", "lost", "places", "destinations"],
    reply: () => ({ text: "Here's the map. Pick any destination and I'll fly you there.", action: { type: "map" }, suggestions: [] }),
  },
];

/** Suggestion chips map 1:1 to canonical phrasings. */
const CHIP_ALIASES: Record<string, string> = {
  "explore projects": "projects",
  "show me your skills": "skills",
  "view resume": "resume",
  "explore ai work": "ai",
  "freelance services": "freelance",
  "contact kamalan": "contact",
  "start the guided tour": "tour",
  "open the map": "map",
  "dsa and leetcode": "dsa",
};

export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.+#\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function projectMatch(q: string): Project | undefined {
  return projects.find((p) => {
    const names = [p.title, p.slug.replace(/-/g, " "), p.codename ?? ""].map(normalize).filter((n) => n.length > 3);
    return names.some((n) => q.includes(n)) || (p.title.length > 3 && q.split(" ").includes(normalize(p.title)));
  });
}

const allTech = Array.from(new Set([...skills.flatMap((g) => g.skills), ...projects.flatMap((p) => p.stack)]));

function techMatch(q: string) {
  const padded = ` ${q} `;
  return allTech
    .map((t) => ({ t, n: normalize(t.replace(/\(.*\)/, "")) }))
    .filter(({ n }) => n.length >= 2 && padded.includes(` ${n} `))
    .sort((a, b) => b.n.length - a.n.length)[0]?.t;
}

function describeProject(p: Project): NovaReply {
  return {
    text: `${p.title}: ${p.tagline} Built with ${p.stack.slice(0, 5).join(", ")}.`,
    action: { type: "project", slug: p.slug },
    suggestions: ["Explore projects", "Explore AI work", "Contact Kamalan"],
  };
}

function usedIn(tech: string) {
  const n = normalize(tech);
  return projects.filter((p) => p.stack.some((s) => normalize(s).includes(n) || n.includes(normalize(s))));
}

function describeTech(tech: string): NovaReply {
  const used = usedIn(tech);
  const group = skills.find((g) => g.skills.includes(tech));
  const where = used.length ? ` Used in ${list(used.slice(0, 4).map((p) => p.title))}.` : "";
  return {
    text: `Yes, ${tech} is part of Kamalan's toolkit${group ? ` (${group.label.toLowerCase()})` : ""}.${where}`,
    action: used[0] ? { type: "project", slug: used[0].slug } : { type: "travel", id: "citadel" },
    suggestions: used.slice(1, 3).map((p) => `Tell me about ${p.title}`).concat("Show me your skills"),
  };
}

export function respond(raw: string): NovaReply {
  const q = normalize(raw);
  if (!q) return { text: "Ask me anything about Kamalan's work, or pick a suggestion.", suggestions: STARTER_SUGGESTIONS };

  const alias = CHIP_ALIASES[q];
  if (alias) return intents.find((i) => i.id === alias)!.reply();

  const project = projectMatch(q);
  if (project) return describeProject(project);

  const words = new Set(q.split(" "));
  let best: { intent: Intent; score: number } | null = null;
  for (const intent of intents) {
    let score = 0;
    for (const k of intent.keywords) {
      if (k.includes(" ") ? q.includes(k) : words.has(k)) score += k.includes(" ") ? 2 : 1;
    }
    if (score > (best?.score ?? 0)) best = { intent, score };
  }

  const tech = techMatch(q);
  // A concrete technology used in real projects beats a generic keyword hit.
  const generic = !best || ["skills", "ai", "about", "projects", "experience"].includes(best.intent.id);
  if (tech && generic && (!best || usedIn(tech).length > 0)) return describeTech(tech);
  if (best) return best.intent.reply();

  return {
    text: "I'm not sure about that one. I only answer from Kamalan's portfolio. Try one of these, or open the map to jump anywhere.",
    suggestions: STARTER_SUGGESTIONS,
  };
}

export const destinationName = (id: DistrictId) => destinationById(id).name;
