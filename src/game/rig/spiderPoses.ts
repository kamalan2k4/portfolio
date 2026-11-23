// Ported from csbros-companion (same author); drives Mixamo-style skeletons procedurally.
import { blendArm, blendLeg, mirrorArm, mirrorLeg, type ArmTarget, type BodyTargets, type HandShape, type LegTarget, type Weighted } from "./posing";
import { add, dot, normalize, scale, sub, type Vec3 } from "./math";

/**
 * The web-slinger's body language, as limb directions in the character's own
 * space (Y up, facing +Z, its left on +X). Poses are blended by weight; any
 * limb a pose does not mention is left to the others. Directions, not joint
 * angles, so they suit any humanoid rig the solver can drive.
 */

export type SpiderPoseName =
  | "hang"
  | "wave"
  | "tuck"
  | "land"
  | "crouch"
  | "aimLeft"
  | "aimRight"
  | "pullRight"
  | "catchRight"
  | "holdRight"
  | "presentRight"
  | "talkLeft"
  | "shrug"
  | "throwWind"
  | "throwRelease"
  | "run"
  | "climb"
  | "swing"
  | "coil"
  | "leap";

export interface SpiderPoseInput {
  weights: Partial<Record<SpiderPoseName, number>>;
  /** Where the left or right hand reaches or shoots, in character space. */
  aimLeft?: Vec3;
  aimRight?: Vec3;
  /** Gait phase for running and climbing, in cycles. */
  phase?: number;
  /** Which hand holds the web while swinging. */
  swingHand?: "left" | "right";
}

interface Pose {
  leftArm?: ArmTarget;
  rightArm?: ArmTarget;
  leftLeg?: LegTarget;
  rightLeg?: LegTarget;
  lean?: number;
}

const arm = (upper: Vec3, fore: Vec3, fingers: Vec3, palm: Vec3): ArmTarget => ({ upper, fore, fingers, palm });
const leg = (thigh: Vec3, shin: Vec3, toe: Vec3): LegTarget => ({ thigh, shin, toe });

// --- the left side of each pose; the right mirrors it unless one-handed --------------

/** Standing easy: arms loose at the sides, palms in. */
const STAND_ARM = arm([0.2, -0.98, 0.0], [0.12, -0.97, 0.16], [0.08, -0.95, 0.22], [-0.95, 0, 0.15]);
const STAND_LEG = leg([0.06, -1, 0], [0.04, -1, -0.03], [0, -0.35, 0.94]);

/**
 * The famous upside-down hang: hands up at his feet, gripping the line, elbows
 * out; knees thrown wide to the sides and the feet pressed together, sole to
 * sole, like hands in a vanakkam.
 */
const HANG_ARM = arm([0.18, -0.94, 0.28], [-0.3, -0.92, 0.25], [-0.1, -0.99, 0.05], [-1, 0, 0]);
const HANG_LEG: LegTarget = { thigh: [0.86, -0.48, 0.16], shin: [-0.8, -0.58, 0.12], toe: [0, -0.85, 0.5], sole: [-1, 0, 0] };

/** The wave, right hand open to the user, the forearm rocking. */
function waveRight(clock: number): ArmTarget {
  const rock = 0.38 * Math.sin(clock * 9);
  return arm([-0.86, 0.05, 0.5], normalize([-0.25 + rock, 0.62, 0.74]), normalize([-0.2 + rock, 0.75, 0.6]), [0, 0.05, 1]);
}

/** Tucked tight in the air: knees to chest, arms around the shins. */
const TUCK_ARM = arm([0.3, -0.25, 0.92], [-0.35, -0.55, 0.76], [-0.35, -0.8, 0.5], [-0.9, 0, -0.2]);
const TUCK_LEG = leg([0.12, 0.55, 0.83], [0.06, -0.62, -0.78], [0, -0.9, 0.4]);

/** The three-point landing: right fist to the ground, left arm back, left knee forward, right leg out behind. */
const LAND: Pose = {
  // The fist planted on the floor in front, between the knees.
  rightArm: arm([-0.12, -0.72, 0.68], [-0.04, -0.98, 0.18], [0, -0.6, 0.8], [0, -1, 0.1]),
  leftArm: arm([0.82, -0.2, -0.53], [0.7, 0.22, -0.68], [0.6, 0.3, -0.74], [0, -0.3, -0.95]),
  // Left foot planted, thigh near level; right knee down, shin trailing.
  leftLeg: leg([0.26, -0.18, 0.95], [0.06, -0.97, -0.22], [0, -0.3, 0.95]),
  rightLeg: leg([-0.14, -0.9, -0.41], [-0.04, -0.12, -0.99], [0, -0.92, -0.38]),
  lean: 0.95,
};

/** Coiled to jump: knees bent, arms back. */
const CROUCH_ARM = arm([0.3, -0.86, -0.4], [0.28, -0.8, -0.53], [0.25, -0.5, -0.83], [0, -0.95, 0.25]);
const CROUCH_LEG = leg([0.1, -0.58, 0.8], [0.05, -0.86, -0.5], [0, -0.3, 0.95]);

/** Holding the bottle at the side, forearm level. */
const HOLD_RIGHT = arm([-0.28, -0.9, 0.3], [-0.06, -0.08, 0.99], [0.1, 0.15, 0.98], [0.98, 0.05, 0]);
/** Presenting the bottle to the user. */
const PRESENT_RIGHT = arm([-0.22, -0.45, 0.86], [-0.02, 0.05, 1], [0.05, 0.25, 0.97], [0.98, 0.05, 0]);
/** Reaching to catch: arm out to the side, hand open. */
const CATCH_RIGHT = arm([-0.86, -0.15, 0.48], [-0.75, 0.05, 0.66], [-0.6, 0.2, 0.77], [0.3, 0.1, 0.95]);
/** Talking with the free left hand, palm up. */
const TALK_LEFT = arm([0.36, -0.78, 0.5], [0.18, 0.06, 0.98], [0.12, 0.25, 0.96], [-0.15, 0.95, 0.2]);
/** Shrug: elbows out, forearms up, palms up. */
const SHRUG_ARM = arm([0.72, -0.62, 0.22], [0.5, 0.42, 0.75], [0.55, 0.3, 0.78], [0, 1, 0.1]);
/** Throw, wind-up: the bottle low and in front. */
const THROW_WIND = arm([-0.25, -0.62, 0.74], [0.05, -0.9, 0.43], [0.1, -0.7, 0.7], [0.95, 0, 0.2]);
/** Throw, release and follow-through: the arm flung up and back over the shoulder. */
const THROW_RELEASE = arm([-0.2, 0.86, -0.46], [-0.1, 0.62, -0.78], [-0.05, 0.3, -0.95], [0.9, 0.2, -0.3]);

/** The free arm while swinging: out to the side for balance. */
/** The free arm flung out and back, fingers spread, as in mid-swing. */
const SWING_FREE = arm([0.78, 0.25, -0.57], [0.7, 0.55, -0.45], [0.55, 0.7, -0.45], [0, 0.2, -1]);
/** Mid-swing legs: the near knee tucked high to the chest, the other folded under. */
const SWING_LEG_L = leg([0.25, 0.25, 0.93], [0.08, -0.92, -0.38], [0, -0.85, 0.5]);
const SWING_LEG_R = leg([-0.18, -0.55, 0.82], [-0.06, -0.55, -0.83], [0, -0.92, -0.38]);

/** Coiled before a shot: low, knees bent and apart, the free arm drawn back with fingers spread. */
const COIL_FREE = arm([0.72, -0.35, -0.6], [0.55, 0.15, -0.82], [0.5, 0.3, -0.8], [0.2, 0.3, -0.93]);
const COIL_LEG_L = leg([0.38, -0.55, 0.74], [0.12, -0.92, -0.37], [0.15, -0.3, 0.94]);

/** Mid-leap: legs bent and splayed, arms thrown wide, hands open. */
const LEAP_ARM = arm([0.92, 0.3, 0.25], [0.75, 0.62, 0.22], [0.6, 0.78, 0.18], [0, 0.2, 1]);
const LEAP_LEG_L = leg([0.5, -0.18, 0.85], [0.3, -0.9, -0.3], [0.1, -0.5, 0.86]);
const LEAP_LEG_R = leg([-0.4, -0.75, -0.52], [-0.18, -0.55, -0.82], [0, -0.9, -0.4]);

/** A straight arm reaching along `aim`, wrist bent back as when shooting a web. */
export function aimArm(aim: Vec3): ArmTarget {
  const d = normalize(aim);
  // The palm faces the target; the fingers fold up, away from it.
  const up: Vec3 = Math.abs(d[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0];
  const fingers = normalize(sub(up, scale(d, dot(up, d))));
  return arm(normalize(add(d, [0, -0.08, 0])), d, normalize(add(scale(fingers, 0.8), scale(d, 0.6))), d);
}

/** The web arm yanking: elbow still out towards the web, fist hauled back up to the chest. */
function pullArm(aim: Vec3): ArmTarget {
  const d = normalize(aim);
  const upper = normalize(add(scale(d, 0.75), [0, -0.25, 0.25]));
  const fore = normalize(add(scale(d, -0.35), [0, 0.55, 0.55]));
  return arm(upper, fore, normalize(add(fore, [0, 0.3, 0])), d);
}

/** Running: legs and arms swing in opposition. */
function runPose(phase: number): Pose {
  const s = Math.sin(phase * Math.PI * 2);
  const leftLeg = leg(normalize([0.06, -0.85, 0.65 * s]), normalize([0.04, -0.9, -0.25 - 0.6 * Math.max(0, -s)]), [0, -0.3, 0.95]);
  const rightLeg = leg(normalize([-0.06, -0.85, -0.65 * s]), normalize([-0.04, -0.9, -0.25 - 0.6 * Math.max(0, s)]), [0, -0.3, 0.95]);
  const leftArm = arm(normalize([0.25, -0.85, -0.5 * s]), normalize([0.15, -0.2, 0.9 - 0.4 * s]), [0.1, 0, 1], [-0.9, 0, 0]);
  const rightArm = arm(normalize([-0.25, -0.85, 0.5 * s]), normalize([-0.15, -0.2, 0.9 + 0.4 * s]), [-0.1, 0, 1], [0.9, 0, 0]);
  return { leftArm, rightArm, leftLeg, rightLeg, lean: 0.32 };
}

/** Climbing a wall in front: hands and feet move in diagonal pairs, knees out like a spider. */
function climbPose(phase: number): Pose {
  const s = Math.sin(phase * Math.PI * 2);
  const reach = (k: number): ArmTarget =>
    arm(normalize([0.42, 0.25 + 0.6 * k, 0.6]), normalize([0.12, 0.55 + 0.4 * k, 0.75]), normalize([0.05, 0.85, 0.5]), [0, 0, 1]);
  const step = (k: number): LegTarget => leg(normalize([0.62, -0.55 + 0.35 * k, 0.55]), normalize([0.2, -0.95, 0.1 - 0.2 * k]), [0, -0.2, 0.98]);
  return {
    leftArm: reach(s),
    rightArm: mirrorArm(reach(-s)),
    leftLeg: step(-s),
    rightLeg: mirrorLeg(step(s)),
    lean: 0.1,
  };
}

function swingPose(hand: "left" | "right", aim: Vec3 | undefined): Pose {
  const web = aimArm(aim ?? [0, 1, 0]);
  return hand === "right"
    ? { rightArm: web, leftArm: SWING_FREE, leftLeg: SWING_LEG_L, rightLeg: SWING_LEG_R, lean: -0.15 }
    : { leftArm: web, rightArm: mirrorArm(SWING_FREE), leftLeg: mirrorLeg(SWING_LEG_R), rightLeg: mirrorLeg(SWING_LEG_L), lean: -0.15 };
}

/** Low and coiled, ready to fire: the web arm is posed separately. */
function coilPose(hand: "left" | "right"): Pose {
  return hand === "right"
    ? { leftArm: COIL_FREE, leftLeg: COIL_LEG_L, rightLeg: mirrorLeg(COIL_LEG_L), lean: 0.3 }
    : { rightArm: mirrorArm(COIL_FREE), leftLeg: COIL_LEG_L, rightLeg: mirrorLeg(COIL_LEG_L), lean: 0.3 };
}

function poseOf(name: SpiderPoseName, input: SpiderPoseInput, clock: number): Pose {
  const phase = input.phase ?? 0;
  switch (name) {
    case "hang":
      return { leftArm: HANG_ARM, rightArm: mirrorArm(HANG_ARM), leftLeg: HANG_LEG, rightLeg: mirrorLeg(HANG_LEG), lean: -0.1 };
    case "wave":
      return { rightArm: waveRight(clock) };
    case "tuck":
      return { leftArm: TUCK_ARM, rightArm: mirrorArm(TUCK_ARM), leftLeg: TUCK_LEG, rightLeg: mirrorLeg(TUCK_LEG), lean: 0.5 };
    case "land":
      return LAND;
    case "crouch":
      return { leftArm: CROUCH_ARM, rightArm: mirrorArm(CROUCH_ARM), leftLeg: CROUCH_LEG, rightLeg: mirrorLeg(CROUCH_LEG), lean: 0.35 };
    case "aimLeft":
      return { leftArm: aimArm(input.aimLeft ?? [1, 0, 0]) };
    case "aimRight":
      return { rightArm: aimArm(input.aimRight ?? [-1, 0, 0]) };
    case "pullRight":
      return { rightArm: pullArm(input.aimRight ?? [-1, 0, 0]), lean: -0.08 };
    case "catchRight":
      return { rightArm: CATCH_RIGHT };
    case "holdRight":
      return { rightArm: HOLD_RIGHT };
    case "presentRight":
      return { rightArm: PRESENT_RIGHT };
    case "talkLeft":
      return { leftArm: TALK_LEFT };
    case "shrug":
      return { leftArm: SHRUG_ARM, rightArm: mirrorArm(SHRUG_ARM) };
    case "throwWind":
      return { rightArm: THROW_WIND, lean: 0.12 };
    case "throwRelease":
      return { rightArm: THROW_RELEASE, lean: -0.18 };
    case "run":
      return runPose(phase);
    case "climb":
      return climbPose(phase);
    case "swing":
      return swingPose(input.swingHand ?? "right", input.swingHand === "left" ? input.aimLeft : input.aimRight);
    case "coil":
      return coilPose(input.swingHand ?? "right");
    case "leap":
      return { leftArm: LEAP_ARM, rightArm: mirrorArm(LEAP_ARM), leftLeg: LEAP_LEG_L, rightLeg: LEAP_LEG_R, lean: 0.15 };
  }
}

// --- hands ---------------------------------------------------------------------------

const OPEN: HandShape = { thumb: 0.1, index: 0.12, middle: 0.15, ring: 0.18, pinky: 0.2 };
/** Fingers spread wide, for the free hand in a swing or leap. */
const SPREAD: HandShape = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };
/** The web-shooter "thwip": middle and ring fingers pressed to the palm, the others out. */
const THWIP: HandShape = { thumb: 0, index: 0, middle: 1, ring: 1, pinky: 0 };
/** Wrapped round the bottle. */
const GRIP: HandShape = { thumb: 0.5, index: 0.55, middle: 0.6, ring: 0.62, pinky: 0.65 };
const FIST: HandShape = { thumb: 0.6, index: 0.85, middle: 0.9, ring: 0.9, pinky: 0.9 };

function blendHands(items: Array<[HandShape, number]>): HandShape {
  const total = items.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
  const rest = Math.max(0, 1 - total);
  const norm = Math.max(1, total);
  const pick = (key: keyof HandShape) => (items.reduce((sum, [shape, w]) => sum + shape[key] * Math.max(0, w), 0) + OPEN[key] * rest) / norm;
  return { thumb: pick("thumb"), index: pick("index"), middle: pick("middle"), ring: pick("ring"), pinky: pick("pinky") };
}

function handsFor(input: SpiderPoseInput): { left: HandShape; right: HandShape } {
  const w = (name: SpiderPoseName) => input.weights[name] ?? 0;
  const swing = w("swing");
  const swingRight = input.swingHand === "left" ? 0 : swing;
  const swingLeft = input.swingHand === "left" ? swing : 0;
  return {
    right: blendHands([
      [THWIP, w("aimRight") + swingRight + 0.6 * w("pullRight")],
      [GRIP, w("holdRight") + w("presentRight") + w("throwWind")],
      [FIST, 0.6 * w("land") + 0.5 * w("run") + 0.3 * w("tuck") + w("hang") * (1 - w("wave"))],
      [SPREAD, swingLeft + w("leap")],
    ]),
    left: blendHands([
      [THWIP, w("aimLeft") + swingLeft],
      [FIST, 0.4 * w("land") + 0.5 * w("run") + 0.3 * w("tuck") + w("hang")],
      [SPREAD, swingRight + w("coil") + w("leap")],
    ]),
  };
}

/** Blends the weighted poses over the standing pose. */
export function spiderTargets(input: SpiderPoseInput, clock: number): BodyTargets {
  // Breathing and tiny weight shifts so he is never a statue.
  const sway: Vec3 = [0.02 * Math.sin(clock * 0.9), 0, 0.03 * Math.sin(clock * 0.7)];
  const standLeft: ArmTarget = { ...STAND_ARM, fore: normalize(add(STAND_ARM.fore, sway)) };
  const standRight: ArmTarget = mirrorArm({ ...STAND_ARM, fore: normalize(add(STAND_ARM.fore, [sway[0], 0, -sway[2]])) });

  const leftArm: Weighted<ArmTarget> = [];
  const rightArm: Weighted<ArmTarget> = [];
  const leftLeg: Weighted<LegTarget> = [];
  const rightLeg: Weighted<LegTarget> = [];
  let lean = 0;
  for (const [name, weight] of Object.entries(input.weights) as [SpiderPoseName, number][]) {
    if (!weight || weight <= 0) continue;
    const pose = poseOf(name, input, clock);
    if (pose.leftArm) leftArm.push([pose.leftArm, weight]);
    if (pose.rightArm) rightArm.push([pose.rightArm, weight]);
    if (pose.leftLeg) leftLeg.push([pose.leftLeg, weight]);
    if (pose.rightLeg) rightLeg.push([pose.rightLeg, weight]);
    lean += (pose.lean ?? 0) * weight;
  }
  return {
    leftArm: blendArm(leftArm, standLeft),
    rightArm: blendArm(rightArm, standRight),
    leftLeg: withSole(blendLeg(leftLeg, STAND_LEG), leftLeg),
    rightLeg: withSole(blendLeg(rightLeg, mirrorLeg(STAND_LEG)), rightLeg),
    lean,
    hands: handsFor(input),
  };
}

/** Exposed for tests: every named pose, for checking they are all well formed. */
export const SPIDER_POSES: readonly SpiderPoseName[] = [
  "hang",
  "wave",
  "tuck",
  "land",
  "crouch",
  "aimLeft",
  "aimRight",
  "pullRight",
  "catchRight",
  "holdRight",
  "presentRight",
  "talkLeft",
  "shrug",
  "throwWind",
  "throwRelease",
  "run",
  "climb",
  "swing",
  "coil",
  "leap",
];

/** Keeps a foot's roll when the poses that set it dominate (the soles-together hang). */
function withSole(leg: LegTarget, items: Weighted<LegTarget>): LegTarget {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  const soled = items.filter(([target]) => target.sole);
  const weight = soled.reduce((sum, [, w]) => sum + w, 0);
  if (soled.length === 0 || weight < 0.5 * Math.max(1, total)) return leg;
  const sole = normalize(soled.reduce<Vec3>((sum, [target, w]) => add(sum, scale(target.sole!, w)), [0, 0, 0]));
  return { ...leg, sole };
}
