// Dev-only: hero mode on a portrait phone and a tablet; screenshots of select and play.
import { chromium } from "@playwright/test";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
for (const [name, vp] of [["phone", { width: 390, height: 844 }], ["tablet", { width: 1024, height: 768 }]]) {
  const page = await (await browser.newContext({ viewport: vp, isMobile: name === "phone", hasTouch: true })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Hero mode/ }).click();
  await page.waitForFunction(() => performance.getEntriesByName("game:ready").length > 0, null, { timeout: 180000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${name}_select.png` });
  await page.getByRole("button", { name: /^Play as/ }).click();
  await page.waitForTimeout(3600);
  // Walk with the joystick for a moment.
  const stick = await page.locator("[role=presentation]").first().boundingBox();
  await page.mouse.move(stick.x + stick.width / 2, stick.y + stick.height / 2);
  await page.mouse.down();
  await page.mouse.move(stick.x + stick.width / 2, stick.y, { steps: 3 });
  await page.waitForTimeout(1200);
  await page.mouse.up();
  const z = await page.evaluate(() => window.__hero.rt.pos.z);
  await page.screenshot({ path: `${out}/${name}_play.png` });
  console.log(name, "moved to z =", z.toFixed(1), errors.length ? "ERRORS " + errors.join(" | ") : "ok");
}
await browser.close();
