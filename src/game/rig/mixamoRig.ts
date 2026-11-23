// Ported from csbros-companion (same author); drives Mixamo-style skeletons procedurally.
import { Euler, Matrix4, Quaternion, Vector3, type Bone, type Object3D } from "three";
import type { Vec3 } from "./math";
import type { ArmTarget, BodyTargets, HandShape, LegTarget } from "./posing";

/**
 * Drives a Mixamo-style skeleton procedurally.
 *
 * Every target is a direction in the character's space; each bone is rotated
 * from its own rest pose (measured once, at load) so that it points there. No
 * assumptions about bone axes are needed, which is what keeps limbs from
 * twisting or dislocating. Parents are solved before children.
 */

const BONE_KEYS = [
  "Hips",
  "Spine",
  "Spine1",
  "Spine2",
  "Neck",
  "Head",
  "HeadTop_End",
  "LeftArm",
  "LeftForeArm",
  "LeftHand",
  "LeftHandMiddle1",
  "LeftHandThumb1",
  "RightArm",
  "RightForeArm",
  "RightHand",
  "RightHandMiddle1",
  "RightHandThumb1",
  "LeftUpLeg",
  "LeftLeg",
  "LeftFoot",
  "LeftToeBase",
  "RightUpLeg",
  "RightLeg",
  "RightFoot",
  "RightToeBase",
] as const;
export type BoneKey = (typeof BONE_KEYS)[number];

/** "mixamorig:LeftArm_09" (or the loader's sanitised "mixamorigLeftArm_09") -> "LeftArm". */
export function mixamoKey(name: string): string {
  return name.replace(/^mixamorig[:_]?/i, "").replace(/_\d+$/, "");
}

/**
 * How a skeleton's bone names map onto the solver's bones. Skeletons from
 * different tools name bones differently; the solver itself only needs to
 * know which bone is which.
 */
export interface RigProfile {
  /** The solver bone a node stands for, or null. */
  keyOf(name: string): BoneKey | null;
  /** Bones this skeleton may lack. */
  optional: readonly BoneKey[];
  /**
   * Helper bones that must turn with a solver bone although they are not its
   * children (for example forearm twist bones hung off the upper arm).
   */
  followers?: Readonly<Record<string, BoneKey>>;
  /** Finger bone chains, knuckle first, by hand and finger. */
  fingers?: Readonly<Record<"left" | "right", Partial<Record<keyof HandShape, readonly string[]>>>>;
}

/** How far each joint of a finger bends at a full curl (radians). */
const CURL: Record<keyof HandShape, number> = { thumb: 0.55, index: 1.25, middle: 1.3, ring: 1.3, pinky: 1.25 };

export const MIXAMO_PROFILE: RigProfile = {
  keyOf: (name) => {
    const key = mixamoKey(name);
    return (BONE_KEYS as readonly string[]).includes(key) ? (key as BoneKey) : null;
  },
  optional: [],
};

const v = (a: Vec3) => new Vector3(a[0], a[1], a[2]);

interface Rest {
  /** Position and rotation in the character's space. */
  position: Vector3;
  rotation: Quaternion;
  local: Quaternion;
}

export interface ThrusterAnchor {
  position: Vector3;
  direction: Vector3;
}

export class MixamoRig {
  readonly bones: Partial<Record<BoneKey, Bone>> = {};
  private readonly rest = new Map<Object3D, Rest>();
  private readonly order: Bone[] = [];
  private readonly root: Object3D;
  /** Palm and sole normals, in each bone's own space. */
  private readonly palmLocal = { left: new Vector3(), right: new Vector3() };
  private readonly soleLocal = { left: new Vector3(), right: new Vector3() };
  private readonly posed = new Map<Object3D, Quaternion>();
  private readonly profile: RigProfile;
  /** Helper bones and the solver bone each one turns with. */
  private readonly followers: { bone: Bone; leader: BoneKey }[] = [];
  private readonly fingers = { left: new Map<keyof HandShape, Bone[]>(), right: new Map<keyof HandShape, Bone[]>() };

  constructor(root: Object3D, profile: RigProfile = MIXAMO_PROFILE) {
    this.root = root;
    this.profile = profile;
    root.updateMatrixWorld(true);
    const toRoot = root.matrixWorld.clone().invert();
    const visit = (object: Object3D): void => {
      const matrix = new Matrix4().multiplyMatrices(toRoot, object.matrixWorld);
      const position = new Vector3();
      const rotation = new Quaternion();
      matrix.decompose(position, rotation, new Vector3());
      this.rest.set(object, { position, rotation, local: object.quaternion.clone() });
      if ((object as Bone).isBone) {
        this.order.push(object as Bone);
        const key = profile.keyOf(object.name);
        if (key && !this.bones[key]) this.bones[key] = object as Bone;
        const leader = profile.followers?.[object.name];
        if (leader) this.followers.push({ bone: object as Bone, leader });
      }
      for (const child of object.children) visit(child);
    };
    visit(root);
    // Finger chains, in knuckle-to-tip order.
    const byName = new Map(this.order.map((bone) => [bone.name, bone]));
    for (const side of ["left", "right"] as const) {
      for (const [finger, names] of Object.entries(profile.fingers?.[side] ?? {}) as [keyof HandShape, readonly string[]][]) {
        const chain = names.map((name) => byName.get(name)).filter((bone): bone is Bone => Boolean(bone));
        if (chain.length > 0) this.fingers[side].set(finger, chain);
      }
    }
    this.measureThrusterNormals();
  }

  /** True when the skeleton has every bone the procedural performance needs. */
  isComplete(): boolean {
    return BONE_KEYS.every((key) => this.bones[key] || this.profile.optional.includes(key));
  }

  restPosition(key: BoneKey): Vector3 {
    const bone = this.bones[key];
    if (bone) return this.rest.get(bone)!.position.clone();
    if (key === "HeadTop_End" && this.bones.Head && this.bones.Spine2) {
      // No end bone: the top of the head is a little above the head bone, along the neck.
      const head = this.restPosition("Head");
      const along = head.clone().sub(this.restPosition("Spine2"));
      return head.addScaledVector(along.normalize(), head.y * 0.13);
    }
    return new Vector3();
  }

  /** The bone standing for `key`, as a world-space position, for things attached to the body. */
  worldPosition(key: BoneKey, out = new Vector3()): Vector3 {
    const bone = this.bones[key];
    if (bone) return bone.getWorldPosition(out);
    if (key === "HeadTop_End" && this.bones.Head && this.bones.Spine2) {
      // Continue the neck line past the head bone, by the same proportion as at rest.
      const head = this.bones.Head.getWorldPosition(out);
      const neck = head.clone().sub(this.bones.Spine2.getWorldPosition(new Vector3()));
      const restHead = this.restPosition("Head");
      const k = this.restPosition("HeadTop_End").distanceTo(restHead) / Math.max(1e-6, restHead.distanceTo(this.restPosition("Spine2")));
      return head.addScaledVector(neck, k);
    }
    return out.set(0, 0, 0);
  }

  /** Poses the skeleton. `head` angles are radians: turn (left +), nod (down +), tilt. */
  apply(targets: BodyTargets, head: { turn: number; nod: number; tilt: number }): void {
    const goals = new Map<Bone, Quaternion>();
    const b = this.bones;
    const spineTurn = (amount: number) => new Quaternion().setFromEuler(new Euler(targets.lean * amount, 0, 0));
    const set = (bone: Bone | undefined, q: Quaternion | null) => {
      if (bone && q) goals.set(bone, q);
    };
    set(b.Spine, this.rotateRest(b.Spine, spineTurn(0.35)));
    set(b.Spine1, this.rotateRest(b.Spine1, spineTurn(0.7)));
    set(b.Spine2, this.rotateRest(b.Spine2, spineTurn(1)));
    const headTurn = (amount: number) =>
      new Quaternion().setFromEuler(new Euler(targets.lean + head.nod * amount, head.turn * amount, -head.tilt * amount, "YXZ"));
    set(b.Neck, this.rotateRest(b.Neck, headTurn(0.4)));
    set(b.Head, this.rotateRest(b.Head, headTurn(1)));

    this.setArm(goals, "Left", targets.leftArm);
    this.setArm(goals, "Right", targets.rightArm);
    this.setLeg(goals, "Left", targets.leftLeg);
    this.setLeg(goals, "Right", targets.rightLeg);
    if (targets.hands) {
      this.setFingers(goals, "left", targets.hands.left);
      this.setFingers(goals, "right", targets.hands.right);
    }
    // Helper bones turn by the same amount as their leader.
    for (const { bone, leader } of this.followers) {
      const lead = b[leader];
      const goal = lead && goals.get(lead);
      if (!lead || !goal) continue;
      const delta = goal.clone().multiply(this.restOf(lead).rotation.clone().invert());
      goals.set(bone, delta.multiply(this.restOf(bone).rotation));
    }

    // Solve top-down: each bone's local rotation is its goal relative to its parent's result.
    this.posed.clear();
    for (const bone of this.order) {
      const parent = bone.parent!;
      const parentRotation = this.posed.get(parent) ?? this.rest.get(parent)?.rotation ?? new Quaternion();
      const goal = goals.get(bone);
      if (goal) {
        bone.quaternion.copy(parentRotation.clone().invert().multiply(goal));
        this.posed.set(bone, goal);
      } else {
        const local = this.rest.get(bone)!.local;
        bone.quaternion.copy(local);
        this.posed.set(bone, parentRotation.clone().multiply(local));
      }
    }
  }

  /** Where the four thrusters are and which way they fire, in world space. Call after rendering updates matrices. */
  thrusters(): { leftHand: ThrusterAnchor; rightHand: ThrusterAnchor; leftFoot: ThrusterAnchor; rightFoot: ThrusterAnchor } {
    const b = this.bones;
    const hand = (side: "left" | "right") => {
      const handBone = side === "left" ? b.LeftHand! : b.RightHand!;
      const middle = side === "left" ? b.LeftHandMiddle1! : b.RightHandMiddle1!;
      const direction = this.palmLocal[side].clone().applyQuaternion(handBone.getWorldQuaternion(new Quaternion())).normalize();
      const position = handBone.getWorldPosition(new Vector3()).lerp(middle.getWorldPosition(new Vector3()), 0.6).addScaledVector(direction, 0.03);
      return { position, direction };
    };
    const foot = (side: "left" | "right") => {
      const footBone = side === "left" ? b.LeftFoot! : b.RightFoot!;
      const toe = side === "left" ? b.LeftToeBase! : b.RightToeBase!;
      const direction = this.soleLocal[side].clone().applyQuaternion(footBone.getWorldQuaternion(new Quaternion())).normalize();
      const position = footBone.getWorldPosition(new Vector3()).lerp(toe.getWorldPosition(new Vector3()), 0.3).addScaledVector(direction, 0.06);
      return { position, direction };
    };
    return { leftHand: hand("left"), rightHand: hand("right"), leftFoot: foot("left"), rightFoot: foot("right") };
  }

  // --- internals --------------------------------------------------------------------

  private restOf(bone: Object3D): Rest {
    return this.rest.get(bone)!;
  }

  /** Rest rotation turned by `delta` in character space. */
  private rotateRest(bone: Bone | undefined, delta: Quaternion): Quaternion | null {
    if (!bone) return null;
    return delta.clone().multiply(this.restOf(bone).rotation);
  }

  /** Rotation that makes the bone point from itself towards `direction`, starting from rest. */
  private aim(bone: Bone, child: Bone, direction: Vec3): Quaternion {
    const restDirection = this.restOf(child).position.clone().sub(this.restOf(bone).position).normalize();
    const swing = new Quaternion().setFromUnitVectors(restDirection, v(direction).normalize());
    return swing.multiply(this.restOf(bone).rotation);
  }

  /** Rotation that points the bone along `primary` with its `restSecondary` side turned to `secondary`. */
  private orient(bone: Bone, restPrimary: Vector3, restSecondary: Vector3, primary: Vec3, secondary: Vec3): Quaternion {
    const basis = (x: Vector3, hint: Vector3) => {
      const ax = x.clone().normalize();
      const ay = hint.clone().addScaledVector(ax, -hint.dot(ax)).normalize();
      const az = new Vector3().crossVectors(ax, ay);
      return new Matrix4().makeBasis(ax, ay, az);
    };
    const from = basis(restPrimary, restSecondary);
    const to = basis(v(primary), v(secondary));
    const rotation = new Quaternion().setFromRotationMatrix(to.multiply(from.transpose()));
    return rotation.multiply(this.restOf(bone).rotation);
  }

  private setArm(goals: Map<Bone, Quaternion>, side: "Left" | "Right", arm: ArmTarget): void {
    const b = this.bones;
    const upper = b[`${side}Arm`]!;
    const fore = b[`${side}ForeArm`]!;
    const hand = b[`${side}Hand`]!;
    const middle = b[`${side}HandMiddle1`]!;
    goals.set(upper, this.aim(upper, fore, arm.upper));
    goals.set(fore, this.aim(fore, hand, arm.fore));
    const restFingers = this.restOf(middle).position.clone().sub(this.restOf(hand).position);
    const restPalm = this.restPalm(side === "Left" ? "left" : "right");
    goals.set(hand, this.orient(hand, restFingers, restPalm, arm.fingers, arm.palm));
  }

  /** Curls each finger into the palm, joint by joint, following the hand's new orientation. */
  private setFingers(goals: Map<Bone, Quaternion>, side: "left" | "right", shape: HandShape): void {
    const hand = side === "left" ? this.bones.LeftHand : this.bones.RightHand;
    const middle = side === "left" ? this.bones.LeftHandMiddle1 : this.bones.RightHandMiddle1;
    const handGoal = hand && goals.get(hand);
    if (!hand || !middle || !handGoal || this.fingers[side].size === 0) return;
    const handDelta = handGoal.clone().multiply(this.restOf(hand).rotation.clone().invert());
    const palm = this.restPalm(side);
    for (const [finger, chain] of this.fingers[side]) {
      const amount = shape[finger];
      if (!amount) continue;
      // Bend about the axis that takes the finger towards the palm.
      const along = (chain[1] ? this.restOf(chain[1]).position : this.restOf(middle).position).clone().sub(this.restOf(chain[0]!).position);
      const axis = new Vector3().crossVectors(along.normalize(), palm).normalize().applyQuaternion(handDelta);
      chain.forEach((bone, i) => {
        const bend = new Quaternion().setFromAxisAngle(axis, CURL[finger] * amount * (i + 1));
        goals.set(bone, bend.multiply(handDelta.clone().multiply(this.restOf(bone).rotation)));
      });
    }
  }

  private setLeg(goals: Map<Bone, Quaternion>, side: "Left" | "Right", leg: LegTarget): void {
    const b = this.bones;
    const thigh = b[`${side}UpLeg`]!;
    const shin = b[`${side}Leg`]!;
    const foot = b[`${side}Foot`]!;
    const toe = b[`${side}ToeBase`]!;
    goals.set(thigh, this.aim(thigh, shin, leg.thigh));
    goals.set(shin, this.aim(shin, foot, leg.shin));
    if (leg.sole) {
      const restToe = this.restOf(toe).position.clone().sub(this.restOf(foot).position);
      goals.set(foot, this.orient(foot, restToe, new Vector3(0, -1, 0), leg.toe, leg.sole));
    } else {
      goals.set(foot, this.aim(foot, toe, leg.toe));
    }
  }

  /** Palm normal at rest, in character space: across the hand, from the back to the palm. */
  private restPalm(side: "left" | "right"): Vector3 {
    const b = this.bones;
    const hand = this.restOf(side === "left" ? b.LeftHand! : b.RightHand!).position;
    const fingers = this.restOf(side === "left" ? b.LeftHandMiddle1! : b.RightHandMiddle1!)
      .position.clone()
      .sub(hand);
    const thumb = this.restOf(side === "left" ? b.LeftHandThumb1! : b.RightHandThumb1!)
      .position.clone()
      .sub(hand);
    const normal = side === "left" ? new Vector3().crossVectors(fingers, thumb) : new Vector3().crossVectors(thumb, fingers);
    return normal.normalize();
  }

  private measureThrusterNormals(): void {
    const b = this.bones;
    if (!this.isComplete()) return;
    for (const side of ["left", "right"] as const) {
      const hand = side === "left" ? b.LeftHand! : b.RightHand!;
      const foot = side === "left" ? b.LeftFoot! : b.RightFoot!;
      const toe = side === "left" ? b.LeftToeBase! : b.RightToeBase!;
      // Into each bone's own space, so the direction follows the bone through any pose.
      const handRest = this.restOf(hand).rotation.clone().invert();
      this.palmLocal[side] = this.restPalm(side).applyQuaternion(handRest);
      // The sole faces down, perpendicular to the heel-to-toe line.
      const along = this.restOf(toe).position.clone().sub(this.restOf(foot).position).normalize();
      const sole = new Vector3(0, -1, 0).addScaledVector(along, along.y).normalize();
      this.soleLocal[side] = sole.applyQuaternion(this.restOf(foot).rotation.clone().invert());
    }
  }
}
