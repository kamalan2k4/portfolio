// Dev-only: plays hero mode end to end and captures screenshots.
// Usage: node scripts/game-flow.mjs <baseUrl> <outDir> [mobile]
import { chromium } from "@playwright/test";
const [base, out, mobileArg] = process.argv.slice(2);
const mobile = mobileArg === "mobile";
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await browser.newContext(mobile ? { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 240)));
const shot = async (n) => {
  await page.screenshot({ path: `${out}/game_${n}${mobile ? "_m" : ""}.png` });
  console.log("shot", n);
};
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Hero mode/ }).click();
await page.waitForFunction(() => performance.getEntriesByName("game:ready").length > 0, null, { timeout: 180000 });
console.log("ready:", JSON.stringify(await page.evaluate(() => performance.getEntriesByName("game:ready")[0].detail)));
for (const name of ["Spider-Man", "Iron Man", "Captain America"]) {
  await page.getByRole("radio", { name: new RegExp(name) }).click();
  await page.waitForTimeout(2500);
  await shot("select_" + name.replace(/\W+/g, ""));
}
const hero = process.env.HERO ?? "Spider-Man";
await page.getByRole("radio", { name: new RegExp(hero) }).click();
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /^Play as/ }).click();
await page.waitForTimeout(1200);
await shot("intro");
await page.waitForTimeout(2000);
await shot("play");
console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no errors");
await browser.close();
