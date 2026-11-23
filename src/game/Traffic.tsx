import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, type BufferGeometry, Color, CylinderGeometry, type InstancedMesh, MeshBasicMaterial, MeshStandardMaterial, Object3D } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useDispose } from "@/world/scene/useDispose";
import { cars } from "./vehicles";

const PAINT = ["#c7ccd6", "#1e2230", "#b3261e", "#e0b422", "#2f6fdb", "#f2f2f2", "#3c3f46", "#0f8f7a", "#ff3b3b", "#ffb020", "#3b6bff"].map((c) => new Color(c));

function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new BoxGeometry(w, h, d).translate(x, y, z);
  g.deleteAttribute("uv");
  return g;
}

/** A low-poly car, front toward -Z, split by material so each part is one instanced draw. */
function carGeometry() {
  const wheel = (x: number, z: number) => {
    const g = new CylinderGeometry(0.42, 0.42, 0.32, 12).rotateZ(Math.PI / 2).translate(x, 0.42, z);
    g.deleteAttribute("uv");
    return g;
  };
  const merge = (parts: BufferGeometry[]) => mergeGeometries(parts)!;
  return {
    body: merge([box(1.95, 0.62, 4.4, 0, 0.62, 0), box(1.75, 0.18, 1.0, 0, 0.98, -1.55), box(1.8, 0.16, 0.8, 0, 0.98, 1.7)]),
    cabin: merge([box(1.62, 0.58, 2.1, 0, 1.2, 0.15)]),
    wheels: merge([wheel(0.95, -1.35), wheel(-0.95, -1.35), wheel(0.95, 1.4), wheel(-0.95, 1.4)]),
    head: merge([box(0.45, 0.14, 0.05, 0.62, 0.72, -2.21), box(0.45, 0.14, 0.05, -0.62, 0.72, -2.21)]),
    tail: merge([box(0.5, 0.14, 0.05, 0.62, 0.74, 2.21), box(0.5, 0.14, 0.05, -0.62, 0.74, 2.21)]),
  };
}

/** Car parts, body first (it carries the per-car paint). */
const PARTS = ["body", "cabin", "wheels", "head", "tail"] as const;

/** All cars, traffic and parked hero cars, in five instanced draws. */
export function Traffic() {
  const meshes = useRef<(InstancedMesh | null)[]>([]);
  const geo = useMemo(() => carGeometry(), []);
  const mats = useMemo(
    () => ({
      body: new MeshStandardMaterial({ roughness: 0.35, metalness: 0.6 }),
      cabin: new MeshStandardMaterial({ color: "#0b1018", roughness: 0.08, metalness: 0.9 }),
      wheels: new MeshStandardMaterial({ color: "#111214", roughness: 0.9 }),
      head: new MeshBasicMaterial({ color: new Color("#fff4d6").multiplyScalar(2.2), toneMapped: false }),
      tail: new MeshBasicMaterial({ color: new Color("#ff2a2a").multiplyScalar(1.8), toneMapped: false }),
    }),
    [],
  );
  useDispose(geo.body, geo.cabin, geo.wheels, geo.head, geo.tail, mats.body, mats.cabin, mats.wheels, mats.head, mats.tail);
  const o = useMemo(() => new Object3D(), []);

  useFrame(() => {
    const list = meshes.current;
    if (list.length < PARTS.length || list.some((m) => !m)) return;
    cars.forEach((c, i) => {
      o.position.set(c.x, c.y, c.z);
      o.rotation.set(c.rot.x, c.yaw + c.rot.y, c.rot.z, "YXZ");
      const s = c.kind === 1 ? 1 : 1.04;
      o.scale.set(s, c.kind === 1 ? 0.86 : 1, s);
      o.updateMatrix();
      for (const m of list) m!.setMatrixAt(i, o.matrix);
    });
    for (const m of list) m!.instanceMatrix.needsUpdate = true;
  });

  // Paint before the first render so the shader compiles with instance colours.
  useLayoutEffect(() => {
    const body = meshes.current[0];
    if (!body) return;
    cars.forEach((c, i) => body.setColorAt(i, PAINT[c.color % PAINT.length]));
    body.instanceColor!.needsUpdate = true;
  }, []);

  return (
    <group>
      {PARTS.map((k, i) => (
        <instancedMesh key={k} ref={(m) => void (meshes.current[i] = m)} args={[geo[k], mats[k], cars.length]} frustumCulled={false} />
      ))}
    </group>
  );
}
