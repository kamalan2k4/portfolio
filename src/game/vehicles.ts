/**
 * Traffic and drivable cars as plain data, simulated in the frame loop.
 * Rendering (instanced) lives in Traffic.tsx; heroes damage cars through `hitCars`/`ramCars`.
 */
import { Vector3 } from "three";
import { collide, ISLAND, LANE, mulberry32, parkingSpots, PITCH, streetLines, surfaceBelow } from "./city/layout";

export type Car = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  /** Traffic lane: which street line, which axis, which direction. */
  axis: 0 | 1;
  line: number;
  dir: 1 | -1;
  color: number;
  kind: 0 | 1; // 0 sedan, 1 sports
  state: "drive" | "parked" | "player" | "wreck";
  vel: Vector3;
  spin: Vector3;
  rot: Vector3;
  wreckT: number;
};

export const TRAFFIC_COUNT = 40;
const MAX_TRAFFIC_SPEED = 15;

function laneCoord(line: number, dir: 1 | -1) {
  return streetLines[line] + dir * LANE * 0.55;
}

function spawnTraffic(c: Car, rnd: () => number, avoid?: Vector3) {
  for (let tries = 0; tries < 20; tries++) {
    c.axis = rnd() < 0.5 ? 0 : 1;
    c.line = 1 + Math.floor(rnd() * (streetLines.length - 2));
    c.dir = rnd() < 0.5 ? 1 : -1;
    const along = (rnd() - 0.5) * (ISLAND * 2 - 20);
    const across = laneCoord(c.line, c.dir);
    c.x = c.axis === 0 ? along : across;
    c.z = c.axis === 0 ? across : along;
    if (!avoid || Math.hypot(c.x - avoid.x, c.z - avoid.z) > 70) break;
  }
  c.y = 0;
  c.yaw = c.axis === 0 ? (c.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : c.dir > 0 ? Math.PI : 0;
  c.speed = 8 + rnd() * (MAX_TRAFFIC_SPEED - 8);
  c.state = "drive";
  c.rot.set(0, 0, 0);
  c.vel.set(0, 0, 0);
}

const rnd = mulberry32(77);

export const cars: Car[] = [
  ...Array.from({ length: TRAFFIC_COUNT }, () => {
    const c: Car = { x: 0, y: 0, z: 0, yaw: 0, speed: 0, axis: 0, line: 0, dir: 1, color: Math.floor(rnd() * 8), kind: rnd() < 0.25 ? 1 : 0, state: "drive", vel: new Vector3(), spin: new Vector3(), rot: new Vector3(), wreckT: 0 };
    spawnTraffic(c, rnd);
    return c;
  }),
  // Drivable hero cars parked by each district.
  ...parkingSpots.map((p, i) => ({ x: p.x, y: 0, z: p.z, yaw: p.yaw, speed: 0, axis: 0 as const, line: 0, dir: 1 as const, color: 8 + (i % 3), kind: 1 as const, state: "parked" as const, vel: new Vector3(), spin: new Vector3(), rot: new Vector3(), wreckT: 0 })),
];

/** Heading unit vector for a yaw (0 faces -Z). */
export const heading = (yaw: number, out = new Vector3()) => out.set(-Math.sin(yaw), 0, -Math.cos(yaw));

const tmp = new Vector3();

/** Knocks a car into the air as a wreck. Returns true if it was intact. */
export function wreck(c: Car, from: Vector3, power: number) {
  if (c.state === "wreck") return false;
  tmp.set(c.x - from.x, 0, c.z - from.z).normalize();
  c.vel.set(tmp.x * power * 0.6, 6 + power * 0.5, tmp.z * power * 0.6);
  c.spin.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 8);
  c.state = "wreck";
  c.wreckT = 0;
  c.speed = 0;
  return true;
}

/** Damages every car within `radius` of `point`. Returns the positions hit (for effects). */
export function hitCars(point: Vector3, radius: number, power: number, skip = -1) {
  const hits: Vector3[] = [];
  cars.forEach((c, i) => {
    if (i === skip || c.state === "player") return;
    if ((c.x - point.x) ** 2 + (c.y + 0.7 - point.y) ** 2 + (c.z - point.z) ** 2 < radius * radius && wreck(c, point, power)) hits.push(new Vector3(c.x, c.y + 0.8, c.z));
  });
  return hits;
}

/** Cars hit by a segment (a beam): everything along it, penetrating. */
export function hitCarsAlong(a: Vector3, b: Vector3, radius: number, power: number) {
  const hits: Vector3[] = [];
  const ab = new Vector3().subVectors(b, a); // own vector: wreck() reuses the shared scratch
  const len2 = ab.lengthSq() || 1;
  for (const c of cars) {
    if (c.state === "player" || c.state === "wreck") continue;
    const t = Math.max(0, Math.min(1, ((c.x - a.x) * ab.x + (c.y + 0.7 - a.y) * ab.y + (c.z - a.z) * ab.z) / len2));
    const px = a.x + ab.x * t;
    const py = a.y + ab.y * t;
    const pz = a.z + ab.z * t;
    if ((c.x - px) ** 2 + (c.y + 0.7 - py) ** 2 + (c.z - pz) ** 2 < radius * radius && wreck(c, new Vector3(px, py, pz), power)) hits.push(new Vector3(c.x, c.y + 0.8, c.z));
  }
  return hits;
}

/** Nearest intact car within `range` of `p`, optionally excluding some. */
export function nearestCar(p: Vector3, range: number, exclude: Set<number> = new Set(), states: Car["state"][] = ["drive", "parked"]) {
  let best = -1;
  let bd = range * range;
  cars.forEach((c, i) => {
    if (exclude.has(i) || !states.includes(c.state)) return;
    const d = (c.x - p.x) ** 2 + (c.z - p.z) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

/** Advances traffic, wrecks and the player's car. */
export function stepCars(dt: number, player: Vector3, input: { throttle: number; steer: number; brake: boolean } | null, onSmash: (p: Vector3, power: number) => void) {
  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    if (c.state === "drive") {
      // Brake for the hero or the car ahead in the same lane.
      let target = MAX_TRAFFIC_SPEED * (0.6 + ((i * 37) % 10) / 25);
      const hx = heading(c.yaw, tmp);
      const ahead = (px: number, pz: number, gap: number) => {
        const dx = px - c.x;
        const dz = pz - c.z;
        const fwd = dx * hx.x + dz * hx.z;
        return fwd > 0 && fwd < gap && Math.abs(dx * hx.z - dz * hx.x) < 2.2;
      };
      if (ahead(player.x, player.z, 14)) target = 0;
      for (let k = 0; k < TRAFFIC_COUNT && target > 0; k++) if (k !== i && cars[k].state !== "wreck" && ahead(cars[k].x, cars[k].z, 10)) target = Math.min(target, cars[k].speed * 0.9);
      c.speed += (target - c.speed) * Math.min(1, dt * 2);
      c.x += hx.x * c.speed * dt;
      c.z += hx.z * c.speed * dt;
      // Loop at the shore (out of sight behind the seawall fog).
      const lim = ISLAND - 6;
      if (c.axis === 0 && Math.abs(c.x) > lim) c.x = -Math.sign(c.x) * lim;
      if (c.axis === 1 && Math.abs(c.z) > lim) c.z = -Math.sign(c.z) * lim;
    } else if (c.state === "wreck") {
      c.wreckT += dt;
      c.vel.y -= 28 * dt;
      c.x += c.vel.x * dt;
      c.y += c.vel.y * dt;
      c.z += c.vel.z * dt;
      c.rot.addScaledVector(c.spin, dt);
      const floor = surfaceBelow(c.x, c.z, c.y + 0.5);
      if (c.y < floor) {
        c.y = floor;
        if (Math.abs(c.vel.y) > 4) onSmash(new Vector3(c.x, c.y + 0.5, c.z), 0.4);
        c.vel.y *= -0.25;
        c.vel.x *= 0.6;
        c.vel.z *= 0.6;
        c.spin.multiplyScalar(0.5);
      }
      const hit = collide(c.x, c.y, c.z, 1.2, 1.4);
      if (hit.hit) {
        c.x = hit.x;
        c.z = hit.z;
        c.vel.x *= -0.3;
        c.vel.z *= -0.3;
      }
      // Respawn traffic out of sight; parked hero cars return to their spot.
      if (c.wreckT > 9) {
        if (i < TRAFFIC_COUNT) spawnTraffic(c, Math.random, player);
        else {
          const p = parkingSpots[i - TRAFFIC_COUNT];
          Object.assign(c, { x: p.x, y: 0, z: p.z, yaw: p.yaw, state: "parked" });
          c.rot.set(0, 0, 0);
        }
      }
    } else if (c.state === "player" && input) {
      const accel = input.throttle > 0 ? 22 : input.throttle < 0 ? (c.speed > 0 ? 40 : 14) : 6;
      const targetSpeed = input.throttle > 0 ? 48 : input.throttle < 0 ? -14 : 0;
      c.speed += Math.sign(targetSpeed - c.speed) * Math.min(Math.abs(targetSpeed - c.speed), accel * dt);
      if (input.brake) c.speed *= Math.max(0, 1 - dt * 3);
      // Steering tightens at low speed, loosens at high speed; handbrake drifts.
      const grip = input.brake ? 2.6 : 1.6;
      c.yaw -= input.steer * grip * dt * Math.min(1, Math.abs(c.speed) / 6) * Math.sign(c.speed || 1) * (1 - Math.min(0.5, Math.abs(c.speed) / 120));
      const hx = heading(c.yaw, tmp);
      c.x += hx.x * c.speed * dt;
      c.z += hx.z * c.speed * dt;
      const hit = collide(c.x, 0.2, c.z, 1.3, 1.2);
      if (hit.hit) {
        if (Math.abs(c.speed) > 12) onSmash(new Vector3(c.x, 0.8, c.z), Math.abs(c.speed) / 40);
        c.x = hit.x;
        c.z = hit.z;
        c.speed *= -0.25;
      }
      c.x = Math.max(-ISLAND + 3, Math.min(ISLAND - 3, c.x));
      c.z = Math.max(-ISLAND + 3, Math.min(ISLAND - 3, c.z));
      c.y = surfaceBelow(c.x, c.z, 0.6);
      // Plough through traffic.
      if (Math.abs(c.speed) > 8) {
        for (const p of hitCars(new Vector3(c.x + hx.x * 2, 0.8, c.z + hx.z * 2), 2.4, Math.abs(c.speed), i)) onSmash(p, Math.abs(c.speed) / 30);
      }
    }
  }
}

/** Grid sanity for tests: lanes sit inside streets. */
export const laneInStreet = (line: number, dir: 1 | -1) => Math.abs(laneCoord(line, dir) - streetLines[line]) < (PITCH - 40) / 2;
