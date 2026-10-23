import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const alt = `${profile.name}, ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // A real render of the 3D world (scripts/capture-hero.mjs).
  const base = await readFile(join(process.cwd(), "public/media/hero/og-base.jpg"));
  const src = `data:image/jpeg;base64,${base.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "sans-serif", color: "#ece6d6" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630 }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 64,
            background: "linear-gradient(0deg, rgba(7,17,13,0.95) 0%, rgba(7,17,13,0.55) 45%, rgba(7,17,13,0.05) 100%)",
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: 6, color: "#7dd3c0", textTransform: "uppercase" }}>Explorable 3D portfolio</div>
          <div style={{ fontSize: 92, fontWeight: 800, marginTop: 12, letterSpacing: -2 }}>{profile.name}</div>
          <div style={{ fontSize: 36, marginTop: 8, color: "#d9d2c0" }}>{profile.title}</div>
        </div>
      </div>
    ),
    size,
  );
}
