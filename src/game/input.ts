/**
 * Game input: keyboard, mouse (with pointer lock), and touch controls all write into one
 * mutable snapshot that the frame loop reads. Edge-triggered actions are counted, not flagged,
 * so a quick tap between two frames is never lost.
 */
export const pad = {
  move: { x: 0, y: 0 }, // x strafe, y forward, in [-1, 1]
  look: { x: 0, y: 0 }, // accumulated pixels since the last frame
  jumpHeld: false,
  sprint: false,
  up: false,
  down: false,
  fireHeld: false,
  altHeld: false,
  taps: { jump: 0, fire: 0, alt: 0, car: 0, interact: 0, slowmo: 0 },
};

export type Tap = keyof typeof pad.taps;
export const takeTap = (k: Tap) => {
  const n = pad.taps[k];
  pad.taps[k] = 0;
  return n > 0;
};

const keys = new Set<string>();

function syncMove() {
  const f = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  const s = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  pad.move.x = s;
  pad.move.y = f;
  pad.sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
  pad.up = keys.has("Space");
  pad.down = keys.has("ControlLeft") || keys.has("KeyC");
  pad.jumpHeld = keys.has("Space");
}

const typing = (e: Event) => {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
};

/** Attaches keyboard and mouse listeners; returns a cleanup function. */
export function attachDesktopInput(canvas: HTMLElement, enabled: () => boolean) {
  const down = (e: KeyboardEvent) => {
    if (typing(e) || !enabled()) return;
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === "Space") pad.taps.jump++;
    if (e.code === "KeyF") pad.taps.car++;
    if (e.code === "KeyE") pad.taps.interact++;
    if (e.code === "KeyV") pad.taps.slowmo++;
    if (e.code === "KeyJ") pad.taps.fire++;
    if (e.code === "KeyK") pad.taps.alt++;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    syncMove();
  };
  const up = (e: KeyboardEvent) => {
    keys.delete(e.code);
    syncMove();
  };
  const blur = () => {
    keys.clear();
    syncMove();
    pad.fireHeld = pad.altHeld = false;
  };
  let dragging = false;
  const mdown = (e: MouseEvent) => {
    if (!enabled()) return;
    if (document.pointerLockElement !== canvas) {
      // First click locks the cursor (GTA-style look); it does not fire.
      canvas.requestPointerLock?.()?.catch?.(() => undefined);
      dragging = true;
      return;
    }
    if (e.button === 0) {
      pad.fireHeld = true;
      pad.taps.fire++;
    } else if (e.button === 2) {
      pad.altHeld = true;
      pad.taps.alt++;
    }
  };
  const mup = (e: MouseEvent) => {
    dragging = false;
    if (e.button === 0) pad.fireHeld = false;
    if (e.button === 2) pad.altHeld = false;
  };
  const move = (e: MouseEvent) => {
    if (document.pointerLockElement === canvas || dragging) {
      pad.look.x += e.movementX;
      pad.look.y += e.movementY;
    }
  };
  const ctx = (e: Event) => e.preventDefault();
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  canvas.addEventListener("mousedown", mdown);
  window.addEventListener("mouseup", mup);
  window.addEventListener("mousemove", move);
  canvas.addEventListener("contextmenu", ctx);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
    canvas.removeEventListener("mousedown", mdown);
    window.removeEventListener("mouseup", mup);
    window.removeEventListener("mousemove", move);
    canvas.removeEventListener("contextmenu", ctx);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    blur();
  };
}

export function resetPad() {
  keys.clear();
  syncMove();
  pad.look.x = pad.look.y = 0;
  pad.fireHeld = pad.altHeld = false;
  for (const k of Object.keys(pad.taps) as Tap[]) pad.taps[k] = 0;
}
