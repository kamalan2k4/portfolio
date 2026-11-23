// Ported from csbros-companion (same author); drives Mixamo-style skeletons procedurally.
import { normalize, type Vec3 } from "./math";

export type PoseWeights = { flight: number; brake: number; talk: number; cheer: number; hipsHands: number; wave: number; crouch: number };

/**
 * Limb targets for a humanoid, as directions in the character's own space
 * (Y up, facing +Z, the character's left on +X). Directions, not joint angles,
 * so they work for any rig whose bones point along the limb, and blending two
 * poses never twists a joint the wrong way.
 */

export interface ArmTarget {
  /** Shoulder to elbow. */
  upper: Vec3;
  /** Elbow to wrist. */
  fore: Vec3;
  /** Wrist to knuckles. */
  fingers: Vec3;
  /** Out of the palm: the direction a palm repulsor fires. */
  palm: Vec3;
}

export interface LegTarget {
  thigh: Vec3;
  shin: Vec3;
  /** Heel to toe. */
  toe: Vec3;
  /** Out of the sole, when the foot's roll matters (soles pressed together). */
  sole?: Vec3;
}

/** How far each finger curls into the palm, 0 (straight) to 1 (fist). */
export interface HandShape {
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
}

export interface BodyTargets {
  leftArm: ArmTarget;
  rightArm: ArmTarget;
  leftLeg: LegTarget;
  rightLeg: LegTarget;
  /** Forward lean of the spine (radians, positive leans towards the viewer). */
  lean: number;
  /** Finger curls, for rigs with finger bones. */
  hands?: { left: HandShape; right: HandShape };
}

/** Mirror a direction from the character's left side to the right. */
export const mirror = ([x, y, z]: Vec3): Vec3 => [-x, y, z];
export const mirrorArm = (arm: ArmTarget): ArmTarget => ({
  upper: mirror(arm.upper),
  fore: mirror(arm.fore),
  fingers: mirror(arm.fingers),
  palm: mirror(arm.palm),
});
export const mirrorLeg = (leg: LegTarget): LegTarget => ({
  thigh: mirror(leg.thigh),
  shin: mirror(leg.shin),
  toe: mirror(leg.toe),
  ...(leg.sole ? { sole: mirror(leg.sole) } : {}),
});

// Poses are written for the character's LEFT side; the right side mirrors them
// unless a gesture is one-handed.

/** Arms down and a little out, hands bent so the palms push down: the hover. */
const HOVER_ARM: ArmTarget = { upper: [0.3, -0.95, 0.02], fore: [0.26, -0.95, 0.12], fingers: [0.55, -0.6, 0.15], palm: [0.15, -0.95, -0.2] };
/** Legs straight and slightly apart, feet flat so the soles fire downwards. */
const HOVER_LEG: LegTarget = { thigh: [0.07, -1, 0.02], shin: [0.05, -1, -0.05], toe: [0, -0.3, 0.95] };

/** Flying head first: arms along the body, palms facing the feet to push forwards. */
const FLIGHT_ARM: ArmTarget = { upper: [0.2, -0.97, -0.1], fore: [0.15, -0.97, -0.15], fingers: [0.1, -0.3, -0.95], palm: [0, -0.97, 0.25] };
const FLIGHT_LEG: LegTarget = { thigh: [0.04, -1, -0.04], shin: [0.03, -1, -0.08], toe: [0, -0.35, 0.94] };

/** Braking: arms thrust forwards, palms out against the motion, knees up a little. */
const BRAKE_ARM: ArmTarget = { upper: [0.33, -0.55, 0.77], fore: [0.3, -0.25, 0.92], fingers: [0.2, 0.65, 0.73], palm: [0, 0.2, 1] };
const BRAKE_LEG: LegTarget = { thigh: [0.08, -0.9, 0.42], shin: [0.05, -0.97, -0.15], toe: [0, -0.3, 0.95] };

/** Talking: the right hand comes up, palm open towards the user. */
const TALK_RIGHT: ArmTarget = { upper: [-0.38, -0.78, 0.5], fore: [-0.2, 0.08, 0.97], fingers: [-0.12, 0.25, 0.96], palm: [0.15, 0.95, 0.2] };

/** Acknowledgement: right palm raised to the user (the repulsor salute). */
const CHEER_RIGHT: ArmTarget = { upper: [-0.35, -0.35, 0.87], fore: [-0.15, 0.55, 0.82], fingers: [-0.05, 0.97, 0.2], palm: [0, 0.1, 1] };

/** Amused disbelief: hands on hips, elbows out. */
const HIPS_ARM: ArmTarget = { upper: [0.72, -0.66, -0.18], fore: [-0.42, -0.8, 0.3], fingers: [-0.55, -0.7, 0.35], palm: [-0.85, 0.1, 0.2] };

/** A dismissive flick of the right hand. */
const WAVE_RIGHT: ArmTarget = { upper: [-0.6, -0.35, 0.55], fore: [-0.55, 0.6, 0.5], fingers: [-0.4, 0.85, 0.3], palm: [0, 0, 1] };

/** Take-off wind-up: knees bent, arms down and back, palms down. */
const CROUCH_ARM: ArmTarget = { upper: [0.32, -0.9, -0.28], fore: [0.3, -0.85, -0.4], fingers: [0.3, -0.4, -0.85], palm: [0, -0.95, 0.25] };
const CROUCH_LEG: LegTarget = { thigh: [0.08, -0.8, 0.6], shin: [0.05, -0.9, -0.45], toe: [0, -0.3, 0.95] };

export type Weighted<T> = Array<[T, number]>;

function blendVectors(items: Array<[Vec3, number]>, base: Vec3): Vec3 {
  let total = 0;
  const sum: Vec3 = [0, 0, 0];
  for (const [vector, weight] of items) {
    if (weight <= 0) continue;
    const v = normalize(vector);
    sum[0] += v[0] * weight;
    sum[1] += v[1] * weight;
    sum[2] += v[2] * weight;
    total += weight;
  }
  const rest = Math.max(0, 1 - total);
  const b = normalize(base);
  return normalize([sum[0] + b[0] * rest, sum[1] + b[1] * rest, sum[2] + b[2] * rest]);
}

export function blendArm(items: Weighted<ArmTarget>, base: ArmTarget): ArmTarget {
  const pick = (key: keyof ArmTarget) =>
    blendVectors(
      items.map(([arm, w]) => [arm[key], w]),
      base[key],
    );
  return { upper: pick("upper"), fore: pick("fore"), fingers: pick("fingers"), palm: pick("palm") };
}

export function blendLeg(items: Weighted<LegTarget>, base: LegTarget): LegTarget {
  const pick = (key: "thigh" | "shin" | "toe") =>
    blendVectors(
      items.map(([leg, w]) => [leg[key], w]),
      base[key],
    );
  return { thigh: pick("thigh"), shin: pick("shin"), toe: pick("toe") };
}

/** Blends the named poses into limb targets. `clock` drives small living motions. */
export function bodyTargets(weights: PoseWeights, clock: number): BodyTargets {
  const { flight, brake, talk, cheer, hipsHands, wave, crouch } = weights;
  // Tiny independent arm corrections so the hover never freezes.
  const drift = (k: number): Vec3 => [0.03 * Math.sin(clock * 0.8 + k), 0, 0.04 * Math.sin(clock * 0.6 + k * 1.7)];
  const hoverLeft: ArmTarget = { ...HOVER_ARM, fore: normalize(addVec(HOVER_ARM.fore, drift(0))) };
  const hoverRight: ArmTarget = mirrorArm({ ...HOVER_ARM, fore: normalize(addVec(HOVER_ARM.fore, drift(2))) });

  const waveFlick: ArmTarget = { ...WAVE_RIGHT, fore: normalize(addVec(WAVE_RIGHT.fore, [0.28 * Math.sin(clock * 11), 0, 0])) };

  const leftArm = blendArm(
    [
      [FLIGHT_ARM, flight],
      [BRAKE_ARM, brake],
      [HIPS_ARM, hipsHands],
      [CROUCH_ARM, crouch],
    ],
    hoverLeft,
  );
  const rightArm = blendArm(
    [
      [mirrorArm(FLIGHT_ARM), flight],
      [mirrorArm(BRAKE_ARM), brake],
      [mirrorArm(HIPS_ARM), hipsHands],
      [mirrorArm(CROUCH_ARM), crouch],
      [TALK_RIGHT, talk],
      [CHEER_RIGHT, cheer],
      [waveFlick, wave],
    ],
    hoverRight,
  );
  const legItems = (mirrored: boolean): Weighted<LegTarget> =>
    (
      [
        [FLIGHT_LEG, flight],
        [BRAKE_LEG, brake],
        [CROUCH_LEG, crouch],
      ] as Weighted<LegTarget>
    ).map(([leg, w]) => [mirrored ? mirrorLeg(leg) : leg, w]);

  return {
    leftArm,
    rightArm,
    leftLeg: blendLeg(legItems(false), HOVER_LEG),
    rightLeg: blendLeg(legItems(true), mirrorLeg(HOVER_LEG)),
    lean: -0.12 * brake + 0.16 * crouch + 0.03 * talk - 0.04 * hipsHands,
  };
}

function addVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
