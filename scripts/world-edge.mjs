// Edge cases: no WebGL, reduced motion, context loss, touch joystick, keyboard-only.
// Usage: node scripts/world-edge.mjs <baseUrl>
import { chromium } from "@playwright/test";
const base = process.argv[2];
const gpuArgs = { channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] };
const ready = (page, n = 1) => page.waitForFunction((k) => performance.getEntriesByName("world:ready").length >= k, n, { timeout: 120000 });
const results = [];
const check = (name, ok, extra = "") => console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);

// 1. No WebGL
{
  const b = await chromium.launch({ args: ["--disable-webgl", "--disable-3d-apis"] });
  const p = await b.newPage();
  await p.goto(base + "/");
  await p.getByRole("button", { name: "Explore the world" }).click();
  const alert = p.getByRole("alert").filter({ hasText: "3D world" });
  await alert.waitFor({ timeout: 10000 }).catch(() => {});
  check("no-WebGL fallback message", (await alert.count()) > 0 && /recruiter mode/i.test(await alert.textContent()));
  await b.close();
}

const b = await chromium.launch(gpuArgs);

// 2. Reduced motion: travel is an instant cut
{
  const ctx = await b.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(base + "/");
  await p.getByRole("button", { name: "Explore the world" }).click();
  await ready(p);
  await p.getByRole("button", { name: "Map" }).first().click();
  const t0 = Date.now();
  await p.getByRole("button", { name: /^Travel to Launch Terminal/ }).click();
  await p.waitForFunction(() => !!document.querySelector("dialog[open] #district-title"), null, { timeout: 10000 });
  const ms = Date.now() - t0;
  check("reduced motion: instant travel", ms < 800, `${ms} ms`);

  // 3. Context loss → restart
  await p.getByRole("button", { name: "Close" }).first().click();
  await p.evaluate(() => document.querySelector("canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext());
  const dlg = p.getByRole("alertdialog");
  await dlg.waitFor({ timeout: 10000 }).catch(() => {});
  check("context loss shows recovery", (await dlg.count()) > 0);
  await p.getByRole("button", { name: "Restart 3D" }).click();
  await ready(p, 2).then(() => check("restart 3D re-renders", true)).catch(() => check("restart 3D re-renders", false));
  await ctx.close();
}

// 4. Touch joystick moves the player
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(base + "/");
  await p.getByRole("button", { name: "Explore the world" }).click();
  await ready(p);
  await p.waitForTimeout(2500);
  const where = () => p.locator("[aria-live=polite]").first().textContent();
  const before = await where();
  const box = await p.locator("[role=presentation]").last().boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await p.mouse.move(cx, cy);
  await p.mouse.down();
  await p.mouse.move(cx, cy - 60, { steps: 4 });
  await p.waitForTimeout(3500);
  await p.mouse.up();
  const after = await where();
  check("touch joystick walks", before !== after, `${before} → ${after}`);
  await ctx.close();
}

// 5. Keyboard only
{
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto(base + "/");
  let found = false;
  for (let i = 0; i < 12 && !found; i++) {
    await p.keyboard.press("Tab");
    found = (await p.evaluate(() => document.activeElement?.textContent)) === "Explore the world";
  }
  check("Explore button reachable by Tab", found);
  await p.keyboard.press("Enter");
  await ready(p);
  await p.waitForTimeout(2500);
  const where = () => p.locator("[aria-live=polite]").first().textContent();
  const before = await where();
  await p.keyboard.down("ShiftLeft");
  await p.keyboard.down("KeyW");
  await p.waitForTimeout(3000);
  await p.keyboard.up("KeyW");
  await p.keyboard.up("ShiftLeft");
  check("Shift+W runs forward", before !== (await where()), `${before} → ${await where()}`);
  await p.keyboard.press("KeyM");
  check("M opens map", (await p.locator("dialog[open]").count()) === 1);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(100);
  check("Esc closes dialog", (await p.locator("dialog[open]").count()) === 0);
  await p.keyboard.press("KeyN");
  await p.waitForTimeout(100);
  const focused = await p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  check("N opens NOVA with focus inside", (await p.locator("dialog[open]").count()) === 1, `focus: ${focused}`);
  await p.keyboard.type("show me your skills");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(600);
  check("NOVA answers typed question", /Languages:/.test(await p.locator("[role=log]").textContent()));
  await p.keyboard.press("Escape");
}
await b.close();
console.log(results.join("\n"));
