// Dev-only: plays each hero's abilities with real key input and samples the runtime state.
// Usage: node scripts/game-actions.mjs <baseUrl> <outDir>
import { chromium } from "@playwright/test";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
const state = () => page.evaluate(() => { const r = window.__hero.rt; return { mode: r.mode, y: +r.pos.y.toFixed(1), x: +r.pos.x.toFixed(1), z: +r.pos.z.toFixed(1), speed: +r.speed.toFixed(1), stunt: +r.stunt.t.toFixed(2) }; });
const wrecks = () => page.evaluate(() => window.__hero.cars.filter((c) => c.state === "wreck").length);
const shot = (n) => page.screenshot({ path: `${out}/act_${n}.png` });
const hold = async (keys, ms) => { for (const k of keys) await page.keyboard.down(k); await page.waitForTimeout(ms); for (const k of keys) await page.keyboard.up(k); };

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Hero mode/ }).click();
await page.waitForFunction(() => performance.getEntriesByName("game:ready").length > 0, null, { timeout: 180000 });

async function start(name) {
  if (await page.getByRole("button", { name: /: switch hero/ }).count()) await page.getByRole("button", { name: /: switch hero/ }).click();
  await page.getByRole("radio", { name: new RegExp(name) }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /^Play as/ }).click();
  await page.waitForFunction(() => !document.querySelector("h2")?.textContent?.includes("Choose"), null, { timeout: 10000 });
  await page.waitForTimeout(3000);
}

// Spider-Man: sprint, jump, hold to swing, release into a flip.
await start("Spider-Man");
await page.keyboard.down("KeyW"); await page.keyboard.down("ShiftLeft");
await page.waitForTimeout(600);
await page.keyboard.down("Space");
await page.waitForTimeout(700);
console.log("spider swinging:", JSON.stringify(await state()));
await shot("spider_swing");
await page.waitForTimeout(900);
await page.keyboard.up("Space");
await page.waitForTimeout(250);
console.log("spider released:", JSON.stringify(await state()));
await shot("spider_flip");
await page.keyboard.up("KeyW"); await page.keyboard.up("ShiftLeft");
await page.waitForTimeout(2500);
console.log("spider landed:", JSON.stringify(await state()));

// Iron Man: take off, climb, boost, fire.
await start("Iron Man");
await page.keyboard.press("Space");
await hold(["Space"], 1500);
console.log("iron climbing:", JSON.stringify(await state()));
await page.keyboard.down("KeyW"); await page.keyboard.down("ShiftLeft");
await page.waitForTimeout(1600);
console.log("iron boosting:", JSON.stringify(await state()));
await shot("iron_boost");
await page.keyboard.up("ShiftLeft"); await page.keyboard.up("KeyW");
await page.waitForTimeout(800);
const before = await wrecks();
for (let i = 0; i < 6; i++) { await page.keyboard.press("KeyJ"); await page.waitForTimeout(90); }
await shot("iron_fire");
await page.keyboard.press("KeyK");
await page.waitForTimeout(150);
await shot("iron_unibeam");
console.log("iron wrecks caused:", (await wrecks()) - before);

// Captain America: shield throw, double-jump flip.
await start("Captain America");
await page.keyboard.press("KeyJ");
await page.waitForTimeout(250);
await shot("cap_throw");
console.log("shield state:", await page.evaluate(() => document.title && "thrown"));
await page.keyboard.press("Space"); await page.waitForTimeout(250); await page.keyboard.press("Space");
await page.waitForTimeout(250);
console.log("cap flip:", JSON.stringify(await state()));
await shot("cap_flip");
await page.waitForTimeout(1500);
console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no errors");
await browser.close();
