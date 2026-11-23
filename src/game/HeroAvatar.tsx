import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { body, fx } from "./fx";
import type { HeroDef } from "./heroes";
import { toCharacterSpace, type Vec3 } from "./rig/math";
import { useHeroModel } from "./rig/model";
import { bodyTargets, type BodyTargets } from "./rig/posing";
import { aimArm, type SpiderPoseName, spiderTargets } from "./rig/spiderPoses";
import { rt } from "./state";

const damp = (c: number, t: number, rate: number, dt: number) => c + (t - c) * (1 - Math.exp(-rate * dt));

function dampVec(c: Vec3, t: Vec3, rate: number, dt: number): Vec3 {
  const k = 1 - Math.exp(-rate * dt);
  const o: Vec3 = [c[0] + (t[0] - c[0]) * k, c[1] + (t[1] - c[1]) * k, c[2] + (t[2] - c[2]) * k];
  const l = Math.hypot(o[0], o[1], o[2]) || 1;
  return [o[0] / l, o[1] / l, o[2] / l];
}

/** Eases every limb toward its target so poses blend instead of snapping. */
function dampTargets(c: BodyTargets | null, t: BodyTargets, dt: number, rate: number): BodyTargets {
  if (!c) return t;
  const arm = (a: BodyTargets["leftArm"], b: BodyTargets["leftArm"]) => ({ upper: dampVec(a.upper, b.upper, rate, dt), fore: dampVec(a.fore, b.fore, rate, dt), fingers: dampVec(a.fingers, b.fingers, rate, dt), palm: dampVec(a.palm, b.palm, rate, dt) });
  const leg = (a: BodyTargets["leftLeg"], b: BodyTargets["leftLeg"]) => ({ thigh: dampVec(a.thigh, b.thigh, rate, dt), shin: dampVec(a.shin, b.shin, rate, dt), toe: dampVec(a.toe, b.toe, rate, dt), sole: b.sole });
  return { leftArm: arm(c.leftArm, t.leftArm), rightArm: arm(c.rightArm, t.rightArm), leftLeg: leg(c.leftLeg, t.leftLeg), rightLeg: leg(c.rightLeg, t.rightLeg), lean: damp(c.lean, t.lean, rate, dt), hands: t.hands };
}

const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

/** The selected hero's rigged model, posed procedurally from the gameplay state every frame. */
export function HeroAvatar({ hero }: { hero: HeroDef }) {
  const model = useHeroModel(hero);
  const root = useRef<Group>(null);
  const pivot = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const pose = useRef<BodyTargets | null>(null);
  const gait = useRef(0);
  const flight = useRef({ pitch: 0, roll: 0, lastYaw: rt.yaw });

  useFrame(({ clock }, rawDt) => {
    if (!model || !root.current || !pivot.current || !tilt.current) return;
    const dt = Math.min(rawDt, 0.05) * rt.timeScale;
    // In a car the hero is inside it.
    root.current.visible = rt.mode !== "drive";
    root.current.position.copy(rt.pos);
    root.current.rotation.y = rt.yaw + Math.PI;
    pivot.current.position.y = model.feet * model.fit;

    const front: Vec3 = [-Math.sin(rt.yaw), 0, -Math.cos(rt.yaw)];
    const toChar = (x: number, y: number, z: number) => toCharacterSpace([x, y, z], [0, 1, 0], front);
    const hspeed = Math.hypot(rt.vel.x, rt.vel.z);
    const speed = rt.vel.length();

    let targets: BodyTargets;
    let rate = 10;
    let pitch = 0;
    let roll = 0;

    const shoulder = rt.pos.y + 1.5;
    if (hero.id === "ironman" && rt.mode === "fly") {
      const f = Math.min(1, Math.max(0, (speed - 5) / 22));
      const climbing = rt.vel.y / Math.max(1, speed);
      targets = bodyTargets({ flight: f, brake: 0, talk: 0, cheer: 0, hipsHands: 0, wave: 0, crouch: 0 }, clock.elapsedTime);
      if (rt.attackT < 0.35 && rt.attackKind === 0) {
        targets.rightArm = aimArm(toChar(rt.aimPoint.x - rt.pos.x, rt.aimPoint.y - shoulder, rt.aimPoint.z - rt.pos.z));
        rate = 18;
      }
      // Head-first at speed, nose following the climb; bank into turns.
      pitch = f * (1.35 - climbing * 0.9);
      const yawRate = Math.atan2(Math.sin(rt.yaw - flight.current.lastYaw), Math.cos(rt.yaw - flight.current.lastYaw)) / Math.max(dt, 1e-4);
      roll = Math.max(-0.9, Math.min(0.9, -yawRate * 0.18 * f));
    } else {
      const w: Partial<Record<SpiderPoseName, number>> = {};
      const input: Parameters<typeof spiderTargets>[0] = { weights: w, swingHand: "right" };
      if (rt.mode === "ground" || rt.mode === "drive") {
        const run = Math.min(1, hspeed / (hero.id === "ironman" ? 5 : 7));
        gait.current += (hspeed * dt) / (hero.id === "ironman" ? 1.8 : 2.6);
        input.phase = gait.current;
        if (run > 0.05) w.run = run;
        if (rt.landing > 0) {
          w.land = Math.min(1, rt.landing * 1.6);
          w.run = 0;
        }
      } else if (rt.mode === "swing") {
        w.swing = 1;
        input.aimRight = toChar(rt.anchor.x - rt.pos.x, rt.anchor.y - shoulder, rt.anchor.z - rt.pos.z);
        // Lean into the arc.
        pitch = Math.max(-0.6, Math.min(0.6, -rt.vel.y * 0.02));
        roll = Math.max(-0.5, Math.min(0.5, (rt.vel.x * Math.cos(rt.yaw) - rt.vel.z * Math.sin(rt.yaw)) * -0.02));
      } else if (rt.mode === "zip") {
        w.aimRight = 1;
        w.leap = 0.6;
        input.aimRight = toChar(rt.zipTarget.x - rt.pos.x, rt.zipTarget.y - shoulder, rt.zipTarget.z - rt.pos.z);
      } else if (rt.mode === "wall") {
        w.climb = 1;
        gait.current += (Math.abs(rt.vel.y) + hspeed) * dt * 0.45;
        input.phase = gait.current;
      } else {
        const flipping = rt.stunt.t < 1;
        if (flipping) w.tuck = 1;
        else w.leap = rt.vel.y < -6 ? 0.9 : 0.6;
        rate = flipping ? 16 : 10;
      }
      if (hero.costume === "cap" && rt.attackT < 0.5) {
        if (rt.attackT < 0.1) w.throwWind = 1;
        else w.throwRelease = 1 - (rt.attackT - 0.1) / 0.4;
      }
      if (hero.id === "ironman" && rt.attackT < 0.35) {
        w.aimRight = 1;
        input.aimRight = toChar(rt.aimPoint.x - rt.pos.x, rt.aimPoint.y - shoulder, rt.aimPoint.z - rt.pos.z);
      }
      targets = spiderTargets(input, clock.elapsedTime);
    }

    // Whole-body stunts around the pelvis.
    let sx = 0;
    let sy = 0;
    let sz = 0;
    if (rt.stunt.t < 1) {
      const e = easeInOut(rt.stunt.t) * Math.PI * 2;
      if (rt.stunt.kind === 0) sx = e;
      else if (rt.stunt.kind === 1) sx = -e;
      else if (rt.stunt.kind === 2) sy = e;
      else sz = e;
    }
    flight.current.pitch = damp(flight.current.pitch, pitch, 5, dt);
    flight.current.roll = damp(flight.current.roll, roll, 4, dt);
    flight.current.lastYaw = rt.yaw;
    tilt.current.rotation.set(flight.current.pitch + sx, sy, flight.current.roll + sz, "YXZ");

    pose.current = dampTargets(pose.current, targets, dt, rate);
    model.rig.apply(pose.current, { turn: 0, nod: hero.id === "ironman" && rt.mode === "fly" ? -flight.current.pitch * 0.5 : 0, tilt: 0 });

    // Publish hand/chest/thruster positions for effects.
    root.current.updateMatrixWorld(true);
    model.rig.worldPosition("RightHand", body.rightHand);
    model.rig.worldPosition("LeftHand", body.leftHand);
    model.rig.worldPosition("Spine2", body.chest);
    if (hero.id === "ironman") {
      const t = model.rig.thrusters();
      [t.leftHand, t.rightHand, t.leftFoot, t.rightFoot].forEach((a, i) => {
        body.thrusters[i].copy(a.position);
        body.thrustDirs[i].copy(a.direction);
      });
    }
    body.ready = true;
    fx.thrust = hero.id === "ironman" ? (rt.mode === "fly" ? 0.6 + Math.min(1.2, speed / 40) : 0) : 0;
  });

  if (!model) return null;
  const { fit, pelvis } = model;
  return (
    <group ref={root}>
      <group ref={pivot}>
        <group ref={tilt}>
          <group scale={fit} position={[-pelvis.x * fit, -pelvis.y * fit, -pelvis.z * fit]}>
            <primitive object={model.scene} dispose={null} />
          </group>
        </group>
      </group>
    </group>
  );
}
