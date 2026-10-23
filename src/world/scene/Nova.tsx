import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { type Group, Vector3 } from "three";
import { useWorld } from "../store";

const OFFSET = new Vector3(-1.35, -0.45, -3.2);
const target = new Vector3();
const look = new Vector3();

/** NOVA: the silent guide robot that floats at the visitor's shoulder. Click to talk. */
export function Nova() {
  const group = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const camera = useThree((s) => s.camera);
  const first = useRef(true);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const reduced = useWorld.getState().reducedMotion;
    target.copy(OFFSET).applyQuaternion(camera.quaternion).add(camera.position);
    if (!reduced) target.y += Math.sin(clock.elapsedTime * 1.6) * 0.08;
    if (first.current) {
      g.position.copy(target);
      first.current = false;
    } else {
      g.position.lerp(target, 1 - Math.exp(-dt * 4));
    }
    look.copy(camera.position);
    g.lookAt(look);
    if (eyes.current && !reduced) {
      const blink = Math.sin(clock.elapsedTime * 0.9) > 0.985 ? 0.15 : 1;
      eyes.current.scale.y = blink;
    }
  });

  const open = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    useWorld.getState().openOverlay("nova");
  };

  return (
    <group
      ref={group}
      scale={0.42}
      onClick={open}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      {/* Head */}
      <mesh>
        <sphereGeometry args={[0.62, 32, 24]} />
        <meshStandardMaterial color="#eef1ec" roughness={0.25} metalness={0.15} />
      </mesh>
      {/* Visor (faces the camera: +z after lookAt) */}
      <mesh position={[0, 0.04, 0.36]} scale={[1, 0.62, 0.55]}>
        <sphereGeometry args={[0.5, 32, 16]} />
        <meshStandardMaterial color="#0d1d1a" roughness={0.1} metalness={0.6} />
      </mesh>
      <group ref={eyes} position={[0, 0.06, 0.62]}>
        {[-0.17, 0.17].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <capsuleGeometry args={[0.055, 0.08, 4, 8]} />
            <meshBasicMaterial color="#7dd3c0" toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* Antenna */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.24, 6]} />
        <meshStandardMaterial color="#b9b3a3" />
      </mesh>
      <mesh position={[0, 0.88, 0]}>
        <sphereGeometry args={[0.06, 12, 8]} />
        <meshBasicMaterial color="#f2b45a" toneMapped={false} />
      </mesh>
      {/* Orbit ring body */}
      <mesh position={[0, -0.72, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.36, 0.07, 10, 32]} />
        <meshStandardMaterial color="#d9cfba" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.72, 0]}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshBasicMaterial color="#7dd3c0" toneMapped={false} />
      </mesh>
    </group>
  );
}
