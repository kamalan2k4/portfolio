// axe-core audit of every page and the in-world dialogs (WCAG 2.2 A/AA).
// Usage: node scripts/a11y.mjs <baseUrl>
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
const base = process.argv[2];
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
let total = 0;
async function audit(label, include) {
  let b = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]);
  if (include) b = b.include(include);
  const { violations } = await b.analyze();
  total += violations.length;
  console.log(`${violations.length ? "✗" : "✓"} ${label}${violations.length ? "" : " — no violations"}`);
  for (const v of violations) console.log(`    [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0].target.join(" ")}`);
}
for (const path of ["/", "/recruiter", "/projects", "/projects/vinathi", "/projects/csbros-companion", "/products", "/services", "/writing", "/contact", "/resume", "/does-not-exist"]) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  await audit(path);
}
await page.goto(base + "/");
await page.getByRole("button", { name: "Explore the world" }).click();
await page.waitForFunction(() => performance.getEntriesByName("world:ready").length > 0, null, { timeout: 120000 });
await page.waitForTimeout(2500);
await audit("world HUD");
for (const [label, open] of [
  ["world: map", () => page.keyboard.press("KeyM")],
  ["world: NOVA", () => page.keyboard.press("KeyN")],
  ["world: help", () => page.getByRole("button", { name: "Controls help" }).click()],
]) {
  await open();
  await page.waitForTimeout(300);
  await audit(label, "dialog[open]");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
}
await page.keyboard.press("KeyM");
await page.getByRole("button", { name: /^Travel to Career Citadel/ }).click();
await page.waitForFunction(() => !!document.querySelector("dialog[open] #district-title"), null, { timeout: 30000 });
await audit("world: citadel panel", "dialog[open]");
await page.keyboard.press("Escape");
await page.keyboard.press("KeyM");
await page.getByRole("button", { name: /^Travel to AI Research Dome/ }).click();
await page.waitForFunction(() => !!document.querySelector("dialog[open] #district-title"), null, { timeout: 30000 });
await page.locator("dialog[open]").getByRole("button", { name: /VINATHI/ }).click();
await audit("world: project exhibit", "dialog[open]");
console.log(`\nTotal violation types: ${total}`);
await browser.close();
