// Runs the guided tour start to finish and opens a project exhibit in-world.
// Usage: GPU=1 node scripts/world-tour.mjs <baseUrl> <outDir>
import { chromium } from "@playwright/test";
const [base, out] = process.argv.slice(2);
const gpu = process.env.GPU === "1";
const browser = await chromium.launch({ channel: gpu ? "chrome" : undefined, args: gpu ? ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
const title = () => page.locator("dialog[open] #district-title").textContent();
const waitPanel = () => page.waitForFunction(() => !!document.querySelector("dialog[open] #district-title"), null, { timeout: 30000 });

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Guided tour" }).click();
await page.waitForFunction(() => performance.getEntriesByName("world:ready").length > 0, null, { timeout: 120000 });
const seen = [];
for (let i = 0; i < 8; i++) {
  await waitPanel();
  seen.push(await title());
  const next = page.locator("dialog[open]").getByRole("button", { name: /Next stop|Finish tour/ });
  const label = await next.textContent();
  await next.click();
  if (/Finish/.test(label)) break;
  await page.waitForTimeout(200);
}
console.log("tour stops:", seen.join(" → "));
console.log("tour bar after finish:", await page.getByRole("region", { name: "Guided tour" }).count());

// Exhibit inside a district panel
await page.getByRole("button", { name: "Map" }).first().click();
await page.getByRole("button", { name: /^Travel to AI Research Dome/ }).click();
await waitPanel();
await page.locator("dialog[open]").getByRole("button", { name: /VINATHI/ }).click();
await page.waitForTimeout(300);
console.log("exhibit title:", await title(), "| has architecture:", await page.locator("dialog[open] figure svg").count() > 0);
await page.screenshot({ path: `${out}/tour_exhibit.png` });
await page.locator("dialog[open]").getByRole("button", { name: "← Back" }).click();
console.log("back to:", await title());
console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no errors");
await browser.close();
