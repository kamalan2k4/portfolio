import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type InstancedMesh, Object3D } from "three";

const ROUTES = [
  { r: 70, h: 34, speed: 0.05, phase: 0 },
  { r: 55, h: 42, speed: -0.04, phase: 2 },
  { r: 90, h: 38, speed: 0.03, phase: 4 },
  { r: 62, h: 48, speed: 0.035, phase: 1 },
];

const o = new Object3D();

/** Autonomous air taxis on wide orbits: three instanced draws (body, canopy, light ring). */
export function AirTaxis({ animate }: { animate: boolean }) {
  const body = useRef<InstancedMesh>(null);
  const canopy = useRef<InstancedMesh>(null);
  const glow = useRef<InstancedMesh>(null);
  const started = useRef(false);

  useFrame(({ clock }) => {
    if (!animate && started.current) return;
    started.current = true;
    const t = animate ? clock.elapsedTime : 0;
    ROUTES.forEach((route, i) => {
      const a = route.phase + t * route.speed;
      const x = Math.cos(a) * route.r;
      const y = route.h + Math.sin(t * 0.5 + i) * 0.6;
      const z = Math.sin(a) * route.r * 0.8;
      const yaw = -a + (route.speed > 0 ? 0 : Math.PI);
      o.rotation.set(0, yaw, 0);
      o.position.set(x, y, z);
      o.scale.set(1.6, 0.5, 0.7);
      o.updateMatrix();
      body.current?.setMatrixAt(i, o.matrix);
      o.position.set(x, y + 0.25, z);
      o.scale.set(0.9, 0.35, 0.55);
      o.updateMatrix();
      canopy.current?.setMatrixAt(i, o.matrix);
      o.position.set(x, y - 0.45, z);
      o.rotation.set(Math.PI / 2, 0, yaw);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      glow.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [body.current, canopy.current, glow.current]) if (m) m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, ROUTES.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#eef1ec" roughness={0.3} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={canopy} args={[undefined, undefined, ROUTES.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#1b3a3a" roughness={0.1} metalness={0.5} />
      </instancedMesh>
      <instancedMesh ref={glow} args={[undefined, undefined, ROUTES.length]} frustumCulled={false}>
        <torusGeometry args={[1.1, 0.06, 6, 24]} />
        <meshBasicMaterial color="#f2b45a" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
