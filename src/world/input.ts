/**
 * Mutable input + player state shared between DOM controls and the frame loop.
 * Deliberately not React state: it changes every frame.
 */
export const input = {
  keys: new Set<string>(),
  /** Virtual joystick vector, x = strafe, y = forward, each in [-1, 1]. */
  stick: { x: 0, y: 0 },
  /** Accumulated look delta in pixels since last frame. */
  look: { x: 0, y: 0 },
};

export const player = { x: 0, z: 62, yaw: 0 };

const MOVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"]);
export const isMoveKey = (code: string) => MOVE_KEYS.has(code);

export function resetInput() {
  input.keys.clear();
  input.stick.x = input.stick.y = 0;
  input.look.x = input.look.y = 0;
}
