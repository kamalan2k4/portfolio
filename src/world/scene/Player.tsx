import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { destinationById, destinations } from "@/content/destinations";
import type { DistrictId } from "@/content/types";
import { input, isMoveKey, player, resetInput } from "../input";
import { useWorld } from "../store";
import { groundHeight, resolveMove } from "../terrain";

const EYE = 1.7;
const WALK = 9;
const RUN = 17;
const LOOK_SPEED = 0.0034;
/** A district counts as "nearby" within its viewpoint distance plus a margin. */
const nearRadius = (d: (typeof destinations)[number]) => Math.max(12, Math.hypot(d.viewpoint[0] - d.position[0], d.viewpoint[1] - d.position[1]) + 3);

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const yawTowards = (fromX: number, fromZ: number, toX: number, toZ: number) => Math.atan2(-(toX - fromX), -(toZ - fromZ));

type Flight = { id: DistrictId; t: number; dur: number; from: [number, number, number, number, number]; to: [number, number, number, number, number]; arc: number };

export function Player() {
  const get = useThree((s) => s.get);
  const state = useRef({ y: 0, pitch: -0.08, vx: 0, vz: 0, intro: 1, frame: 0 });
  const flight = useRef<Flight | null>(null);
  const lastNonce = useRef(0);

  // Initial pose: arrival overlook, slightly elevated for the intro descent.
  useEffect(() => {
    const arrival = destinationById("arrival");
    const [vx, vz] = arrival.viewpoint;
    player.x = vx;
    player.z = vz;
    player.yaw = yawTowards(vx, vz, 0, 0);
    state.current.y = groundHeight(vx, vz) + EYE;
    state.current.pitch = Math.atan2((arrival.lookHeight ?? 4) - state.current.y, Math.hypot(arrival.position[0] - vx, arrival.position[1] - vz)) * 0.5;
    state.current.intro = useWorld.getState().reducedMotion ? 0 : 1;
  }, []);

  // Keyboard
  useEffect(() => {
    const typing = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    };
    const down = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useWorld.getState();
      if (isMoveKey(e.code)) {
        if (s.overlay !== "none") return;
        input.keys.add(e.code);
        if (e.code.startsWith("Arrow")) e.preventDefault();
        return;
      }
      if (s.overlay !== "none") return;
      if ((e.code === "KeyE" || e.code === "Enter") && s.nearby) s.openPanel(s.nearby);
      else if (e.code === "KeyM") s.openOverlay("map");
      else if (e.code === "KeyN" || e.key === "/") {
        e.preventDefault();
        s.openOverlay("nova");
      } else if (e.key === "?") s.openOverlay("help");
    };
    const up = (e: KeyboardEvent) => input.keys.delete(e.code);
    const blur = () => resetInput();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    const unsub = useWorld.subscribe((s, prev) => {
      if (s.overlay !== "none" && prev.overlay === "none") resetInput();
    });
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      unsub();
    };
  }, []);

  // Drag-to-look (mouse and touch). No pointer lock: it's less surprising and works everywhere.
  useEffect(() => {
    const dom = get().gl.domElement;
    let active: number | null = null;
    let lx = 0;
    let ly = 0;
    const downH = (e: PointerEvent) => {
      if (active !== null) return;
      active = e.pointerId;
      lx = e.clientX;
      ly = e.clientY;
    };
    const moveH = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      input.look.x += e.clientX - lx;
      input.look.y += e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
    };
    const upH = (e: PointerEvent) => {
      if (e.pointerId === active) active = null;
    };
    dom.addEventListener("pointerdown", downH);
    window.addEventListener("pointermove", moveH);
    window.addEventListener("pointerup", upH);
    window.addEventListener("pointercancel", upH);
    dom.style.touchAction = "none";
    return () => {
      dom.removeEventListener("pointerdown", downH);
      window.removeEventListener("pointermove", moveH);
      window.removeEventListener("pointerup", upH);
      window.removeEventListener("pointercancel", upH);
    };
  }, [get]);

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.12);
    const s = state.current;
    const world = useWorld.getState();
    if (world.poster) {
      // Tooling: elevated establishing shot for the hero poster.
      camera.position.set(-30, 30, 96);
      camera.lookAt(6, 0, 0);
      return;
    }

    // Travel requests
    if (world.travel && world.travel.nonce !== lastNonce.current) {
      lastNonce.current = world.travel.nonce;
      const d = destinationById(world.travel.id);
      const [vx, vz] = d.viewpoint;
      const dist = Math.hypot(vx - player.x, vz - player.z);
      const toYaw = yawTowards(vx, vz, d.position[0], d.position[1]);
      const eyeY = groundHeight(vx, vz) + EYE;
      const toPitch = Math.atan2((d.lookHeight ?? 4) - eyeY, Math.hypot(d.position[0] - vx, d.position[1] - vz));
      flight.current = {
        id: d.id,
        t: 0,
        dur: world.reducedMotion ? 0 : Math.min(3.2, Math.max(1.1, dist / 24)),
        from: [player.x, s.y, player.z, player.yaw, s.pitch],
        to: [vx, eyeY, vz, player.yaw + wrap(toYaw - player.yaw), toPitch],
        arc: Math.min(16, dist * 0.22),
      };
      s.vx = s.vz = 0;
      s.intro = 0;
      world.setTravelling(true);
    }

    const f = flight.current;
    if (f) {
      f.t = f.dur === 0 ? 1 : Math.min(1, f.t + dt / f.dur);
      const k = easeInOut(f.t);
      player.x = f.from[0] + (f.to[0] - f.from[0]) * k;
      player.z = f.from[2] + (f.to[2] - f.from[2]) * k;
      s.y = f.from[1] + (f.to[1] - f.from[1]) * k + Math.sin(Math.PI * k) * f.arc;
      player.yaw = f.from[3] + (f.to[3] - f.from[3]) * k;
      s.pitch = f.from[4] + (f.to[4] - f.from[4]) * k - Math.sin(Math.PI * k) * 0.25;
      if (f.t >= 1) {
        flight.current = null;
        player.yaw = wrap(player.yaw);
        world.setTravelling(false);
        world.openPanel(f.id);
      }
    } else {
      // Look
      if (input.look.x || input.look.y) {
        player.yaw -= input.look.x * LOOK_SPEED;
        s.pitch = Math.max(-1.1, Math.min(0.85, s.pitch - input.look.y * LOOK_SPEED));
        input.look.x = input.look.y = 0;
      }
      // Move
      const k = input.keys;
      let fwd = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) + input.stick.y;
      let side = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0) + input.stick.x;
      // Arrow left/right turn instead of strafing, which is friendlier for keyboard-only users.
      const turn = (k.has("ArrowLeft") ? 1 : 0) - (k.has("ArrowRight") ? 1 : 0);
      if (turn) player.yaw += turn * dt * 1.9;
      const len = Math.hypot(fwd, side);
      if (len > 1) {
        fwd /= len;
        side /= len;
      }
      const speed = k.has("ShiftLeft") || k.has("ShiftRight") || Math.hypot(input.stick.x, input.stick.y) > 0.92 ? RUN : WALK;
      const sin = Math.sin(player.yaw);
      const cos = Math.cos(player.yaw);
      const tx = (-sin * fwd + cos * side) * speed;
      const tz = (-cos * fwd - sin * side) * speed;
      const damp = 1 - Math.exp(-dt * 10);
      s.vx += (tx - s.vx) * damp;
      s.vz += (tz - s.vz) * damp;
      if (Math.abs(s.vx) + Math.abs(s.vz) > 0.001) {
        const [nx, nz] = resolveMove(player.x, player.z, s.vx * dt, s.vz * dt);
        player.x = nx;
        player.z = nz;
        if (len > 0) s.intro = 0;
        if (len > 0 && world.tour.active && !world.tour.paused) world.pauseTour(true);
      }
      const ground = groundHeight(player.x, player.z) + EYE;
      // Intro: settle down from above on first load.
      s.intro = Math.max(0, s.intro - dt * 0.45);
      const introLift = easeInOut(s.intro) * 16;
      s.y += (ground + introLift - s.y) * (1 - Math.exp(-dt * 8));
    }

    camera.position.set(player.x, s.y, player.z);
    camera.rotation.set(s.pitch, player.yaw, 0, "YXZ");

    // Proximity check, a few times per second.
    if (++s.frame % 8 === 0) {
      let near: DistrictId | null = null;
      let best = Infinity;
      for (const d of destinations) {
        const dd = Math.hypot(d.position[0] - player.x, d.position[1] - player.z);
        const r = nearRadius(d);
        if (dd < r && dd / r < best) {
          best = dd / r;
          near = d.id;
        }
      }
      world.setNearby(near);
    }
  });

  return null;
}
