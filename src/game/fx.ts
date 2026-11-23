/**
 * Effect state (beams, explosions, debris, shield) as pooled plain data. Gameplay pushes
 * events here; Effects.tsx renders them. Nothing allocates per frame in steady state.
 */
import { Vector3 } from "three";
import { collide, surfaceBelow } from "./city/layout";
import { rt } from "./state";
import { cars, hitCars, nearestCar } from "./vehicles";

/** Body points published by the avatar every frame (world space). */
export const body = {
  rightHand: new Vector3(),
  leftHand: new Vector3(),
  chest: new Vector3(),
  thrusters: [new Vector3(), new Vector3(), new Vector3(), new Vector3()],
  thrustDirs: [new Vector3(0, -1, 0), new Vector3(0, -1, 0), new Vector3(0, -1, 0), new Vector3(0, -1, 0)],
  ready: false,
};

export type Beam = { from: Vector3; to: Vector3; life: number; max: number; heavy: boolean };
export type Blast = { pos: Vector3; life: number; power: number };
export type Shard = { pos: Vector3; vel: Vector3; life: number; spin: number };

export const fx = {
  beams: Array.from({ length: 8 }, (): Beam => ({ from: new Vector3(), to: new Vector3(), life: 0, max: 0.14, heavy: false })),
  blasts: Array.from({ length: 10 }, (): Blast => ({ pos: new Vector3(), life: 0, power: 1 })),
  shards: Array.from({ length: 160 }, (): Shard => ({ pos: new Vector3(), vel: new Vector3(), life: 0, spin: 0 })),
  thrust: 0,
  /** Web line visible this frame (swing or zip). */
  web: { on: false, to: new Vector3() },
  shield: {
    state: "held" as "held" | "out" | "return",
    pos: new Vector3(),
    vel: new Vector3(),
    target: new Vector3(),
    hits: 0,
    visited: new Set<number>(),
    t: 0,
  },
};

let beamCursor = 0;
let blastCursor = 0;
let shardCursor = 0;

export function beam(from: Vector3, to: Vector3, heavy = false) {
  const b = fx.beams[beamCursor++ % fx.beams.length];
  b.from.copy(from);
  b.to.copy(to);
  b.max = heavy ? 0.45 : 0.14;
  b.life = b.max;
  b.heavy = heavy;
}

export function explode(pos: Vector3, power = 1) {
  const e = fx.blasts[blastCursor++ % fx.blasts.length];
  e.pos.copy(pos);
  e.power = power;
  e.life = 1;
  const n = Math.round(4 + power * 18);
  for (let i = 0; i < n; i++) {
    const s = fx.shards[shardCursor++ % fx.shards.length];
    s.pos.copy(pos);
    s.vel.set((Math.random() - 0.5) * 18, 4 + Math.random() * 14, (Math.random() - 0.5) * 18).multiplyScalar(0.5 + power * 0.6);
    s.life = 1.2 + Math.random() * 1.2;
    s.spin = Math.random() * 10;
  }
  // Camera shake falls off with distance from the hero.
  rt.shake = Math.max(rt.shake, power * 0.8 * Math.max(0, 1 - pos.distanceTo(rt.pos) / 80));
}

/** Throws Captain America's shield toward a point. */
export function throwShield(from: Vector3, toward: Vector3) {
  const s = fx.shield;
  if (s.state !== "held") return false;
  s.state = "out";
  s.pos.copy(from);
  s.target.copy(toward);
  s.vel.subVectors(toward, from).normalize().multiplyScalar(62);
  s.hits = 0;
  s.visited.clear();
  s.t = 0;
  return true;
}

const tmp = new Vector3();

export function stepFx(dt: number) {
  for (const b of fx.beams) b.life = Math.max(0, b.life - dt);
  for (const e of fx.blasts) e.life = Math.max(0, e.life - dt * 1.4);
  for (const s of fx.shards) {
    if (s.life <= 0) continue;
    s.life -= dt;
    s.vel.y -= 26 * dt;
    s.pos.addScaledVector(s.vel, dt);
    const floor = surfaceBelow(s.pos.x, s.pos.z, s.pos.y + 0.2);
    if (s.pos.y < floor) {
      s.pos.y = floor;
      s.vel.multiplyScalar(0.4);
      s.vel.y = Math.abs(s.vel.y) * 0.3;
    }
  }
  stepShield(dt);
}

/** The shield flies to its target, ricochets to up to three nearby cars, then returns to the hand. */
function stepShield(dt: number) {
  const s = fx.shield;
  if (s.state === "held") return;
  s.t += dt;
  if (s.state === "out") {
    s.pos.addScaledVector(s.vel, dt);
    const hits = hitCars(s.pos, 2.2, 18);
    const wall = collide(s.pos.x, s.pos.y - 0.2, s.pos.z, 0.3, 0.4).hit || s.pos.y < 0.2;
    const arrived = s.pos.distanceTo(s.target) < 2;
    if (hits.length || wall || arrived || s.t > 2.2) {
      if (hits.length) explode(hits[0], 0.8);
      else if (wall || arrived) explode(s.pos, 0.25);
      // Ricochet to the next car in range, otherwise come home.
      const next = s.hits < 3 ? nearestCar(s.pos, 38, s.visited, ["drive", "parked"]) : -1;
      if (next >= 0) {
        s.visited.add(next);
        s.hits++;
        const c = cars[next];
        s.target.set(c.x, c.y + 0.8, c.z);
        s.vel.subVectors(s.target, s.pos).normalize().multiplyScalar(66);
        s.t = 0;
      } else s.state = "return";
    }
  } else {
    tmp.subVectors(body.ready ? body.rightHand : rt.pos, s.pos);
    const d = tmp.length();
    s.vel.lerp(tmp.normalize().multiplyScalar(70), Math.min(1, dt * 6));
    s.pos.addScaledVector(s.vel, dt);
    if (d < 1.4 || s.t > 4) s.state = "held";
  }
}
