// Ported from csbros-companion (same author); drives Mixamo-style skeletons procedurally.
export type Vec3 = [number, number, number];

/** Small, allocation-light vector and easing helpers for hero choreography. */

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
export const normalize = (a: Vec3): Vec3 => {
  const l = length(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const mix = (a: Vec3, b: Vec3, t: number): Vec3 => add(scale(a, 1 - t), scale(b, t));

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** 0 before `from`, 1 after `to`, smooth in between. */
export const ramp = (x: number, from: number, to: number): number => {
  const c = clamp01((x - from) / (to - from || 1));
  return c * c * (3 - 2 * c);
};
export const smooth = (x: number): number => ramp(x, 0, 1);
export const easeIn = (x: number): number => clamp01(x) ** 2;
export const easeOut = (x: number): number => 1 - (1 - clamp01(x)) ** 2;
export const easeOutCubic = (x: number): number => 1 - (1 - clamp01(x)) ** 3;
export const easeInOut = (x: number): number => {
  const c = clamp01(x);
  return c < 0.5 ? 2 * c * c : 1 - (-2 * c + 2) ** 2 / 2;
};
/** Rises then falls over [from, to] (a half sine). */
export const bell = (x: number, from: number, to: number): number => (x <= from || x >= to ? 0 : Math.sin(((x - from) / (to - from)) * Math.PI));
/** On between `from` and `to`, with soft edges `edge` long. */
export const window01 = (x: number, from: number, to: number, edge = 0.15): number => Math.min(ramp(x, from, from + edge), 1 - ramp(x, to - edge, to));

export function quadratic(p0: Vec3, p1: Vec3, p2: Vec3, t: number): Vec3 {
  const u = 1 - t;
  return add(add(scale(p0, u * u), scale(p1, 2 * u * t)), scale(p2, t * t));
}

export function cubic(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const u = 1 - t;
  return add(add(scale(p0, u * u * u), scale(p1, 3 * u * u * t)), add(scale(p2, 3 * u * t * t), scale(p3, t * t * t)));
}

/** A world direction expressed in the character's space (x = its left, y = up, z = front). */
export function toCharacterSpace(direction: Vec3, up: Vec3, front: Vec3): Vec3 {
  const y = normalize(up);
  const z = normalize(sub(front, scale(y, dot(front, y))));
  const x = cross(y, z);
  return normalize([dot(direction, x), dot(direction, y), dot(direction, z)]);
}

/** Rotates `v` about the world Z axis (the screen's own plane) by `angle`. */
export const rotateZ = (v: Vec3, angle: number): Vec3 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
};

/** Rotates `v` about the world Y axis by `angle`. */
export const rotateY = (v: Vec3, angle: number): Vec3 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
};
