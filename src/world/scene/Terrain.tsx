import { useMemo } from "react";
import { BufferAttribute, BufferGeometry, CircleGeometry, Color, Float32BufferAttribute, PlaneGeometry, RingGeometry } from "three";
import { destinations } from "@/content/destinations";
import { bridges, fbm, groundHeight, PATH_HALF_WIDTH, paths, PLATEAU_RADIUS, PLAZA_RADIUS, riverDistance, RIVER_HALF_WIDTH, smoothstep, terrainHeight } from "../terrain";
import { Batch, part, type Part } from "./kit";
import { useDispose } from "./useDispose";

const TERRAIN_SIZE = 340;

const C = {
  grassDeep: new Color("#3b6a34"),
  grass: new Color("#5f8f43"),
  meadow: new Color("#a2ab55"),
  sand: new Color("#9c8a62"),
  rock: new Color("#6f685d"),
  rockLight: new Color("#9a9182"),
  snow: new Color("#ece9e1"),
};

function buildTerrain(segments: number) {
  const geo = new PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as BufferAttribute;
  const n = segments + 1;
  const step = TERRAIN_SIZE / segments;

  // Sample each height once; slope comes from grid neighbours.
  const heights = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) heights[i] = terrainHeight(pos.getX(i), pos.getZ(i));

  const colors = new Float32Array(pos.count * 3);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = heights[i];
    pos.setY(i, h);
    const col = i % n;
    const row = (i / n) | 0;
    const hx = heights[row * n + Math.min(col + 1, n - 1)];
    const hz = heights[Math.min(row + 1, n - 1) * n + col];
    const slope = Math.min(1, (Math.abs(hx - h) + Math.abs(hz - h)) / (step * 1.4));

    const noise = fbm(x * 0.08, z * 0.08, 3);
    c.copy(C.grassDeep).lerp(C.grass, smoothstep(0.25, 0.7, noise));
    c.lerp(C.meadow, smoothstep(0.62, 0.85, fbm(x * 0.03 + 11, z * 0.03, 3)) * 0.55);
    if (h < 2) c.lerp(C.sand, smoothstep(RIVER_HALF_WIDTH + 3, RIVER_HALF_WIDTH, riverDistance(x, z)));
    c.lerp(C.rock, smoothstep(0.35, 0.75, slope));
    c.lerp(C.rockLight, smoothstep(18, 34, h) * 0.6);
    c.lerp(C.snow, smoothstep(44, 56, h + noise * 6));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  geo.deleteAttribute("uv");
  geo.computeVertexNormals();
  return geo;
}

/** Ribbon that follows the ground along a segment. */
function ribbon(ax: number, az: number, bx: number, bz: number, halfWidth: number, lift: number, start = 0, end = 1) {
  const len = Math.hypot(bx - ax, bz - az);
  const steps = Math.max(2, Math.ceil(len * (end - start)));
  const nx = -(bz - az) / len;
  const nz = (bx - ax) / len;
  const verts: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = start + (end - start) * (i / steps);
    const cx = ax + (bx - ax) * t;
    const cz = az + (bz - az) * t;
    for (const s of [-1, 1]) {
      const x = cx + nx * halfWidth * s;
      const z = cz + nz * halfWidth * s;
      verts.push(x, Math.max(groundHeight(x, z), groundHeight(cx, cz)) + lift, z);
    }
    if (i < steps) {
      const k = i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const flat = (geo: BufferGeometry, x: number, y: number, z: number) => geo.rotateX(-Math.PI / 2).translate(x, y, z);

export function Terrain({ segments, shadows }: { segments: number; shadows: boolean }) {
  const geometry = useMemo(() => buildTerrain(segments), [segments]);
  useDispose(geometry);
  return (
    <mesh geometry={geometry} receiveShadow={shadows}>
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
    </mesh>
  );
}

/** Walkways, plazas and bridges, batched into a few draw calls. */
export function Walkways({ shadows }: { shadows: boolean }) {
  const parts = useMemo<Part[]>(() => {
    const out: Part[] = [];
    for (const p of paths) {
      const len = Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]);
      out.push({ mat: "path", geo: ribbon(p.a[0], p.a[1], p.b[0], p.b[1], PATH_HALF_WIDTH, 0.06, (PLAZA_RADIUS - 1) / len, 1 - (PLATEAU_RADIUS - 2) / len) });
    }
    for (const d of destinations) {
      if (d.id === "nexus") continue;
      out.push({ mat: "path", geo: flat(new CircleGeometry(PLATEAU_RADIUS - 1, 48), d.position[0], 0.43, d.position[1]) });
      out.push({ mat: "stoneAlt", geo: flat(new RingGeometry(PLATEAU_RADIUS - 1.25, PLATEAU_RADIUS - 0.9, 64), d.position[0], 0.44, d.position[1]) });
    }
    out.push({ mat: "stoneLight", geo: flat(new CircleGeometry(PLAZA_RADIUS, 64), 0, 0.38, 0) });
    for (const b of bridges) {
      const t = { r: [0, b.angle, 0] as [number, number, number] };
      const at = (dx: number, y: number): [number, number, number] => [b.center[0] + Math.cos(b.angle) * dx, b.deck + y, b.center[1] - Math.sin(b.angle) * dx];
      out.push(part.box("stoneAlt", [b.halfWidth * 2, 0.35, b.halfLength * 2], { ...t, p: at(0, 0) }));
      for (const s of [-1, 1]) {
        out.push(part.box("metal", [0.18, 0.12, b.halfLength * 2], { ...t, p: at(s * b.halfWidth, 0.85) }));
        out.push(part.box("glass:#a9ded3", [0.08, 0.7, b.halfLength * 2], { ...t, p: at(s * b.halfWidth, 0.45) }));
      }
    }
    return out;
  }, []);
  return <Batch parts={parts} shadows={shadows} />;
}
