// Dev-only: copies the rigged hero models from the private csbros-companion repo into
// public/dev-assets/heroes/ (git-ignored). Requires an authenticated GitHub CLI (`gh auth status`).
// Usage: node scripts/fetch-hero-models.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const REPO = "kamalan2k4/csbros-companion";
const MODELS = {
  "ironman.glb": "resources/characters/csbros.ironman/models/ironman.glb",
  "spiderman.glb": "resources/characters/csbros.spiderman/models/spiderman.glb",
};
const out = "public/dev-assets/heroes";
mkdirSync(out, { recursive: true });
const tree = JSON.parse(execFileSync("gh", ["api", `repos/${REPO}/git/trees/HEAD?recursive=1`], { maxBuffer: 64 << 20 }).toString()).tree;
for (const [file, path] of Object.entries(MODELS)) {
  const sha = tree.find((t) => t.path === path)?.sha;
  if (!sha) throw new Error(`missing ${path}`);
  const data = execFileSync("gh", ["api", `repos/${REPO}/git/blobs/${sha}`, "-H", "Accept: application/vnd.github.raw"], { maxBuffer: 256 << 20 });
  writeFileSync(`${out}/${file}`, data);
  console.log(`${file}: ${(data.length / 1048576).toFixed(1)} MB`);
}
// Meshopt geometry compression (three.js decodes it): Iron Man 11 MB -> ~3.6 MB.
execFileSync("npx", ["--yes", "@gltf-transform/cli@4.5.1", "meshopt", `${out}/ironman.glb`, `${out}/ironman.glb`, "--level", "medium"], { stdio: "inherit", shell: true });
