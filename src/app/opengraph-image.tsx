import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const alt = `${profile.name}, ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background: "radial-gradient(circle at 75% 15%, #2f5d46 0%, #0c1a15 45%, #07110d 100%)",
          color: "#ece6d6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 6, color: "#7dd3c0", textTransform: "uppercase" }}>Portfolio · Explore in 3D</div>
        <div style={{ fontSize: 96, fontWeight: 800, marginTop: 16, letterSpacing: -2 }}>{profile.name}</div>
        <div style={{ fontSize: 38, marginTop: 12, color: "#b9b3a3" }}>{profile.title}</div>
        <div style={{ display: "flex", gap: 14, marginTop: 40 }}>
          {["Full-stack", "AI / RAG", "Cloud & DevOps", "Freelance"].map((t) => (
            <div key={t} style={{ fontSize: 24, padding: "10px 22px", borderRadius: 999, border: "2px solid rgba(236,230,214,0.25)" }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
