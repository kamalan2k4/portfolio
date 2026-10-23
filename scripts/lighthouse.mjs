// Lighthouse (mobile + desktop) for every page of a running production server.
// Usage: node scripts/lighthouse.mjs <baseUrl> <outDir>
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const [base, out] = process.argv.slice(2);
const pages = ["/", "/recruiter", "/projects", "/projects/vinathi", "/products", "/services", "/writing", "/contact", "/resume"];
const rows = [];
for (const preset of ["mobile", "desktop"]) {
  for (const p of pages) {
    const file = `${out}/lh-${preset}-${p.replace(/\W+/g, "_") || "home"}.json`;
    const args = ["--yes", "lighthouse@13.5.0", base + p, "--quiet", "--chrome-flags=--headless=new", "--output=json", `--output-path=${file}`];
    if (preset === "desktop") args.push("--preset=desktop");
    execFileSync("npx", args, { stdio: "ignore", shell: true });
    const { categories: c, audits: a } = JSON.parse(readFileSync(file, "utf8"));
    const s = (k) => Math.round(c[k].score * 100);
    rows.push([preset, p, s("performance"), s("accessibility"), s("best-practices"), s("seo"), a["largest-contentful-paint"].displayValue, a["total-blocking-time"].displayValue, a["cumulative-layout-shift"].displayValue]);
  }
}
console.log("preset  page               perf a11y bp  seo  LCP     TBT     CLS");
for (const r of rows) console.log(`${r[0].padEnd(8)}${r[1].padEnd(19)}${String(r[2]).padEnd(5)}${String(r[3]).padEnd(5)}${String(r[4]).padEnd(4)}${String(r[5]).padEnd(5)}${r[6].padEnd(8)}${r[7].padEnd(8)}${r[8]}`);
