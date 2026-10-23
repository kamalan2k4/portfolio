// Crawls rendered pages, collects every href and verifies it resolves.
// Usage: node scripts/check-links.mjs <baseUrl>
const base = process.argv[2];
const pages = ["/", "/recruiter", "/projects", "/products", "/services", "/writing", "/contact", "/resume"];
const html = await Promise.all(pages.map(async (p) => [p, await (await fetch(base + p)).text()]));
for (const [, h] of html) for (const m of h.matchAll(/href="(\/projects\/[^"#]+)"/g)) if (!pages.includes(m[1])) pages.push(m[1]);
const links = new Map();
for (const p of pages) {
  const h = p.startsWith("/projects/") ? await (await fetch(base + p)).text() : html.find(([q]) => q === p)[1];
  for (const m of h.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, "&");
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.includes("/_next/")) continue;
    if (!links.has(href)) links.set(href, new Set());
    links.get(href).add(p);
  }
}
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141 Safari/537.36", accept: "text/html,*/*" };
const results = await Promise.all(
  [...links.keys()].map(async (href) => {
    const url = href.startsWith("/") ? base + href : href;
    try {
      const big = /\.(exe|dmg)$/.test(url);
      const res = await fetch(url, { method: big ? "HEAD" : "GET", redirect: "follow", headers: UA, signal: AbortSignal.timeout(20000) });
      return [href, res.status];
    } catch (e) {
      return [href, "ERR " + (e.cause?.code ?? e.name)];
    }
  }),
);
let bad = 0;
for (const [href, status] of results.sort()) {
  // LinkedIn (999) and LeetCode (403, Cloudflare) block automated requests; both profiles were verified manually.
  const ok = status === 200 || (status === 999 && href.includes("linkedin.com")) || (status === 403 && href.includes("leetcode.com"));
  if (!ok) bad++;
  console.log(`${ok ? "ok " : "BAD"} ${status}  ${href}${ok ? "" : "  (on " + [...links.get(href)].join(", ") + ")"}`);
}
console.log(`\n${results.length} unique links, ${bad} broken. (Bot-blocked LinkedIn/LeetCode treated as ok; canonical <link> tags excluded until deploy.)`);
