/**
 * Content model. Everything visible on the site — 3D world, DOM panels,
 * the no-WebGL pages, SEO and NOVA's answers — is derived from these types.
 */

export type DistrictId =
  | "arrival"
  | "nexus"
  | "citadel"
  | "innovation"
  | "ai-dome"
  | "creator-bay"
  | "product-city"
  | "knowledge-falls"
  | "launch-terminal";

export type Link = { label: string; href: string };

export type Profile = {
  name: string;
  shortName: string;
  title: string;
  roles: string[];
  tagline: string;
  summary: string;
  location: string;
  email: string;
  /** Shown only when `showPhone` is true. */
  phone: string;
  showPhone: boolean;
  availability: string;
  links: {
    github: string;
    linkedin: string;
    leetcode: string;
    blog: string;
    csbros: string;
  };
};

export type Experience = {
  id: string;
  role: string;
  org: string;
  kind: "full-time" | "freelance" | "trainee";
  start: string;
  end: string | null;
  location: string;
  highlights: string[];
  stack: string[];
  projectSlugs: string[];
};

export type Education = {
  degree: string;
  school: string;
  location: string;
  end: string;
  notes: string[];
};

export type Achievement = { title: string; detail: string; href?: string };

export type SkillGroup = { id: string; label: string; skills: string[] };

/** Concept visual archetypes rendered as SVG illustrations. */
export type VisualKind =
  | "mobile"
  | "dashboard"
  | "desktop-companion"
  | "pipeline"
  | "canvas"
  | "chat"
  | "terminal"
  | "helix"
  | "storefront";

export type ArchNode = { id: string; label: string; detail?: string; lane: number };
export type ArchEdge = { from: string; to: string; label?: string };

export type ProjectCategory = "full-stack" | "ai" | "devops" | "cloud" | "mobile" | "product";

export type ProjectOrigin = "personal" | "professional" | "client" | "hackathon" | "lab";

export type Project = {
  slug: string;
  title: string;
  codename?: string;
  tagline: string;
  district: DistrictId;
  featured: boolean;
  origin: ProjectOrigin;
  categories: ProjectCategory[];
  year: number;
  accent: string;
  visual: VisualKind;
  /** The ambition / concept framing. */
  vision: string;
  problem: string;
  solution: string;
  highlights: string[];
  architecture: { nodes: ArchNode[]; edges: ArchEdge[] };
  stack: string[];
  role: string[];
  /** Public live URL only when verified reachable. */
  live?: string;
};

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: string;
  version: string;
  released: string;
  price: string;
  platforms: { label: string; requires: string; size: string; href: string }[];
  features: string[];
  site: string;
  siteStatus: "live" | "unreachable";
  media: { src: string; alt: string; width: number; height: number }[];
  projectSlug: string;
};

export type Post = { slug: string; title: string; summary: string; topics: string[] };

export type Service = { id: string; title: string; summary: string; deliverables: string[]; stack: string[] };

export type Destination = {
  id: DistrictId;
  name: string;
  short: string;
  description: string;
  /** World-space position of the landmark (x, z); y is sampled from terrain. */
  position: [number, number];
  /** Where the camera settles when travelling here. */
  viewpoint: [number, number];
  /** Height on the landmark the camera aims at on arrival (default 4). */
  lookHeight?: number;
  route: string;
  accent: string;
  icon: string;
};
