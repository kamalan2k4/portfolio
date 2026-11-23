// Dev-only: fast travel, district panel, NOVA travel, and driving in hero mode.
import { chromium } from "@playwright/test";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const rt = () => page.evaluate(() => { const r = window.__hero.rt; return { mode: r.mode, x: +r.pos.x.toFixed(1), z: +r.pos.z.toFixed(1), speed: +r.speed.toFixed(1) }; });
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Hero mode/ }).click();
await page.waitForFunction(() => performance.getEntriesByName("game:ready").length > 0, null, { timeout: 180000 });
await page.getByRole("button", { name: /^Play as/ }).click();
await page.waitForTimeout(3300);
// Fast travel by map.
await page.keyboard.press("KeyM");
await page.getByRole("button", { name: /^Travel to AI Research Dome/ }).click();
await page.waitForTimeout(800);
console.log("after map travel:", JSON.stringify(await rt()), "| nearby:", await page.locator("[aria-live=polite]").first().textContent());
await page.keyboard.press("KeyE");
await page.waitForTimeout(500);
console.log("panel:", await page.locator("dialog[open] #district-title").textContent());
await page.screenshot({ path: `${out}/drive_panel.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
// NOVA travel.
await page.keyboard.press("KeyN");
await page.getByLabel("Ask NOVA a question").fill("how do I contact him?");
await page.keyboard.press("Enter");
await page.waitForTimeout(700);
await page.locator("dialog[open]").getByRole("button", { name: "Take me there" }).click();
await page.waitForTimeout(900);
console.log("after NOVA travel:", JSON.stringify(await rt()), "| panel:", await page.locator("dialog[open] #district-title").textContent().catch(() => "none"));
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
// Drive.
await page.keyboard.press("KeyF");
await page.waitForTimeout(300);
console.log("entered car:", JSON.stringify(await rt()));
await page.keyboard.down("KeyW");
await page.waitForTimeout(2200);
console.log("driving:", JSON.stringify(await rt()));
await page.screenshot({ path: `${out}/drive_go.png` });
await page.keyboard.up("KeyW");
await page.keyboard.press("KeyF");
await page.waitForTimeout(300);
console.log("left car:", JSON.stringify(await rt()));
console.log(errors.length ? "ERRORS: " + errors.join(" | ") : "no errors");
await browser.close();
