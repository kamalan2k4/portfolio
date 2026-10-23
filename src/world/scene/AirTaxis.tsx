import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

const ROUTES = [
  { r: 70, h: 34, speed: 0.05, phase: 0 },
  { r: 55, h: 42, speed: -0.04, phase: 2 },
  { r: 90, h: 38, speed: 0.03, phase: 4 },
  { r: 62, h: 48, speed: 0.035, phase: 1 },
];

/** A handful of autonomous air taxis drifting along wide orbits above the park. */
export function AirTaxis({ animate }: { animate: boolean }) {
  const refs = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = animate ? clock.elapsedTime : 0;
    ROUTES.forEach((route, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = route.phase + t * route.speed;
      g.position.set(Math.cos(a) * route.r, route.h + Math.sin(t * 0.5 + i) * 0.6, Math.sin(a) * route.r * 0.8);
      g.rotation.y = -a + (route.speed > 0 ? 0 : Math.PI);
    });
  });
  return (
    <group>
      {ROUTES.map((_, i) => (
        <group key={i} ref={(g) => void (refs.current[i] = g)}>
          <mesh scale={[1.6, 0.5, 0.7]}>
            <sphereGeometry args={[1, 16, 10]} />
            <meshStandardMaterial color="#eef1ec" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.25, 0]} scale={[0.9, 0.35, 0.55]}>
            <sphereGeometry args={[1, 16, 10]} />
            <meshStandardMaterial color="#1b3a3a" roughness={0.1} metalness={0.5} />
          </mesh>
          <mesh position={[0, -0.45, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[1.1, 0.06, 6, 24]} />
            <meshBasicMaterial color="#f2b45a" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
