import { describe, expect, it } from "vitest";
import { destinations } from "@/content/destinations";
import { cityPlacement } from "./CityDistricts";
import { buildings, collide, ISLAND, nearbyBuildings, parkingSpots, PLAZA_HEIGHT, raycastBuildings, streetLines, surfaceBelow } from "./layout";
import { cars, hitCars, hitCarsAlong, laneInStreet, TRAFFIC_COUNT, wreck } from "../vehicles";
import { Vector3 } from "three";

const inside = (x: number, z: number) => buildings.some((b) => b.bottom === 0 && x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ);

describe("city layout", () => {
  it("generates a dense, deterministic skyline", () => {
    expect(buildings.length).toBeGreaterThan(150);
    expect(Math.max(...buildings.map((b) => b.top))).toBeGreaterThan(90);
    for (const b of buildings) {
      expect(b.maxX).toBeGreaterThan(b.minX);
      expect(b.top).toBeGreaterThan(b.bottom);
      expect(Math.abs(b.minX)).toBeLessThan(ISLAND);
    }
  });

  it("keeps every district plaza and viewpoint clear of towers", () => {
    for (const d of destinations) {
      const p = cityPlacement(d.id);
      expect(inside(...p.position), `${d.id} centre`).toBe(false);
      expect(inside(...p.viewpoint), `${d.id} viewpoint`).toBe(false);
      expect(surfaceBelow(p.viewpoint[0], p.viewpoint[1], 5)).toBeCloseTo(PLAZA_HEIGHT, 5);
    }
  });

  it("keeps streets open and parked cars on the road", () => {
    for (const s of streetLines.slice(1, -1)) expect(inside(s, 13.5)).toBe(false);
    for (const p of parkingSpots) expect(inside(p.x, p.z)).toBe(false);
    for (let line = 1; line < streetLines.length - 1; line++) expect(laneInStreet(line, 1) && laneInStreet(line, -1)).toBe(true);
  });

  it("pushes a character out of a wall and lets it stand on a roof", () => {
    const b = buildings.find((x) => x.bottom === 0 && x.top > 30)!;
    const cx = (b.minX + b.maxX) / 2;
    const c = collide(b.minX + 0.2, 0, (b.minZ + b.maxZ) / 2, 0.45, 1.8);
    expect(c.hit).toBe(true);
    expect(c.x).toBeLessThanOrEqual(b.minX - 0.45 + 1e-6);
    expect(surfaceBelow(cx, (b.minZ + b.maxZ) / 2, b.top + 0.3)).toBeGreaterThanOrEqual(b.top);
    expect(nearbyBuildings(cx, (b.minZ + b.maxZ) / 2, 1)).toContain(b);
  });

  it("raycasts to building faces and the ground", () => {
    const b = buildings.find((x) => x.bottom === 0 && x.top > 30)!;
    const z = (b.minZ + b.maxZ) / 2;
    const hit = raycastBuildings(b.minX - 20, 10, z, 1, 0, 0, 100)!;
    expect(hit.normal).toEqual([-1, 0, 0]);
    expect(hit.point[0]).toBeCloseTo(b.minX, 3);
    const down = raycastBuildings(0, 50, 177, 0, -1, 0, 100)!;
    expect(down.point[1]).toBeCloseTo(PLAZA_HEIGHT, 3);
  });
});

describe("vehicles", () => {
  it("spawns traffic plus a drivable car per district", () => {
    expect(cars.length).toBe(TRAFFIC_COUNT + destinations.length);
    expect(cars.slice(TRAFFIC_COUNT).every((c) => c.state === "parked")).toBe(true);
  });

  it("wrecks cars hit by blasts and beams, once", () => {
    const c = cars[0];
    const at = new Vector3(c.x, c.y + 0.7, c.z);
    expect(hitCars(at, 2, 10).length).toBeGreaterThanOrEqual(1);
    expect(c.state).toBe("wreck");
    expect(wreck(c, at, 10)).toBe(false);
    // A beam punches through every intact car along its path.
    const d = cars.find((k, i) => i < TRAFFIC_COUNT && k.state === "drive")!;
    const beamHits = hitCarsAlong(new Vector3(d.x - 30, d.y + 0.7, d.z), new Vector3(d.x + 30, d.y + 0.7, d.z), 1.5, 10);
    expect(beamHits.length).toBeGreaterThanOrEqual(1);
    expect(d.state).toBe("wreck");
  });
});
