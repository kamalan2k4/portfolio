// Ported from csbros-companion (same author); drives Mixamo-style skeletons procedurally.
import type { BoneKey, RigProfile } from "./mixamoRig";

/**
 * The bundled Spider-Man model's skeleton (arjunpkrishna's rig): bones named
 * Hip_01, Arm_029 and so on, no neck bone, no head-top end bone, and forearm
 * twist bones hung off the upper arms, which must turn with the elbows.
 */
const NAMES: Record<string, BoneKey> = {
  Hip_01: "Hips",
  Spine1_014: "Spine",
  Spine2_015: "Spine1",
  Spine3_016: "Spine2",
  Head_017: "Head",
  Arm_029: "LeftArm",
  Elbow_030: "LeftForeArm",
  Wrist_031: "LeftHand",
  Middle_039: "LeftHandMiddle1",
  Thumb_032: "LeftHandThumb1",
  Arm_2_057: "RightArm",
  Elbow_2_058: "RightForeArm",
  Wrist_2_059: "RightHand",
  Middle_2_068: "RightHandMiddle1",
  Thumb_2_060: "RightHandThumb1",
  L_Leg_04: "LeftUpLeg",
  Knee_05: "LeftLeg",
  Ankle_06: "LeftFoot",
  Toe_07: "LeftToeBase",
  R_Leg_09: "RightUpLeg",
  Knee_2_010: "RightLeg",
  Ankle_2_011: "RightFoot",
  _Toe_012: "RightToeBase",
};

export const SPIDER_PROFILE: RigProfile = {
  keyOf: (name) => NAMES[name] ?? null,
  optional: ["Neck", "HeadTop_End"],
  followers: {
    ElbowTwist_051: "LeftForeArm",
    ElbowTwist_2_080: "RightForeArm",
  },
  fingers: {
    left: {
      thumb: ["Thumb_032", "Joint_8_033", "Joint_9_034"],
      index: ["Index_036", "Joint_11_037", "Joint_12_038"],
      middle: ["Middle_039", "Joint_14_040", "Joint_15_041"],
      ring: ["Ring_043", "Joint_17_044", "Joint_18_045"],
      pinky: ["Pinky_047", "Joint_20_048", "Joint_21_049"],
    },
    right: {
      thumb: ["Thumb_2_060", "Joint_25_061", "Joint_26_062"],
      index: ["Index_2_064", "Joint_28_065", "Joint_29_066"],
      middle: ["Middle_2_068", "Joint_31_069", "Joint_32_070"],
      ring: ["Ring_2_072", "Joint_34_073", "Joint_35_074"],
      pinky: ["Pinky_2_076", "Joint_37_077", "Joint_38_078"],
    },
  },
};
