import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, Color, DoubleSide, type Group, type InstancedMesh, type Mesh, Object3D, ShaderMaterial } from "three";
import { destinationById, destinations } from "@/content/destinations";
import type { DistrictId } from "@/content/types";
import { player } from "../input";
import { useWorld } from "../store";
import { registerColliders } from "../terrain";
import { Batch, part, type Part, ring, useMaterial } from "./kit";
import { useDispose } from "./useDispose";

export const PAD = 0.45;

/** Shared click/hover behaviour: open the panel when close, otherwise travel there. */
export function useLandmarkHandlers(id: DistrictId) {
  return useMemo(
    () => ({
      onClick: (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const s = useWorld.getState();
        if (s.nearby === id) s.openPanel(id);
        else s.travelTo(id);
      },
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        document.body.style.cursor = "";
      },
    }),
    [id],
  );
}

/** Registers circular building footprints for the lifetime of the component. */
export function useColliders(list: { x: number; z: number; r: number }[]) {
  const key = JSON.stringify(list);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => registerColliders(list), [key]);
}

/** Soft vertical light beam marking a district on the horizon. */
export function Beacon({ id }: { id: DistrictId }) {
  const d = destinationById(id);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        uniforms: { color: { value: new Color(d.accent) }, strength: { value: 0.35 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 color; uniform float strength; varying vec2 vUv;
          void main(){ float a = smoothstep(0.0, 0.22, vUv.y) * pow(1.0 - vUv.y, 1.4) * strength; gl_FragColor = vec4(color * a, a); }`,
      }),
    [d.accent],
  );
  const mesh = useRef<Mesh>(null);
  useDispose(material);
  useFrame(() => {
    if (!mesh.current) return;
    // Bright when it's the travel/tour target, faint up close so it never hides the landmark.
    const dist = Math.hypot(d.position[0] - player.x, d.position[1] - player.z);
    const near = Math.min(1, Math.max(0.15, (dist - 12) / 40));
    const target = (useWorld.getState().highlight === id ? 1 : 0.4) * near;
    const u = (mesh.current.material as ShaderMaterial).uniforms.strength;
    u.value += (target - u.value) * 0.06;
  });
  return (
    <mesh ref={mesh} position={[d.position[0], 40, d.position[1]]} material={material} renderOrder={2}>
      <cylinderGeometry args={[0.9, 1.4, 80, 16, 1, true]} />
    </mesh>
  );
}

export function ArrivalGate({ shadows }: { shadows: boolean }) {
  const [x, z] = destinationById("arrival").position;
  const handlers = useLandmarkHandlers("arrival");
  useColliders([
    { x: x - 4.2, z, r: 1 },
    { x: x + 4.2, z, r: 1 },
  ]);
  const parts = useMemo<Part[]>(
    () => [
      ...[-1, 1].flatMap((s) => [
        part.box("stone", [1.2, 6.4, 1.2], { p: [s * 4.2, 3.2, 0] }),
        part.box("stoneAlt", [1.6, 0.5, 1.6], { p: [s * 4.2, 6.6, 0] }),
        part.box("stoneAlt", [1.6, 0.4, 1.6], { p: [s * 4.2, 0.2, 0] }),
      ]),
      part.torus("glow:#f2b45a", 4.2, 0.16, Math.PI, { p: [0, 6.6, 0] }),
      part.torus("metal", 4.6, 0.1, Math.PI, { p: [0, 6.6, 0] }),
    ],
    [],
  );
  return <Batch parts={parts} shadows={shadows} position={[x, PAD, z]} {...handlers} />;
}

export function Nexus({ shadows }: { shadows: boolean }) {
  const holo = useRef<Group>(null);
  const handlers = useLandmarkHandlers("nexus");
  const holoMat = useMaterial("glow:#7dd3c0");
  useColliders([{ x: 0, z: 0, r: 2.6 }]);
  useFrame((_, dt) => {
    if (holo.current && !useWorld.getState().reducedMotion) holo.current.rotation.y += dt * 0.15;
  });
  const parts = useMemo<Part[]>(
    () => [
      part.cyl("stone", 1.8, 2.3, 1.1, 32, { p: [0, 0.9, 0] }),
      part.cyl("glow:#7dd3c0", 1.6, 1.6, 0.06, 48, { p: [0, 1.48, 0] }),
      part.torus("stoneLight", 4.2, 0.1, Math.PI * 2, { p: [0, 0.42, 0], r: [Math.PI / 2, 0, 0] }, 96),
      part.torus("stoneLight", 8.4, 0.1, Math.PI * 2, { p: [0, 0.42, 0], r: [Math.PI / 2, 0, 0] }, 128),
      // Glass sails around the plaza
      ...ring(
        6,
        (a) => {
          const p = (dx: number, y: number): [number, number, number] => [Math.sin(a) * (10 + dx), y, Math.cos(a) * (10 + dx)];
          return [
            part.box("glass:#a9ded3", [0.12, 6.4, 2.6], { p: p(0, 3.6), r: [0, a, 0.08] }),
            part.box("stoneAlt", [0.6, 0.6, 3], { p: p(0, 0.7), r: [0, a, 0] }),
            part.box("glow:#7dd3c0", [0.16, 0.08, 2.6], { p: p(0.25, 6.85), r: [0, a, 0] }),
          ];
        },
        Math.PI / 6,
      ).flat(),
      // Benches between sails
      ...ring(6, (a) => part.box("stoneAlt", [2.4, 0.45, 0.7], { p: [Math.sin(a) * 6.3, 0.62, Math.cos(a) * 6.3], r: [0, a, 0] })),
    ],
    [],
  );
  return (
    <group>
      <Batch parts={parts} shadows={shadows} {...handlers} />
      <group ref={holo} position={[0, 2.6, 0]} {...handlers}>
        <mesh rotation-x={-Math.PI / 2} material={holoMat}>
          <ringGeometry args={[1.3, 1.42, 64]} />
        </mesh>
        <HoloDots />
      </group>
    </group>
  );
}

export function Citadel({ shadows }: { shadows: boolean }) {
  const [x, z] = destinationById("citadel").position;
  const crown = useRef<Mesh>(null);
  const crownMat = useMaterial("glow:#f2b45a");
  const handlers = useLandmarkHandlers("citadel");
  useColliders([{ x, z, r: 6.6 }]);
  useFrame(({ clock }) => {
    if (crown.current && !useWorld.getState().reducedMotion) crown.current.position.y = 19.6 + Math.sin(clock.elapsedTime * 0.8) * 0.15;
  });
  const parts = useMemo<Part[]>(
    () => [
      part.cyl("stone", 6.2, 6.5, 1.2, 8, { p: [0, 0.6, 0] }),
      part.cyl("stoneAlt", 5.2, 5.5, 1.2, 8, { p: [0, 1.8, 0] }),
      part.cyl("stone", 4.2, 4.5, 1.2, 8, { p: [0, 3, 0] }),
      part.cyl("glass:#bfe3da", 2.6, 3.4, 14, 6, { p: [0, 10.6, 0] }),
      part.cyl("stoneLight", 1.2, 1.6, 14, 6, { p: [0, 10.6, 0] }),
      part.cyl("stoneLight", 2.9, 2.9, 0.3, 6, { p: [0, 17.7, 0] }),
      ...ring(6, (a) => part.box("stoneLight", [0.16, 14, 0.16], { p: [Math.sin(a) * 3, 10.6, Math.cos(a) * 3], r: [0, a, 0] })),
      // Floor bands of light through the glass
      ...[6.5, 10, 13.5].map((y) => part.cyl("glow:#f6dcae", 2.75 - (y - 3.6) * 0.057, 2.75 - (y - 3.6) * 0.057, 0.06, 6, { p: [0, y, 0] })),
      // Entrance facing the Nexus
      part.box("glow:#b77a35", [2.4, 3.2, 0.3], { p: [0, 2.2, 6.25] }),
      part.box("stoneLight", [3.2, 0.4, 0.8], { p: [0, 4, 6.2] }),
      ...[-1, 1].map((s) => part.box("stoneLight", [0.4, 3.6, 0.8], { p: [s * 1.6, 2.2, 6.2] })),
    ],
    [],
  );
  return (
    <group position={[x, PAD, z]} {...handlers}>
      <Batch parts={parts} shadows={shadows} />
      <mesh ref={crown} position={[0, 19.6, 0]} rotation-x={Math.PI / 2} material={crownMat}>
        <torusGeometry args={[2.6, 0.14, 8, 48]} />
      </mesh>
    </group>
  );
}

/** District dots on the Nexus hologram: one instanced draw. */
function HoloDots() {
  const ref = useRef<InstancedMesh>(null);
  const dots = destinations.filter((d) => d.id !== "nexus" && d.id !== "arrival");
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    const c = new Color();
    dots.forEach((d, i) => {
      o.position.set(d.position[0] / 38, 0, d.position[1] / 38);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(d.accent));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [dots]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, dots.length]}>
      <sphereGeometry args={[0.09, 12, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
