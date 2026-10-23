import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { profile } from "@/content/profile";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const body = Inter({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], display: "swap", weight: ["500", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${profile.name} · Software Engineer`, template: `%s · ${profile.name}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: profile.name, url: SITE_URL }],
  creator: profile.name,
  keywords: ["Kamalan C S", "software engineer", "full-stack developer", "freelance developer", "RAG", "AI engineer", "Next.js", "Spring Boot", "Coimbatore"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${profile.name} · Software Engineer`,
    description: SITE_DESCRIPTION,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: `${profile.name} · Software Engineer`, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07110d",
  colorScheme: "dark",
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: SITE_URL,
  jobTitle: "Software Engineer",
  email: `mailto:${profile.email}`,
  address: { "@type": "PostalAddress", addressLocality: "Coimbatore", addressRegion: "Tamil Nadu", addressCountry: "IN" },
  sameAs: [profile.links.github, profile.links.linkedin, profile.links.leetcode, profile.links.blog],
  knowsAbout: ["Full-stack development", "Retrieval-augmented generation", "Cloud deployment", "DevOps", "React", "Spring Boot"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} antialiased`}>
      <body className="min-h-dvh">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </body>
    </html>
  );
}
