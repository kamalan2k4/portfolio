// Flies to every destination via the map and screenshots the view on arrival.
// Usage: GPU=1 node scripts/world-districts.mjs <baseUrl> <outDir>
import { chromium } from "@playwright/test";
const [base, out] = process.argv.slice(2);
const gpu = process.env.GPU === "1";
const browser = await chromium.launch({ channel: gpu ? "chrome" : undefined, args: gpu ? ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Explore the world" }).click();
await page.waitForFunction(() => performance.getEntriesByName("world:ready").length > 0, null, { timeout: 120000 });
const names = ["The Nexus", "Career Citadel", "AI Research Dome", "Innovation District", "Product City", "Creator Bay", "Knowledge Falls", "Launch Terminal"];
for (const n of names) {
  await page.getByRole("button", { name: "Map" }).first().click();
  await page.getByRole("button", { name: new RegExp(`^Travel to ${n}`) }).click();
  await page.waitForFunction(() => !!document.querySelector("dialog[open] #district-title"), null, { timeout: 30000 });
  await page.getByRole("button", { name: "Close" }).first().click();
  await page.waitForTimeout(1200); // let exhibit textures load
  const file = `${out}/d_${n.replace(/\W+/g, "_")}.png`;
  await page.screenshot({ path: file });
  const here = await page.locator("[aria-live=polite]").first().textContent();
  console.log(n, "-> HUD says:", here);
}
const stats = await page.evaluate(() => ({ ready: performance.getEntriesByName("world:ready")[0].detail, steady: performance.getEntriesByName("world:steady")[0]?.detail }));
console.log("stats:", JSON.stringify(stats));
console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no errors");
await browser.close();
