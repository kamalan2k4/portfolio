/**
 * Deterministic world geometry shared by rendering, ground-following and collision.
 * Pure math, no three.js imports, so it is unit-testable and cheap to call per frame.
 */
import { destinations } from "@/content/destinations";

export type Vec2 = [number, number];

// ---------- noise ----------
function hash(x: number, z: number) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const smooth = (t: number) => t * t * (3 - 2 * t);
export function valueNoise(x: number, z: number) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = smooth(x - xi);
  const zf = smooth(z - zi);
  const a = hash(xi, zi);
  const b = hash(xi + 1, zi);
  const c = hash(xi, zi + 1);
  const d = hash(xi + 1, zi + 1);
  return a + (b - a) * xf + (c - a) * zf + (a - b - c + d) * xf * zf;
}
export function fbm(x: number, z: number, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * f, z * f);
    f *= 2.03;
    amp *= 0.5;
  }
  return sum;
}
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------- segments ----------
/** Distance from p to segment ab, plus the projection parameter t in [0,1]. */
export function segDistance(px: number, pz: number, a: Vec2, b: Vec2) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len2 = dx * dx + dz * dz || 1;
  const t = Math.min(1, Math.max(0, ((px - a[0]) * dx + (pz - a[1]) * dz) / len2));
  const cx = a[0] + dx * t;
  const cz = a[1] + dz * t;
  return { d: Math.hypot(px - cx, pz - cz), t };
}
function polyDistance(px: number, pz: number, pts: Vec2[]) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) best = Math.min(best, segDistance(px, pz, pts[i], pts[i + 1]).d);
  return best;
}
function segIntersect(a: Vec2, b: Vec2, c: Vec2, d: Vec2): Vec2 | null {
  const r = [b[0] - a[0], b[1] - a[1]];
  const s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + r[0] * t, a[1] + r[1] * t] : null;
}

// ---------- layout ----------
export const WORLD_RADIUS = 66;
export const PLAZA_RADIUS = 11;
export const PATH_HALF_WIDTH = 2.2;
export const RIVER_HALF_WIDTH = 3.2;
export const WATER_LEVEL = -0.55;

/** River centreline: from the Knowledge Falls pool, south of the Nexus, out to the east. */
export const river: Vec2[] = [
  [-56, -14],
  [-46, -6],
  [-36, 8],
  [-20, 20],
  [0, 26],
  [20, 22],
  [40, 16],
  [58, 22],
  [90, 30],
];

/** Walkways: every district connects to the Nexus; the arrival gate connects too. */
export const paths: { from: string; to: string; a: Vec2; b: Vec2 }[] = destinations
  .filter((d) => d.id !== "nexus")
  .map((d) => ({ from: "nexus", to: d.id, a: [0, 0] as Vec2, b: d.position }));

/** Plateau radius per district, so landmarks sit on level ground. */
export const PLATEAU_RADIUS = 9;

/** Bridges where walkways cross the river. */
export const bridges = paths.flatMap((p) => {
  for (let i = 0; i < river.length - 1; i++) {
    const hit = segIntersect(p.a, p.b, river[i], river[i + 1]);
    if (hit) {
      const angle = Math.atan2(p.b[0] - p.a[0], p.b[1] - p.a[1]);
      return [{ center: hit, angle, halfLength: RIVER_HALF_WIDTH + 3.2, halfWidth: PATH_HALF_WIDTH + 0.4, deck: 0.55 }];
    }
  }
  return [];
});

function rawTerrain(x: number, z: number) {
  const r = Math.hypot(x, z);
  let h = (fbm(x * 0.035 + 7, z * 0.035 - 3) - 0.5) * 6;

  // Mountains ring the park.
  const ring = smoothstep(WORLD_RADIUS + 6, WORLD_RADIUS + 70, r);
  h += ring * (22 + fbm(x * 0.03, z * 0.03, 5) * 46);

  // Cliff behind Knowledge Falls.
  const cliff = smoothstep(14, 4, Math.hypot((x + 64) * 0.6, z + 14)) * smoothstep(-48, -60, x);
  h = Math.max(h, cliff * 15);
  return h;
}

/** Ground height of the walkable world (excluding bridge decks). */
export function terrainHeight(x: number, z: number) {
  let h = rawTerrain(x, z);
  const r = Math.hypot(x, z);

  // Level plateaus for the Nexus and each district.
  const plazaBlend = smoothstep(PLAZA_RADIUS + 6, PLAZA_RADIUS, r);
  h = lerp(h, 0.35, plazaBlend);
  for (const d of destinations) {
    if (d.id === "nexus") continue;
    const k = smoothstep(PLATEAU_RADIUS + 7, PLATEAU_RADIUS, Math.hypot(x - d.position[0], z - d.position[1]));
    h = lerp(h, 0.4, k);
  }

  // Flatten walkways.
  for (const p of paths) {
    const { d } = segDistance(x, z, p.a, p.b);
    h = lerp(h, 0.3, smoothstep(PATH_HALF_WIDTH + 4, PATH_HALF_WIDTH, d));
  }

  // Carve the river last so it cuts through everything.
  const rd = polyDistance(x, z, river);
  h = lerp(h, WATER_LEVEL - 1.4, smoothstep(RIVER_HALF_WIDTH + 3.5, RIVER_HALF_WIDTH - 0.6, rd));
  return h;
}

export function riverDistance(x: number, z: number) {
  return polyDistance(x, z, river);
}

function onBridge(x: number, z: number) {
  for (const b of bridges) {
    const dx = x - b.center[0];
    const dz = z - b.center[1];
    const along = dx * Math.sin(b.angle) + dz * Math.cos(b.angle);
    const across = dx * Math.cos(b.angle) - dz * Math.sin(b.angle);
    if (Math.abs(along) <= b.halfLength && Math.abs(across) <= b.halfWidth) return b;
  }
  return null;
}

/** Height the player stands at, including bridge decks. */
export function groundHeight(x: number, z: number) {
  const b = onBridge(x, z);
  const t = terrainHeight(x, z);
  return b ? Math.max(t, b.deck) : t;
}

// ---------- collision ----------
export type Collider = { x: number; z: number; r: number };
const colliders: Collider[] = [];
/** Adds building footprints; returns an unregister function for effect cleanup. */
export function registerColliders(list: Collider[]) {
  colliders.push(...list);
  return () => {
    for (const c of list) {
      const i = colliders.indexOf(c);
      if (i >= 0) colliders.splice(i, 1);
    }
  };
}

/** Whether a point is walkable: inside the park, out of the river (unless on a bridge), not inside a building. */
export function isWalkable(x: number, z: number) {
  if (Math.hypot(x, z) > WORLD_RADIUS) return false;
  if (riverDistance(x, z) < RIVER_HALF_WIDTH + 0.6 && !onBridge(x, z)) return false;
  if (terrainHeight(x, z) > 3.2) return false;
  for (const c of colliders) if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return false;
  return true;
}

/** Slide-along-walls movement resolution: tries the full step, then each axis. */
export function resolveMove(x: number, z: number, dx: number, dz: number): Vec2 {
  if (isWalkable(x + dx, z + dz)) return [x + dx, z + dz];
  if (isWalkable(x + dx, z)) return [x + dx, z];
  if (isWalkable(x, z + dz)) return [x, z + dz];
  return [x, z];
}

/** Deterministic PRNG for scattering. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** True when a point is clear for scenery (trees etc.). */
export function isOpenGround(x: number, z: number, margin = 0) {
  if (riverDistance(x, z) < RIVER_HALF_WIDTH + 2.5 + margin) return false;
  if (Math.hypot(x, z) < PLAZA_RADIUS + 4 + margin) return false;
  for (const p of paths) if (segDistance(x, z, p.a, p.b).d < PATH_HALF_WIDTH + 2 + margin) return false;
  for (const d of destinations) {
    if (Math.hypot(x - d.position[0], z - d.position[1]) < PLATEAU_RADIUS + 2 + margin) return false;
    // Keep each arrival viewpoint and its sight line to the landmark clear.
    if (segDistance(x, z, d.viewpoint, d.position).d < 4.5 + margin) return false;
  }
  return true;
}
