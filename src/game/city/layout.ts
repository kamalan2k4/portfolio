/**
 * Procedural city: a Manhattan-style grid on an island. Pure, deterministic data and
 * geometry queries (collision, rooftops, raycasts) shared by rendering and gameplay.
 */
import type { DistrictId } from "@/content/types";

export const BLOCK = 40;
export const STREET = 14;
export const PITCH = BLOCK + STREET;
export const N = 4; // blocks span -N..N on both axes
export const ISLAND = N * PITCH + BLOCK / 2 + STREET; // shoreline half-extent
export const SKY_LIMIT = 420; // flyers stay inside this radius
export const PLAZA_TOP = 0.15;

export type Vec2 = [number, number];
export type Box = { minX: number; maxX: number; minZ: number; maxZ: number; bottom: number; top: number };
export type Building = Box & { tint: number; lit: number; seed: number };

// ---------- deterministic randomness ----------
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- blocks ----------
export const blockCenter = (i: number, j: number): Vec2 => [i * PITCH, j * PITCH];

/** Which portfolio district occupies which city block. */
export const DISTRICT_BLOCKS: Record<DistrictId, Vec2> = {
  nexus: [0, 0],
  arrival: [0, 3],
  citadel: [0, -2],
  "ai-dome": [2, -1],
  innovation: [2, 1],
  "product-city": [-1, 3],
  "creator-bay": [-4, 1],
  "knowledge-falls": [-2, -1],
  "launch-terminal": [-2, 2],
};

/** Park blocks (no buildings): Knowledge Falls sits in the middle of a small park. */
export const PARK_BLOCKS: Vec2[] = [
  [-3, -1],
  [-2, -2],
  [-3, -2],
];

const key = (i: number, j: number) => `${i},${j}`;
const districtAt = new Map(Object.entries(DISTRICT_BLOCKS).map(([id, [i, j]]) => [key(i, j), id as DistrictId]));
const parkAt = new Set(PARK_BLOCKS.map(([i, j]) => key(i, j)));

export const blockKind = (i: number, j: number): "district" | "park" | "city" => (districtAt.has(key(i, j)) ? "district" : parkAt.has(key(i, j)) ? "park" : "city");
export const districtOfBlock = (i: number, j: number) => districtAt.get(key(i, j));

// ---------- buildings ----------
function generateBuildings(): Building[] {
  const out: Building[] = [];
  for (let i = -N; i <= N; i++) {
    for (let j = -N; j <= N; j++) {
      if (blockKind(i, j) !== "city") continue;
      const rnd = mulberry32(i * 7919 + j * 104729 + 17);
      const [cx, cz] = blockCenter(i, j);
      const split = rnd() < 0.35 ? 1 : rnd() < 0.6 ? 2 : 4;
      const lots: Box[] = [];
      const half = BLOCK / 2;
      if (split === 1) lots.push({ minX: cx - half, maxX: cx + half, minZ: cz - half, maxZ: cz + half, bottom: 0, top: 0 });
      else if (split === 2) {
        const alongX = rnd() < 0.5;
        for (const s of [-1, 1]) {
          lots.push(
            alongX
              ? { minX: cx + (s < 0 ? -half : 0), maxX: cx + (s < 0 ? 0 : half), minZ: cz - half, maxZ: cz + half, bottom: 0, top: 0 }
              : { minX: cx - half, maxX: cx + half, minZ: cz + (s < 0 ? -half : 0), maxZ: cz + (s < 0 ? 0 : half), bottom: 0, top: 0 },
          );
        }
      } else {
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) lots.push({ minX: cx + (sx < 0 ? -half : 0), maxX: cx + (sx < 0 ? 0 : half), minZ: cz + (sz < 0 ? -half : 0), maxZ: cz + (sz < 0 ? 0 : half), bottom: 0, top: 0 });
      }
      // Midtown is tallest; heights fall off toward the shore.
      const r = Math.hypot(cx, cz);
      const skyline = 22 + 150 * Math.exp(-((r / 170) ** 2));
      for (const lot of lots) {
        const inset = 2.5 + rnd() * 1.5;
        const fp = { minX: lot.minX + inset, maxX: lot.maxX - inset, minZ: lot.minZ + inset, maxZ: lot.maxZ - inset };
        const h = Math.max(14, skyline * (0.45 + rnd() * 0.8));
        const tint = Math.floor(rnd() * 6);
        const lit = 0.25 + rnd() * 0.5;
        const seed = Math.floor(rnd() * 1e6);
        if (h > 60 && rnd() < 0.7) {
          // Setback tower: podium, shaft, optional crown.
          const h1 = h * (0.35 + rnd() * 0.2);
          out.push({ ...fp, bottom: 0, top: h1, tint, lit, seed });
          const w = (fp.maxX - fp.minX) * (0.18 + rnd() * 0.12);
          const d = (fp.maxZ - fp.minZ) * (0.18 + rnd() * 0.12);
          const shaft = { minX: fp.minX + w, maxX: fp.maxX - w, minZ: fp.minZ + d, maxZ: fp.maxZ - d };
          out.push({ ...shaft, bottom: h1, top: h, tint, lit, seed: seed + 1 });
          if (rnd() < 0.5) {
            const k = 0.3;
            const cw = (shaft.maxX - shaft.minX) * k;
            const cd = (shaft.maxZ - shaft.minZ) * k;
            out.push({ minX: shaft.minX + cw, maxX: shaft.maxX - cw, minZ: shaft.minZ + cd, maxZ: shaft.maxZ - cd, bottom: h, top: h + 6 + rnd() * 14, tint, lit: lit * 0.6, seed: seed + 2 });
          }
        } else {
          out.push({ ...fp, bottom: 0, top: h, tint, lit, seed });
        }
      }
    }
  }
  return out;
}

export const buildings: Building[] = generateBuildings();

/** Raised plazas on district blocks: solid for collision, drawn separately (not as towers). */
export const PLAZA_HEIGHT = 0.45;
export const plazas: Box[] = Object.values(DISTRICT_BLOCKS).map(([i, j]) => {
  const [cx, cz] = blockCenter(i, j);
  const h = BLOCK / 2 - 1;
  return { minX: cx - h, maxX: cx + h, minZ: cz - h, maxZ: cz + h, bottom: 0, top: PLAZA_HEIGHT };
});

/** Everything solid: towers plus plazas. */
const solids: Box[] = [...buildings, ...plazas];

// Spatial index by block for collision queries.
const byBlock = new Map<string, Box[]>();
for (const b of solids) {
  const i = Math.round((b.minX + b.maxX) / 2 / PITCH);
  const j = Math.round((b.minZ + b.maxZ) / 2 / PITCH);
  const k = key(i, j);
  byBlock.set(k, [...(byBlock.get(k) ?? []), b]);
}

/** Solid boxes (towers and plazas) whose block is within `r` of (x, z). */
export function nearbyBuildings(x: number, z: number, r: number): Box[] {
  const i0 = Math.round((x - r) / PITCH);
  const i1 = Math.round((x + r) / PITCH);
  const j0 = Math.round((z - r) / PITCH);
  const j1 = Math.round((z + r) / PITCH);
  const out: Box[] = [];
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) out.push(...(byBlock.get(key(i, j)) ?? []));
  return out;
}

// ---------- extra solid obstacles (landmarks register cylinders) ----------
export type Cylinder = { x: number; z: number; r: number; top: number };
const cylinders: Cylinder[] = [];
export function registerCylinders(list: Cylinder[]) {
  cylinders.push(...list);
  return () => {
    for (const c of list) {
      const i = cylinders.indexOf(c);
      if (i >= 0) cylinders.splice(i, 1);
    }
  };
}

/** Highest walkable surface at (x, z) that is at or below `y + step`. */
export function surfaceBelow(x: number, z: number, y: number, step = 0.6) {
  let best = 0;
  for (const b of nearbyBuildings(x, z, 1)) {
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ && b.top <= y + step && b.top > best) best = b.top;
  }
  for (const c of cylinders) if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r && c.top <= y + step && c.top > best) best = c.top;
  return best;
}

/**
 * Pushes a vertical capsule (radius r, from y to y + height) out of building boxes and
 * landmark cylinders. Returns the corrected position and which wall normal was hit (if any).
 */
export function collide(x: number, y: number, z: number, r: number, height: number) {
  let nx = 0;
  let nz = 0;
  for (const b of nearbyBuildings(x, z, r + 2)) {
    if (y + height <= b.bottom || y >= b.top - 0.05) continue;
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
    const dx = x - cx;
    const dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * r;
      z = cz + (dz / d) * r;
      nx = dx / d;
      nz = dz / d;
    } else {
      // Centre is inside the box: exit through the nearest face.
      const pen = [x - b.minX, b.maxX - x, z - b.minZ, b.maxZ - z];
      const m = pen.indexOf(Math.min(...pen));
      if (m === 0) {
        x = b.minX - r;
        nx = -1;
      } else if (m === 1) {
        x = b.maxX + r;
        nx = 1;
      } else if (m === 2) {
        z = b.minZ - r;
        nz = -1;
      } else {
        z = b.maxZ + r;
        nz = 1;
      }
    }
  }
  for (const c of cylinders) {
    if (y >= c.top - 0.05) continue;
    const dx = x - c.x;
    const dz = z - c.z;
    const d = Math.hypot(dx, dz);
    const min = r + c.r;
    if (d < min && d > 1e-6) {
      x = c.x + (dx / d) * min;
      z = c.z + (dz / d) * min;
      nx = dx / d;
      nz = dz / d;
    }
  }
  return { x, z, hit: nx !== 0 || nz !== 0, nx, nz };
}

/** True when a ground-bound character may stand at (x, z): on the island. */
export const onIsland = (x: number, z: number) => Math.abs(x) <= ISLAND - 1 && Math.abs(z) <= ISLAND - 1;

/** Ray vs. all solids (slab test). Returns distance, point and face normal of the first hit. */
export function raycastBuildings(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxDist: number) {
  let best = maxDist;
  let normal: [number, number, number] | null = null;
  const inv = [1 / dx, 1 / dy, 1 / dz];
  for (const b of solids) {
    const t1 = (b.minX - ox) * inv[0];
    const t2 = (b.maxX - ox) * inv[0];
    const t3 = (b.bottom - oy) * inv[1];
    const t4 = (b.top - oy) * inv[1];
    const t5 = (b.minZ - oz) * inv[2];
    const t6 = (b.maxZ - oz) * inv[2];
    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4), Math.min(t5, t6));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4), Math.max(t5, t6));
    if (tmax < 0 || tmin > tmax || tmin > best || tmin < 0) continue;
    best = tmin;
    if (tmin === Math.min(t1, t2)) normal = [dx > 0 ? -1 : 1, 0, 0];
    else if (tmin === Math.min(t3, t4)) normal = [0, dy > 0 ? -1 : 1, 0];
    else normal = [0, 0, dz > 0 ? -1 : 1];
  }
  // Ground plane
  if (dy < 0) {
    const tg = -oy / dy;
    if (tg >= 0 && tg < best) {
      best = tg;
      normal = [0, 1, 0];
    }
  }
  return normal ? { dist: best, point: [ox + dx * best, oy + dy * best, oz + dz * best] as [number, number, number], normal } : null;
}

// ---------- streets ----------
/** Street centrelines (both axes) between blocks. */
export const streetLines: number[] = Array.from({ length: 2 * N + 2 }, (_, k) => (k - N - 0.5) * PITCH);
export const LANE = 3.4;

/** Curbside parking spots next to each district plaza, used for drivable cars. */
export const parkingSpots: { x: number; z: number; yaw: number; district: DistrictId }[] = Object.entries(DISTRICT_BLOCKS).map(([id, [i, j]]) => {
  const [cx, cz] = blockCenter(i, j);
  // South curb of the block, parked facing east.
  return { x: cx + 4, z: cz + BLOCK / 2 + STREET / 2 - LANE - 1.6, yaw: Math.PI / 2, district: id as DistrictId };
});
