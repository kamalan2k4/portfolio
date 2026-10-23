// Usage: node scripts/shots.mjs <baseUrl> <outDir> <path>[@mobile] ...
import { chromium } from "@playwright/test";
const [base, out, ...paths] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const spec of paths) {
  const [path, mode] = spec.split("@");
  const mobile = mode === "mobile";
  const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(Number(process.env.WAIT ?? 300));
  const name = (path.replace(/[^\w]+/g, "_") || "home") + (mobile ? "_m" : "") + ".png";
  await page.screenshot({ path: `${out}/${name}`, fullPage: process.env.FULL === "1" });
  console.log(name, errors.length ? "ERRORS: " + errors.join(" | ") : "ok");
  await page.close();
}
await browser.close();
