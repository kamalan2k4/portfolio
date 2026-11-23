import { Vector3 } from "three";
import { create } from "zustand";
import type { DistrictId } from "@/content/types";
import type { HeroId } from "./heroes";

export type Phase = "select" | "intro" | "play";
export type Mode = "ground" | "air" | "swing" | "zip" | "wall" | "fly" | "drive";

type GameState = {
  hero: HeroId;
  phase: Phase;
  slowmo: boolean;
  locked: boolean;
  /** UI-visible mirrors of runtime state; updated only when they change. */
  mode: Mode;
  nearby: DistrictId | null;
  nearCar: boolean;
  setHero: (h: HeroId) => void;
  setPhase: (p: Phase) => void;
  toggleSlowmo: () => void;
  set: (s: Partial<GameState>) => void;
};

export const useGame = create<GameState>()((set) => ({
  hero: "spiderman",
  phase: "select",
  slowmo: false,
  locked: false,
  mode: "ground",
  nearby: null,
  nearCar: false,
  setHero: (hero) => set({ hero }),
  setPhase: (phase) => set({ phase }),
  toggleSlowmo: () => set((s) => ({ slowmo: !s.slowmo })),
  set: (s) => set(s),
}));

/** Per-frame hero and camera state. Mutable on purpose: it changes every frame. */
export const rt = {
  pos: new Vector3(0, 0.45, 172),
  vel: new Vector3(),
  /** Facing (radians about +Y; 0 faces -Z, i.e. north into the city). */
  yaw: 0,
  mode: "ground" as Mode,
  grounded: true,
  anchor: new Vector3(),
  ropeLength: 0,
  zipTarget: new Vector3(),
  wallNormal: new Vector3(),
  /** Air stunt: kind and progress (0..1), applied as a whole-body rotation. */
  stunt: { kind: 0, t: 1, dur: 0.7 },
  jumps: 0,
  landing: 0,
  /** Seconds since the last attack, for poses and effects. */
  attackT: 9,
  attackKind: 0,
  aim: new Vector3(0, 0, -1),
  aimPoint: new Vector3(),
  camYaw: 0,
  camPitch: -0.12,
  lookIdle: 0,
  shake: 0,
  timeScale: 1,
  /** Car being driven, when mode is "drive". */
  car: -1,
  speed: 0,
  clock: 0,
};

export function resetRuntime(x = 0, z = 172) {
  rt.pos.set(x, 0.45, z);
  rt.vel.set(0, 0, 0);
  rt.yaw = 0;
  rt.mode = "ground";
  rt.grounded = true;
  rt.stunt.t = 1;
  rt.jumps = 0;
  rt.landing = 0;
  rt.attackT = 9;
  rt.camYaw = 0;
  rt.camPitch = -0.12;
  rt.shake = 0;
  rt.car = -1;
}
