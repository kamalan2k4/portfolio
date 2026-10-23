import { describe, expect, it } from "vitest";
import { destinations } from "@/content/destinations";
import { bridges, groundHeight, isWalkable, paths, riverDistance, RIVER_HALF_WIDTH, terrainHeight } from "./terrain";

describe("world layout", () => {
  it("puts every viewpoint on walkable, level-ish ground", () => {
    for (const d of destinations) {
      const [x, z] = d.viewpoint;
      expect(isWalkable(x, z), `${d.id} viewpoint`).toBe(true);
      expect(Math.abs(groundHeight(x, z)), `${d.id} viewpoint height`).toBeLessThan(3);
    }
  });

  it("keeps every walkway passable end to end (bridges included)", () => {
    for (const p of paths) {
      for (let t = 0.3; t <= 0.85; t += 0.01) {
        const x = p.a[0] + (p.b[0] - p.a[0]) * t;
        const z = p.a[1] + (p.b[1] - p.a[1]) * t;
        expect(isWalkable(x, z), `${p.to} at t=${t.toFixed(2)}`).toBe(true);
      }
    }
  });

  it("builds a bridge wherever a walkway crosses the river", () => {
    const crossing = paths.filter((p) => {
      for (let t = 0; t <= 1; t += 0.01) if (riverDistance(p.a[0] + (p.b[0] - p.a[0]) * t, p.a[1] + (p.b[1] - p.a[1]) * t) < RIVER_HALF_WIDTH) return true;
      return false;
    });
    expect(bridges.length).toBe(crossing.length);
    for (const b of bridges) expect(groundHeight(b.center[0], b.center[1])).toBeCloseTo(b.deck, 5);
  });

  it("blocks walking into the river away from bridges", () => {
    expect(isWalkable(-36, 8)).toBe(false);
    expect(terrainHeight(-36, 8)).toBeLessThan(0);
  });

  it("is deterministic", () => {
    expect(terrainHeight(12.3, -45.6)).toBe(terrainHeight(12.3, -45.6));
  });
});
