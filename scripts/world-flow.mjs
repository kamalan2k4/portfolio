// Drives the 3D world end to end and captures screenshots.
// Usage: node scripts/world-flow.mjs <baseUrl> <outDir> [mobile]
import { chromium } from "@playwright/test";
const [base, out, mobileArg] = process.argv.slice(2);
const mobile = mobileArg === "mobile";
const gpu = process.env.GPU === "1";
const browser = await chromium.launch({
  channel: gpu ? "chrome" : undefined,
  args: gpu ? ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errors.push(m.type() + ": " + m.text().slice(0, 200)));
const shot = async (n) => { await page.screenshot({ path: `${out}/world_${n}${mobile ? "_m" : ""}.png` }); console.log("shot", n); };

await page.goto(base + "/", { waitUntil: "networkidle" });
const t0 = Date.now();
await page.getByRole("button", { name: "Explore the world" }).click();
await page.waitForFunction(() => performance.getEntriesByName("world:ready").length > 0, null, { timeout: 180000 });
console.log("world ready in", Date.now() - t0, "ms (wall)");
console.log("timing + stats:", JSON.stringify(await page.evaluate(() => {
  const m = (n) => performance.getEntriesByName(n)[0];
  const req = m("world:request"), mount = m("world:mount"), ready = m("world:ready");
  const gl = document.createElement("canvas").getContext("webgl2"); const i = gl?.getExtension("WEBGL_debug_renderer_info");
  const cs = m("world:compile-start"), cd = m("world:compiled");
  return { requestToMount: Math.round(mount.startTime - req.startTime), mountToCompileStart: Math.round(cs.startTime - mount.startTime), compile: Math.round(cd.startTime - cs.startTime), compiledToReady: Math.round(ready.startTime - cd.startTime), mountToReady: Math.round(ready.startTime - mount.startTime), stats: ready.detail, gpu: i ? gl.getParameter(i.UNMASKED_RENDERER_WEBGL) : "?" };
})));
await page.waitForTimeout(3500); // intro descent
await shot("1_arrival");

const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const s = performance.now(); const f = () => { n++; if (performance.now() - s < 2000) requestAnimationFrame(f); else res(n / 2); }; requestAnimationFrame(f); }));
console.log("fps (software GL):", fps);

if (!mobile) {
  await page.keyboard.down("KeyW"); await page.waitForTimeout(2200); await page.keyboard.up("KeyW");
  await page.waitForTimeout(400);
  await shot("2_walk");
}
await page.getByRole("button", { name: "Map" }).first().click();
await page.waitForTimeout(500);
await shot("3_map");
await page.getByRole("button", { name: /Travel to Career Citadel/ }).click();
await page.waitForFunction(() => !!document.querySelector("dialog[open] #district-title"), null, { timeout: 60000 });
await page.waitForTimeout(400);
await shot("4_citadel_panel");
await page.getByRole("button", { name: "Close" }).first().click();
await page.waitForTimeout(600);
await shot("5_citadel_view");
await page.getByRole("button", { name: /Ask NOVA/ }).first().click();
await page.waitForTimeout(300);
await page.getByLabel("Ask NOVA a question").fill("do you know docker?");
await page.keyboard.press("Enter");
await page.waitForTimeout(800);
await shot("6_nova");
await page.getByRole("button", { name: "Close" }).first().click();
await page.getByRole("button", { name: /Exit/ }).click();
await page.waitForTimeout(500);
console.log("after exit url:", page.url(), "canvas count:", await page.locator("canvas").count());
console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no console errors");
await browser.close();
