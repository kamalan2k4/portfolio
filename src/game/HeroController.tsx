import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type PerspectiveCamera, Vector3 } from "three";
import type { DistrictId } from "@/content/types";
import { useWorld } from "@/world/store";
import { player } from "@/world/input";
import { cityPlacement } from "./city/CityDistricts";
import { collide, ISLAND, onIsland, raycastBuildings, SKY_LIMIT, surfaceBelow } from "./city/layout";
import { beam, body, explode, fx, stepFx, throwShield } from "./fx";
import type { HeroId } from "./heroes";
import { attachDesktopInput, pad, takeTap } from "./input";
import { rt, useGame } from "./state";
import { cars, heading, hitCars, hitCarsAlong, nearestCar, stepCars } from "./vehicles";
import { destinations } from "@/content/destinations";

const UP = new Vector3(0, 1, 0);
const v1 = new Vector3();
const v2 = new Vector3();
const camF = new Vector3();
const camR = new Vector3();
const look = new Vector3();
const camPos = new Vector3();
const target = new Vector3();

const G = 30;
const RADIUS = 0.45;
const HEIGHT = 1.8;

type Stats = { run: number; sprint: number; jump: number };
const STATS: Record<HeroId, Stats> = {
  spiderman: { run: 11, sprint: 21, jump: 15 },
  ironman: { run: 6, sprint: 10, jump: 8 },
  cap: { run: 9.5, sprint: 19, jump: 13 },
};

const randomStunt = (dur = 0.7) => {
  rt.stunt.kind = Math.floor(Math.random() * 4);
  rt.stunt.t = 0;
  rt.stunt.dur = dur;
};

/** Finds a web anchor on a building ahead of and above the hero. */
function findAnchor(out: Vector3) {
  const origin = v1.copy(rt.pos).addScaledVector(UP, 1.5);
  for (const side of [0, 0.45, -0.45, 0.9, -0.9]) {
    const yaw = rt.camYaw + side;
    const d = v2.set(-Math.sin(yaw), 1.15, -Math.cos(yaw)).normalize();
    const hit = raycastBuildings(origin.x, origin.y, origin.z, d.x, d.y, d.z, 85);
    if (hit && hit.normal[1] < 0.5 && hit.point[1] > rt.pos.y + 5) {
      out.set(...hit.point);
      return true;
    }
  }
  // Open sky: anchor high ahead anyway, so swinging never dead-ends (it's a game).
  if (rt.pos.y < 140) {
    out.copy(rt.pos).add(v2.set(-Math.sin(rt.camYaw) * 20, 28, -Math.cos(rt.camYaw) * 20));
    return true;
  }
  return false;
}

function land(impact: number) {
  rt.grounded = true;
  rt.jumps = 0;
  if (rt.mode !== "drive") rt.mode = "ground";
  if (impact > 20) {
    rt.landing = 1;
    rt.shake = Math.max(rt.shake, Math.min(1, impact / 40));
    if (impact > 32) explode(v1.copy(rt.pos).setY(rt.pos.y + 0.1), 0.35);
  }
}

/** Moves the hero with collision against towers, plazas and landmarks. */
function moveAndCollide(dt: number, hero: HeroId) {
  rt.pos.addScaledVector(rt.vel, dt);
  const c = collide(rt.pos.x, rt.pos.y, rt.pos.z, RADIUS, HEIGHT);
  if (c.hit) {
    rt.pos.x = c.x;
    rt.pos.z = c.z;
    const into = rt.vel.x * c.nx + rt.vel.z * c.nz;
    if (into < 0) {
      if (hero === "ironman" && rt.mode === "fly" && -into > 22) explode(v1.copy(rt.pos).addScaledVector(UP, 1), Math.min(1.2, -into / 40));
      rt.vel.x -= c.nx * into;
      rt.vel.z -= c.nz * into;
    }
    // Spider-Man sticks to walls he hits in the air (or runs into while sprinting).
    if (hero === "spiderman" && (rt.mode === "air" || rt.mode === "swing" || rt.mode === "zip" || (rt.mode === "ground" && pad.sprint && pad.move.y > 0))) {
      rt.mode = "wall";
      rt.wallNormal.set(c.nx, 0, c.nz);
      rt.vel.set(0, 0, 0);
      rt.yaw = Math.atan2(c.nx, c.nz);
    }
  }
  const floor = surfaceBelow(rt.pos.x, rt.pos.z, rt.pos.y);
  if (rt.pos.y <= floor) {
    const impact = -rt.vel.y;
    rt.pos.y = floor;
    if (rt.vel.y < 0) rt.vel.y = 0;
    if (rt.mode !== "fly" || pad.down || rt.vel.length() < 6) land(impact);
  } else if (rt.pos.y > floor + 0.05 && rt.mode === "ground") {
    rt.mode = "air";
    rt.grounded = false;
  }
  // Ground heroes stay on the island; flyers stay in the sky dome.
  if (rt.mode !== "fly" && !onIsland(rt.pos.x, rt.pos.z)) {
    rt.pos.x = Math.max(-ISLAND + 1.2, Math.min(ISLAND - 1.2, rt.pos.x));
    rt.pos.z = Math.max(-ISLAND + 1.2, Math.min(ISLAND - 1.2, rt.pos.z));
  }
  const r = Math.hypot(rt.pos.x, rt.pos.z);
  if (r > SKY_LIMIT) rt.pos.multiplyScalar(SKY_LIMIT / r);
  rt.pos.y = Math.min(rt.pos.y, 420);
}

/** Desired horizontal velocity from the stick, relative to the camera. */
function wish(speed: number, out: Vector3) {
  out.set(0, 0, 0).addScaledVector(camF, pad.move.y).addScaledVector(camR, pad.move.x);
  const l = out.length();
  if (l > 1) out.divideScalar(l);
  return out.multiplyScalar(speed);
}

function faceToward(dx: number, dz: number, rate: number, dt: number) {
  if (dx * dx + dz * dz < 1e-4) return;
  const goal = Math.atan2(-dx, -dz);
  const diff = Math.atan2(Math.sin(goal - rt.yaw), Math.cos(goal - rt.yaw));
  rt.yaw += diff * Math.min(1, rate * dt);
}

function onFootStep(dt: number, hero: HeroId) {
  const s = STATS[hero];
  const speed = pad.sprint ? s.sprint : s.run;
  const w = wish(speed, v1);
  const accel = rt.mode === "ground" ? 14 : 3;
  rt.vel.x += (w.x - rt.vel.x) * Math.min(1, accel * dt);
  rt.vel.z += (w.z - rt.vel.z) * Math.min(1, accel * dt);
  if (w.lengthSq() > 0.01) faceToward(w.x, w.z, rt.mode === "ground" ? 12 : 5, dt);
  rt.vel.y -= G * dt;
  if (takeTap("jump")) {
    if (rt.mode === "ground") {
      rt.vel.y = s.jump * (pad.sprint ? 1.12 : 1);
      rt.mode = "air";
      rt.grounded = false;
      rt.jumps = 1;
      if (hero === "ironman") {
        // Iron Man takes off instead of jumping.
        rt.mode = "fly";
        rt.vel.y = 12;
      }
    } else if (hero === "cap" && rt.jumps < 2) {
      rt.vel.y = s.jump * 0.9;
      rt.jumps = 2;
      randomStunt(0.6);
    } else if (hero === "ironman") {
      rt.mode = "fly";
    }
  }
}

function swingStep(dt: number) {
  rt.vel.y -= G * dt;
  rt.vel.addScaledVector(wish(16, v1), dt);
  rt.vel.multiplyScalar(1 - 0.05 * dt);
  rt.ropeLength = Math.max(7, rt.ropeLength - 2.5 * dt);
  faceToward(rt.vel.x, rt.vel.z, 6, dt);
  // Rope constraint (applied after integration in the caller).
  if (!pad.jumpHeld || rt.pos.y > rt.anchor.y - 1.5) {
    // Release: carry the momentum, add a lift, throw a trick.
    rt.mode = "air";
    rt.vel.y = Math.max(rt.vel.y, 0) + 7;
    rt.vel.multiplyScalar(1.08);
    randomStunt();
  }
}

function constrainRope() {
  v1.subVectors(rt.pos, rt.anchor);
  const len = v1.length();
  if (len > rt.ropeLength) {
    v1.divideScalar(len);
    rt.pos.copy(rt.anchor).addScaledVector(v1, rt.ropeLength);
    const radial = rt.vel.dot(v1);
    if (radial > 0) rt.vel.addScaledVector(v1, -radial);
  }
}

function flyStep(dt: number) {
  const boost = pad.sprint;
  const speed = boost ? 78 : 26;
  // Fly where the camera looks; strafe and climb on top.
  v1.set(0, 0, 0).addScaledVector(look, pad.move.y).addScaledVector(camR, pad.move.x * 0.8);
  v1.y += (pad.up ? 1 : 0) - (pad.down ? 1 : 0);
  if (v1.lengthSq() > 1) v1.normalize();
  v1.multiplyScalar(speed);
  const rate = boost ? 1.6 : 2.6;
  rt.vel.lerp(v1, Math.min(1, rate * dt));
  // Gentle hover bob when idle.
  if (v1.lengthSq() < 0.01) rt.vel.y += Math.sin(rt.clock * 2) * 0.15 * dt;
  if (Math.hypot(rt.vel.x, rt.vel.z) > 3) faceToward(rt.vel.x, rt.vel.z, 4, dt);
  else faceToward(-Math.sin(rt.camYaw), -Math.cos(rt.camYaw), 4, dt);
  // Ram: anything destructible in the way breaks, harder the faster he goes.
  const sp = rt.vel.length();
  if (sp > 25) {
    for (const p of hitCars(v2.copy(rt.pos).addScaledVector(UP, 1), 2.6, sp * 0.8)) explode(p, Math.min(1.5, sp / 50));
  }
  // Land by descending onto a surface.
  if (pad.down && rt.pos.y - surfaceBelow(rt.pos.x, rt.pos.z, rt.pos.y) < 0.4) land(-rt.vel.y);
}

function wallStep(dt: number) {
  const n = rt.wallNormal;
  // Climb with forward, shimmy sideways along the wall.
  const side = v1.set(n.z, 0, -n.x);
  rt.vel.set(0, pad.move.y * 9 * (pad.sprint ? 1.6 : 1), 0).addScaledVector(side, -pad.move.x * 6);
  rt.pos.addScaledVector(rt.vel, dt);
  // Stay pressed to the wall; if there is no wall any more, we reached the roof edge.
  rt.pos.addScaledVector(n, -0.08);
  const c = collide(rt.pos.x, rt.pos.y, rt.pos.z, RADIUS, HEIGHT);
  if (c.hit) {
    rt.pos.x = c.x;
    rt.pos.z = c.z;
  } else {
    rt.mode = "air";
    rt.vel.copy(n).multiplyScalar(-4).setY(9);
    randomStunt(0.6);
  }
  if (takeTap("jump")) {
    rt.mode = "air";
    rt.vel.copy(n).multiplyScalar(11).setY(11);
    rt.yaw = Math.atan2(-n.x, -n.z) + Math.PI;
    randomStunt();
  }
  const floor = surfaceBelow(rt.pos.x, rt.pos.z, rt.pos.y);
  if (rt.pos.y <= floor && pad.move.y < 0) {
    rt.pos.y = floor;
    land(0);
  }
}

function zipStep(dt: number) {
  v1.subVectors(rt.zipTarget, rt.pos);
  const d = v1.length();
  rt.vel.copy(v1.divideScalar(Math.max(d, 1e-3))).multiplyScalar(58);
  faceToward(rt.vel.x, rt.vel.z, 10, dt);
  if (d < 2.2) {
    // Vault off the point.
    rt.mode = "air";
    rt.vel.multiplyScalar(0.25).setY(11);
    randomStunt();
  }
}

/** Point under the reticle (centre of the screen). */
function updateAim(camera: PerspectiveCamera) {
  camera.getWorldDirection(rt.aim);
  const hit = raycastBuildings(camera.position.x, camera.position.y, camera.position.z, rt.aim.x, rt.aim.y, rt.aim.z, 260);
  if (hit) rt.aimPoint.set(...hit.point);
  else rt.aimPoint.copy(camera.position).addScaledVector(rt.aim, 260);
}

function attack(hero: HeroId, heavy: boolean) {
  if (hero === "ironman") {
    const from = heavy ? v1.copy(body.chest) : v1.copy(body.rightHand);
    if (!body.ready) from.copy(rt.pos).addScaledVector(UP, 1.4);
    beam(from, rt.aimPoint, heavy);
    // Beams punch through every car along their path.
    for (const p of hitCarsAlong(from, rt.aimPoint, heavy ? 3.5 : 1.8, heavy ? 30 : 16)) explode(p, heavy ? 1.4 : 0.9);
    // Surface impacts are sparks; cars get the big blasts (above).
    explode(v2.copy(rt.aimPoint), heavy ? 0.45 : 0.15);
    rt.attackT = 0;
    rt.attackKind = heavy ? 1 : 0;
    if (heavy) rt.shake = Math.max(rt.shake, 0.6);
  } else if (hero === "cap") {
    if (heavy) {
      // Shield charge.
      v1.set(-Math.sin(rt.yaw), 0, -Math.cos(rt.yaw)).multiplyScalar(34);
      rt.vel.x = v1.x;
      rt.vel.z = v1.z;
      for (const p of hitCars(v2.copy(rt.pos).addScaledVector(v1, 0.08).setY(rt.pos.y + 1), 3, 26)) explode(p, 1);
    } else if (throwShield(body.ready ? body.rightHand : v1.copy(rt.pos).setY(rt.pos.y + 1.4), rt.aimPoint)) {
      rt.attackT = 0;
      rt.attackKind = 0;
      faceToward(rt.aimPoint.x - rt.pos.x, rt.aimPoint.z - rt.pos.z, 100, 1);
    }
  } else if (hero === "spiderman" && rt.aimPoint.distanceTo(rt.pos) > 4) {
    rt.mode = "zip";
    rt.zipTarget.copy(rt.aimPoint).addScaledVector(rt.aim, -1.2);
    rt.grounded = false;
  }
}

/** Gameplay loop: input → hero physics/abilities → cars/effects → cinematic camera. */
export function HeroController() {
  const gl = useThree((s) => s.gl);
  const nearCarRef = useRef(false);
  const fireCooldown = useRef(0);

  useEffect(() => attachDesktopInput(gl.domElement, () => useGame.getState().phase === "play" && useWorld.getState().overlay === "none"), [gl]);
  useEffect(() => {
    const onLock = () => useGame.getState().set({ locked: document.pointerLockElement === gl.domElement });
    document.addEventListener("pointerlockchange", onLock);
    return () => document.removeEventListener("pointerlockchange", onLock);
  }, [gl]);

  useFrame((state, rawDt) => {
    const game = useGame.getState();
    const camera = state.camera as PerspectiveCamera;
    const playing = game.phase === "play" && useWorld.getState().overlay === "none";
    if (takeTap("slowmo")) game.toggleSlowmo();
    rt.timeScale += ((game.slowmo ? 0.28 : 1) - rt.timeScale) * Math.min(1, rawDt * 6);
    const dt = Math.min(rawDt, 0.05) * rt.timeScale;
    rt.clock += dt;
    const hero = game.hero;

    // --- look ---
    const sens = 0.0026;
    rt.camYaw -= pad.look.x * sens;
    rt.camPitch = Math.max(-1.25, Math.min(0.9, rt.camPitch - pad.look.y * sens));
    const looked = pad.look.x !== 0 || pad.look.y !== 0;
    pad.look.x = pad.look.y = 0;
    rt.lookIdle = looked ? 0 : rt.lookIdle + rawDt;
    camF.set(-Math.sin(rt.camYaw), 0, -Math.cos(rt.camYaw));
    camR.set(-camF.z, 0, camF.x);
    look.set(-Math.sin(rt.camYaw) * Math.cos(rt.camPitch), Math.sin(rt.camPitch), -Math.cos(rt.camYaw) * Math.cos(rt.camPitch));

    if (playing) {
      // --- vehicles: enter / leave ---
      const near = rt.mode !== "drive" ? nearestCar(rt.pos, 9) : -1;
      if ((near >= 0) !== nearCarRef.current) {
        nearCarRef.current = near >= 0;
        game.set({ nearCar: near >= 0 });
      }
      if (takeTap("car")) {
        if (rt.mode === "drive" && rt.car >= 0) {
          const c = cars[rt.car];
          c.state = "parked";
          c.speed = 0;
          rt.mode = "ground";
          rt.car = -1;
          heading(c.yaw + Math.PI / 2, v1);
          rt.pos.set(c.x + v1.x * 2, c.y, c.z + v1.z * 2);
          rt.vel.set(0, 0, 0);
        } else if (near >= 0) {
          rt.car = near;
          cars[near].state = "player";
          rt.mode = "drive";
          rt.camYaw = cars[near].yaw;
        }
      }

      // --- abilities ---
      fireCooldown.current -= dt;
      const autoFire = hero === "ironman" && pad.fireHeld && fireCooldown.current <= 0;
      if (rt.mode !== "drive") {
        if (takeTap("fire") || autoFire) {
          attack(hero, false);
          fireCooldown.current = 0.16;
        }
        if (takeTap("alt")) attack(hero, true);
      } else {
        takeTap("fire");
        takeTap("alt");
      }
      rt.attackT += dt;

      // --- movement ---
      switch (rt.mode) {
        case "ground":
        case "air":
          onFootStep(dt, hero);
          if (hero === "spiderman" && rt.mode === "air" && pad.jumpHeld && rt.vel.y < 4 && findAnchor(rt.anchor)) {
            rt.mode = "swing";
            rt.ropeLength = rt.pos.distanceTo(rt.anchor) * 0.92;
          }
          moveAndCollide(dt, hero);
          break;
        case "swing":
          swingStep(dt);
          moveAndCollide(dt, hero);
          if (rt.mode === "swing") constrainRope();
          break;
        case "zip":
          zipStep(dt);
          moveAndCollide(dt, hero);
          break;
        case "wall":
          wallStep(dt);
          break;
        case "fly":
          flyStep(dt);
          moveAndCollide(dt, hero);
          break;
        case "drive": {
          const c = cars[rt.car];
          if (c) {
            rt.pos.set(c.x, c.y, c.z);
            rt.yaw = c.yaw;
            rt.vel.copy(heading(c.yaw, v1)).multiplyScalar(c.speed);
          }
          break;
        }
      }
      if (takeTap("interact")) {
        const n = game.nearby;
        if (n) useWorld.getState().openPanel(n);
      }
    } else {
      // Keep taps from piling up while paused.
      takeTap("jump");
      takeTap("fire");
      takeTap("alt");
      takeTap("car");
      takeTap("interact");
    }

    rt.stunt.t = Math.min(1, rt.stunt.t + dt / rt.stunt.dur);
    rt.landing = Math.max(0, rt.landing - dt * 1.6);
    fx.web.on = rt.mode === "swing" || rt.mode === "zip";
    fx.web.to.copy(rt.mode === "swing" ? rt.anchor : rt.zipTarget);
    stepCars(dt, rt.pos, rt.mode === "drive" && playing ? { throttle: pad.move.y, steer: pad.move.x, brake: pad.jumpHeld } : null, (p, power) => explode(p, power));
    stepFx(dt);
    rt.speed = rt.vel.length();

    // Share position with the portfolio HUD (labels, map, district loading).
    player.x = rt.pos.x;
    player.z = rt.pos.z;
    player.yaw = rt.yaw;

    // --- nearby district (E to open) ---
    let nearby: DistrictId | null = null;
    for (const d of destinations) {
      const [x, z] = cityPlacement(d.id).position;
      if (Math.abs(rt.pos.x - x) < 20 && Math.abs(rt.pos.z - z) < 20 && rt.pos.y < 30) nearby = d.id;
    }
    if (nearby !== game.nearby) game.set({ nearby });
    if (rt.mode !== game.mode) game.set({ mode: rt.mode });

    // --- cinematic camera ---
    updateCamera(camera, rawDt, game.phase, hero);
    if (playing) updateAim(camera);
  });

  return null;
}

const camState = { pos: new Vector3(0, 6, 190), fov: 62, roll: 0, orbit: 0 };

function updateCamera(camera: PerspectiveCamera, dt: number, phase: string, hero: HeroId) {
  const speed = rt.vel.length();
  if (phase !== "play") {
    // Showcase / intro: slow orbit around the hero, low and heroic.
    camState.orbit += dt * (phase === "intro" ? 0.55 : 0.25);
    const r = phase === "intro" ? 4.2 + camState.orbit * 0.25 : 4.6;
    target.copy(rt.pos).addScaledVector(UP, 1.15);
    camPos.set(rt.pos.x + Math.sin(rt.yaw + Math.PI + camState.orbit) * r, rt.pos.y + 1.1 + Math.sin(camState.orbit * 0.6) * 0.3, rt.pos.z + Math.cos(rt.yaw + Math.PI + camState.orbit) * r);
    camState.pos.lerp(camPos, 1 - Math.exp(-dt * 3));
    camera.position.copy(camState.pos);
    camera.lookAt(target);
    camera.fov += (50 - camera.fov) * Math.min(1, dt * 2);
    camera.updateProjectionMatrix();
    return;
  }
  camState.orbit = 0;
  // Auto-follow behind the direction of travel when the player isn't steering the camera.
  const moving = Math.hypot(rt.vel.x, rt.vel.z) > 6;
  if (rt.lookIdle > 1.2 && moving && (rt.mode === "swing" || rt.mode === "fly" || rt.mode === "drive" || rt.mode === "zip")) {
    const goal = Math.atan2(-rt.vel.x, -rt.vel.z);
    const diff = Math.atan2(Math.sin(goal - rt.camYaw), Math.cos(goal - rt.camYaw));
    rt.camYaw += diff * Math.min(1, dt * 1.5);
  }
  const dist = rt.mode === "drive" ? 8.5 : rt.mode === "fly" ? 6 + Math.min(6, speed * 0.06) : rt.mode === "swing" ? 7 : rt.mode === "wall" ? 6 : pad.sprint ? 5.2 : 4.4;
  const shoulder = rt.mode === "fly" && speed > 30 ? 0 : rt.mode === "drive" ? 0 : 0.6;
  target.copy(rt.pos).addScaledVector(UP, rt.mode === "drive" ? 1.6 : 1.55);
  camR.set(Math.cos(rt.camYaw), 0, -Math.sin(rt.camYaw));
  target.addScaledVector(camR, shoulder);
  look.set(-Math.sin(rt.camYaw) * Math.cos(rt.camPitch), Math.sin(rt.camPitch), -Math.cos(rt.camYaw) * Math.cos(rt.camPitch));
  camPos.copy(target).addScaledVector(look, -dist);
  // Keep the camera out of walls.
  v1.subVectors(camPos, target);
  const len = v1.length();
  v1.divideScalar(len);
  const hit = raycastBuildings(target.x, target.y, target.z, v1.x, v1.y, v1.z, len);
  if (hit) camPos.copy(target).addScaledVector(v1, Math.max(0.6, hit.dist - 0.3));
  camPos.y = Math.max(camPos.y, surfaceBelow(camPos.x, camPos.z, camPos.y) + 0.3);
  camState.pos.lerp(camPos, 1 - Math.exp(-dt * (rt.mode === "fly" ? 9 : 14)));
  camera.position.copy(camState.pos);
  // Shake from impacts and landings.
  if (rt.shake > 0) {
    const s = rt.shake * 0.35;
    camera.position.x += (Math.random() - 0.5) * s;
    camera.position.y += (Math.random() - 0.5) * s;
    camera.position.z += (Math.random() - 0.5) * s;
    rt.shake = Math.max(0, rt.shake - dt * 1.8);
  }
  camera.lookAt(v2.copy(target).addScaledVector(look, 10));
  // Dutch tilt while swinging; speed widens the lens.
  const lateral = rt.vel.x * Math.cos(rt.camYaw) - rt.vel.z * Math.sin(rt.camYaw);
  const roll = rt.mode === "swing" ? Math.max(-0.25, Math.min(0.25, lateral * 0.012)) : rt.mode === "fly" ? Math.max(-0.15, Math.min(0.15, lateral * 0.004)) : 0;
  camState.roll += (roll - camState.roll) * Math.min(1, dt * 3);
  camera.rotateZ(camState.roll);
  const fov = (rt.timeScale < 0.9 ? 55 : 62) + Math.min(24, speed * (hero === "ironman" ? 0.3 : 0.45));
  camera.fov += (fov - camera.fov) * Math.min(1, dt * 3);
  camera.updateProjectionMatrix();
}
