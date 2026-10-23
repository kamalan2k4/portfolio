// Captures the arrival vista from the real 3D world as the home-page hero poster.
// Usage: node scripts/capture-hero.mjs <baseUrl>   (needs a production server running)
import { chromium } from "@playwright/test";
import sharp from "sharp";
const base = process.argv[2];
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
async function render(viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1.5 });
  await page.goto(base + "/?poster=1#explore");
  await page.waitForFunction(() => performance.getEntriesByName("world:ready").length > 0, null, { timeout: 120000 });
  await page.waitForTimeout(6000); // exhibit textures
  const png = await page.screenshot({ type: "png" });
  await page.close();
  return png;
}
const png = await render({ width: 1600, height: 900 });
const portrait = await render({ width: 720, height: 1280 });
await browser.close();
const dir = "public/media/hero";
await Promise.all(
  [
    ...[1080, 1600, 2400].map((w) => sharp(png).resize(w).webp({ quality: 60, effort: 6 }).toFile(`${dir}/world-${w}.webp`)),
    // Portrait renders for phones, so they don't download a 2400px-wide landscape.
    ...[720, 1080].map((w) => sharp(portrait).resize(w).webp({ quality: 58, effort: 6 }).toFile(`${dir}/world-portrait-${w}.webp`)),
    // Social-card base (the OG route composites text over it).
    sharp(png).resize(1200, 630, { fit: "cover", position: "centre" }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${dir}/og-base.jpg`),
  ],
);
console.log("hero poster written to", dir);
