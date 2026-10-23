// Measures gzip sizes of JS/CSS referenced by a route's initial HTML, plus the largest chunks.
// Usage: node scripts/measure-bundle.mjs [route...]   (reads .next build output)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const gz = (p) => gzipSync(readFileSync(p), { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(1) + " KB";
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ["index"];
for (const r of routes) {
  const html = readFileSync(join(".next/server/app", `${r}.html`), "utf8");
  const assets = [...new Set([...html.matchAll(/\/_next\/(static\/[^"'\s)]+\.(?:js|css))/g)].map((m) => m[1]))];
  let js = 0, css = 0;
  for (const a of assets) {
    const size = gz(join(".next", a));
    if (a.endsWith(".js")) js += size; else css += size;
  }
  console.log(`/${r === "index" ? "" : r}: initial JS ${kb(js)} gz (${assets.filter((a) => a.endsWith(".js")).length} files), CSS ${kb(css)} gz, HTML ${kb(gzipSync(html).length)} gz`);
}
const dir = ".next/static/chunks";
const all = readdirSync(dir).filter((f) => f.endsWith(".js")).map((f) => ({ f, raw: statSync(join(dir, f)).size, gz: gz(join(dir, f)) })).sort((a, b) => b.gz - a.gz).slice(0, 5);
console.log("Largest chunks:", all.map((c) => `${c.f} ${kb(c.raw)} raw / ${kb(c.gz)} gz`).join("\n  "));
