import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Group, type Mesh, MeshBasicMaterial } from "three";
import { destinationById } from "@/content/destinations";
import { projectsIn } from "@/content/projects";
import type { DistrictId, Project } from "@/content/types";
import { player } from "../input";
import { useWorld } from "../store";
import { exhibitTexture } from "./exhibitTexture";
import { Batch, part, type Part, ring, useMaterial } from "./kit";
import { PAD, useColliders, useLandmarkHandlers } from "./Landmarks";
import { useDispose } from "./useDispose";

const LOAD_DISTANCE = 70;
type V3 = [number, number, number];

/** Local frame of a district: centre on its plateau, facing its viewpoint. */
function useDistrict(id: DistrictId) {
  const d = destinationById(id);
  const facing = Math.atan2(d.viewpoint[0] - d.position[0], d.viewpoint[1] - d.position[1]);
  return { d, facing, origin: [d.position[0], PAD, d.position[1]] as V3 };
}

/** Becomes true once the visitor first comes within range (distance-based loading). */
function useApproached(id: DistrictId) {
  const d = destinationById(id);
  const [near, setNear] = useState(false);
  const frame = useRef(0);
  useFrame(() => {
    if (near || ++frame.current % 15) return;
    if (Math.hypot(d.position[0] - player.x, d.position[1] - player.z) < LOAD_DISTANCE) setNear(true);
  });
  return near;
}

/** Exhibit slots on an arc in front of the district, leaving the approach path clear. */
function arc(count: number, radius: number, facing: number, spread = 1.45, gap = 0.32) {
  const half = Math.ceil(count / 2);
  return Array.from({ length: count }, (_, i) => {
    const side = i < half ? -1 : 1;
    const k = i < half ? i : i - half;
    const n = i < half ? half : count - half;
    const a = facing + side * (gap + ((k + 0.5) / n) * (spread - gap));
    return { x: Math.sin(a) * radius, z: Math.cos(a) * radius, rot: a };
  });
}

function exhibitParts(slots: Slot[], accent: string): Part[] {
  return slots.flatMap(({ x, z, rot }) => [
    part.cyl("stoneAlt", 0.55, 0.7, 0.9, 12, { p: [x, 0.45, z] }),
    part.box("stoneLight", [0.18, 1.9, 0.18], { p: [x, 1.6, z], r: [0, rot, 0] }),
    part.box("dark", [3.5, 2.3, 0.12], { p: [x + Math.sin(rot) * -0.08, 2.95, z + Math.cos(rot) * -0.08], r: [-0.12, rot, 0] }),
    part.box(`glow:${accent}`, [3.5, 0.06, 0.14], { p: [x, 1.76, z], r: [-0.12, rot, 0] }),
  ]);
}

function Exhibit({ project, district, slot, load, scale }: { project: Project; district: DistrictId; slot: Slot; load: boolean; scale: number }) {
  const material = useMemo(() => new MeshBasicMaterial({ color: project.accent }), [project.accent]);
  const mesh = useRef<Mesh>(null);
  useDispose(material);
  useEffect(() => {
    if (!load) return;
    let alive = true;
    exhibitTexture(project, scale)
      .then((tex) => {
        const m = mesh.current?.material as MeshBasicMaterial | undefined;
        if (!alive || !m) return;
        m.map = tex;
        m.color.set("#ffffff");
        m.needsUpdate = true;
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [load, project, scale]);

  const open = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useWorld.getState().openProject(project.slug, district);
  };
  return (
    <mesh
      ref={mesh}
      material={material}
      position={[slot.x, 2.95, slot.z]}
      rotation={[-0.12, slot.rot, 0, "YXZ"]}
      onClick={open}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <planeGeometry args={[3.3, 2.06]} />
    </mesh>
  );
}

type Slot = { x: number; z: number; rot: number };

function Exhibits({ id, slots, scale }: { id: DistrictId; slots: Slot[]; scale: number }) {
  const load = useApproached(id);
  const items = projectsIn(id);
  const [cx, cz] = destinationById(id).position;
  useColliders(slots.map((s) => ({ x: cx + s.x, z: cz + s.z, r: 0.9 })));
  return (
    <>
      {items.map((p, i) => (
        <Exhibit key={p.slug} project={p} district={id} slot={slots[i]} load={load} scale={scale} />
      ))}
    </>
  );
}

function useSpin(speed: number) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current && !useWorld.getState().reducedMotion) ref.current.rotation.y += dt * speed;
  });
  return ref;
}

// ---------- districts ----------

export function AIDome({ shadows, texScale }: { shadows: boolean; texScale: number }) {
  const { d, facing, origin } = useDistrict("ai-dome");
  const handlers = useLandmarkHandlers("ai-dome");
  const core = useSpin(0.6);
  const coreMat = useMaterial("glow:#b9a3ff");
  useColliders([{ x: d.position[0], z: d.position[1], r: 4.6 }]);
  const slots = useMemo(() => arc(projectsIn("ai-dome").length, 7.2, facing), [facing]);
  const parts = useMemo<Part[]>(() => {
    return [
      part.cyl("stone", 4.6, 4.9, 0.5, 32, { p: [0, 0.25, 0] }),
      part.sphere("glass:#cbbcff", 4.3, { p: [0, 0.5, 0] }, 24, 12, Math.PI * 2, Math.PI / 2),
      ...ring(6, (a) => part.torus("stoneLight", 4.32, 0.07, Math.PI, { p: [0, 0.5, 0], r: [0, a, 0] }, 32)),
      ...[1.6, 3.1].map((y) => part.torus("stoneLight", Math.sqrt(4.32 ** 2 - (y - 0.5) ** 2), 0.07, Math.PI * 2, { p: [0, y, 0], r: [Math.PI / 2, 0, 0] }, 48)),
      part.cyl("stoneAlt", 0.9, 1.2, 1.4, 16, { p: [0, 1.2, 0] }),
      ...exhibitParts(slots, d.accent),
    ];
  }, [d.accent, slots]);
  return (
    <group position={origin}>
      <Batch parts={parts} shadows={shadows} {...handlers} />
      <group ref={core} position={[0, 3, 0]} {...handlers}>
        <mesh material={coreMat}>
          <octahedronGeometry args={[0.8]} />
        </mesh>
        <mesh material={coreMat} rotation-x={Math.PI / 2.4}>
          <torusGeometry args={[1.4, 0.04, 6, 48]} />
        </mesh>
      </group>
      <Exhibits id="ai-dome" slots={slots} scale={texScale} />
    </group>
  );
}

export function InnovationDistrict({ shadows, texScale }: { shadows: boolean; texScale: number }) {
  const { d, facing, origin } = useDistrict("innovation");
  const handlers = useLandmarkHandlers("innovation");
  useColliders([{ x: d.position[0] + Math.sin(facing + Math.PI) * 2, z: d.position[1] + Math.cos(facing + Math.PI) * 2, r: 4 }]);
  const slots = useMemo(() => arc(projectsIn("innovation").length, 6.8, facing, 1.25, 0.3), [facing]);
  const parts = useMemo<Part[]>(() => {
    const back = (dist: number, side: number, y: number): V3 => [Math.sin(facing + Math.PI) * dist + Math.cos(facing) * side, y, Math.cos(facing + Math.PI) * dist - Math.sin(facing) * side];
    return [
      // Three stacked, offset glass pavilions behind the exhibits
      part.box("stone", [7, 0.6, 5], { p: back(2.2, 0, 0.3), r: [0, facing, 0] }),
      part.box("glass:#f6d39a", [5.4, 2.6, 3.8], { p: back(2.2, -0.6, 1.9), r: [0, facing, 0] }),
      part.box("stoneLight", [6, 0.3, 4.4], { p: back(2.2, -0.6, 3.35), r: [0, facing, 0] }),
      part.box("glass:#f6d39a", [4.2, 2.2, 3.2], { p: back(2.6, 0.9, 4.6), r: [0, facing + 0.18, 0] }),
      part.box("stoneLight", [4.8, 0.25, 3.8], { p: back(2.6, 0.9, 5.85), r: [0, facing + 0.18, 0] }),
      part.box("glass:#f6d39a", [2.8, 1.8, 2.4], { p: back(2.4, 0.2, 6.95), r: [0, facing - 0.12, 0] }),
      part.box("glow:#f2b45a", [2.9, 0.08, 2.5], { p: back(2.4, 0.2, 7.9), r: [0, facing - 0.12, 0] }),
      ...[-2.7, 2.1].map((s) => part.box("stoneLight", [0.25, 3.4, 0.25], { p: back(0.3, s, 1.7), r: [0, facing, 0] })),
      ...exhibitParts(slots, d.accent),
    ];
  }, [d.accent, facing, slots]);
  return (
    <group position={origin}>
      <Batch parts={parts} shadows={shadows} {...handlers} />
      <Exhibits id="innovation" slots={slots} scale={texScale} />
    </group>
  );
}

export function ProductCity({ shadows, texScale }: { shadows: boolean; texScale: number }) {
  const { d, facing, origin } = useDistrict("product-city");
  const handlers = useLandmarkHandlers("product-city");
  const drop = useSpin(0.35);
  const dropMat = useMaterial("glass:#7fd8ff");
  const ringMat = useMaterial("glow:#ffb86b");
  const towers = useMemo(
    () =>
      [
        [-3.2, -2.6, 16, 1.6],
        [2.8, -3.4, 12, 1.4],
        [-0.6, -5.2, 20, 1.8],
        [4.8, -0.6, 9, 1.2],
      ].map(([sx, sz, h, w]) => {
        const c = Math.cos(facing);
        const s = Math.sin(facing);
        return { x: sx * c + sz * s, z: -sx * s + sz * c, h, w };
      }),
    [facing],
  );
  useColliders([...towers.map((t) => ({ x: d.position[0] + t.x, z: d.position[1] + t.z, r: t.w + 0.4 })), { x: d.position[0], z: d.position[1], r: 1.6 }]);
  // Single exhibit sits off to the side so the water-drop sculpture stays in view.
  const slots = useMemo(() => arc(1, 6.2, facing, 1.25, 0.65), [facing]);
  const parts = useMemo<Part[]>(
    () => [
      ...towers.flatMap((t) => [
        part.box("stone", [t.w * 2 + 0.6, 0.8, t.w * 2 + 0.6], { p: [t.x, 0.4, t.z], r: [0, facing, 0] }),
        part.box("glass:#ffd9a8", [t.w * 2, t.h, t.w * 2], { p: [t.x, t.h / 2 + 0.8, t.z], r: [0, facing, 0] }),
        part.box("stoneLight", [t.w * 2 + 0.2, 0.25, t.w * 2 + 0.2], { p: [t.x, t.h + 0.9, t.z], r: [0, facing, 0] }),
        ...[0.33, 0.66].map((k) => part.box("glow:#ffb86b", [t.w * 2 + 0.05, 0.06, t.w * 2 + 0.05], { p: [t.x, t.h * k + 0.8, t.z], r: [0, facing, 0] })),
      ]),
      part.cyl("stoneAlt", 1.4, 1.7, 1, 24, { p: [0, 0.5, 0] }),
      part.cyl("glow:#ffb86b", 1.2, 1.2, 0.05, 32, { p: [0, 1.02, 0] }),
      ...exhibitParts(slots, d.accent),
    ],
    [towers, facing, d.accent, slots],
  );
  return (
    <group position={origin}>
      <Batch parts={parts} shadows={shadows} {...handlers} />
      {/* CSBROS water-drop sculpture */}
      <group ref={drop} position={[0, 4.6, 0]} {...handlers}>
        <mesh material={dropMat}>
          <sphereGeometry args={[1.25, 32, 20]} />
        </mesh>
        <mesh material={dropMat} position={[0, 1.6, 0]}>
          <coneGeometry args={[1.1, 2.2, 32, 1, true]} />
        </mesh>
        <mesh material={ringMat} rotation-x={Math.PI / 2.3}>
          <torusGeometry args={[2.1, 0.05, 6, 64]} />
        </mesh>
      </group>
      <Exhibits id="product-city" slots={slots} scale={texScale} />
    </group>
  );
}

export function CreatorBay({ shadows, texScale }: { shadows: boolean; texScale: number }) {
  const { d, facing, origin } = useDistrict("creator-bay");
  const handlers = useLandmarkHandlers("creator-bay");
  const back = useMemo(() => (dist: number, side: number, y: number): V3 => [Math.sin(facing + Math.PI) * dist + Math.cos(facing) * side, y, Math.cos(facing + Math.PI) * dist - Math.sin(facing) * side], [facing]);
  useColliders([{ x: d.position[0] + back(2.6, 0, 0)[0], z: d.position[1] + back(2.6, 0, 0)[2], r: 3.6 }]);
  const slots = useMemo(() => arc(projectsIn("creator-bay").length, 6.4, facing, 1.1, 0.3), [facing]);
  const parts = useMemo<Part[]>(() => {
    const r: V3 = [0, facing, 0];
    return [
      part.box("stoneAlt", [9, 0.35, 6], { p: back(2.6, 0, 0.18), r }),
      part.box("glass:#cfe0ff", [8.4, 3, 0.12], { p: back(5.3, 0, 1.85), r }),
      part.box("glass:#cfe0ff", [0.12, 3, 4.6], { p: back(3, -4.15, 1.85), r }),
      ...[-4, 4].flatMap((s) => [1.2, 4.6].map((dd) => part.box("stoneLight", [0.2, 3.4, 0.2], { p: back(dd, s, 1.9), r }))),
      // Cantilevered roof, tilted up toward the view
      part.box("stoneLight", [11, 0.28, 7.6], { p: back(2.2, 0, 3.75), r: [0.06, facing, 0] }),
      part.box("glow:#8fb8ff", [11, 0.06, 0.1], { p: back(-1.6, 0, 3.55), r }),
      // Desk and stools inside
      part.box("stone", [3.4, 0.9, 1], { p: back(3.6, 1.4, 0.8), r }),
      part.box("dark", [1.2, 0.75, 0.06], { p: back(3.9, 1.4, 1.65), r }),
      ...exhibitParts(slots, d.accent),
    ];
  }, [back, facing, d.accent, slots]);
  return (
    <group position={origin}>
      <Batch parts={parts} shadows={shadows} {...handlers} />
      <Exhibits id="creator-bay" slots={slots} scale={texScale} />
    </group>
  );
}

export function KnowledgeFalls({ shadows }: { shadows: boolean }) {
  const { d, facing, origin } = useDistrict("knowledge-falls");
  const handlers = useLandmarkHandlers("knowledge-falls");
  const lanterns = useRef<Group>(null);
  const terrace: V3 = [Math.sin(facing + Math.PI) * 4.6, 0, Math.cos(facing + Math.PI) * 4.6];
  useColliders([
    { x: d.position[0], z: d.position[1], r: 2.2 },
    { x: d.position[0] + terrace[0], z: d.position[1] + terrace[2], r: 3.4 },
  ]);
  useFrame(({ clock }) => {
    if (!lanterns.current || useWorld.getState().reducedMotion) return;
    lanterns.current.position.y = Math.sin(clock.elapsedTime * 0.9) * 0.12;
  });
  const lanternParts = useMemo(() => ring(6, (a) => part.sphere("glow:#ffe2a8", 0.2, { p: [Math.sin(a) * 6.8, 2.75, Math.cos(a) * 6.8] }, 12, 8)), []);
  const parts = useMemo<Part[]>(() => {
    const r: V3 = [0, facing, 0];
    const back = (dist: number, side: number, y: number): V3 => [Math.sin(facing + Math.PI) * dist + Math.cos(facing) * side, y, Math.cos(facing + Math.PI) * dist - Math.sin(facing) * side];
    return [
      // Stepped reading terraces (half-rings opening toward the visitor)
      ...[0, 1, 2].map((i) => part.cyl(i % 2 ? "stoneAlt" : "stone", 3.6 - i * 1.1, 3.8 - i * 1.1, 0.4, 32, { p: back(4.6 + i * 0.5, 0, 0.2 + i * 0.4) })),
      // Open-book sculpture
      part.cyl("stoneAlt", 1.4, 1.7, 0.9, 16, { p: [0, 0.45, 0] }),
      part.box("stoneLight", [2.4, 0.08, 3], { p: back(0, -1.05, 1.5), r: [0, facing, 0.38] }),
      part.box("stoneLight", [2.4, 0.08, 3], { p: back(0, 1.05, 1.5), r: [0, facing, -0.38] }),
      part.box("glow:#9ccfd8", [0.08, 0.1, 3], { p: back(0, 0, 1.08), r }),
      // Benches facing the falls
      ...[-3.4, 3.4].map((s) => part.box("stoneAlt", [2.4, 0.45, 0.7], { p: back(-2.4, s, 0.5), r })),
      // Lantern posts
      ...ring(6, (a) => part.cyl("metal", 0.06, 0.08, 2.6, 6, { p: [Math.sin(a) * 6.8, 1.3, Math.cos(a) * 6.8] })),
    ];
  }, [facing]);
  return (
    <group position={origin}>
      <Batch parts={parts} shadows={shadows} {...handlers} />
      <group ref={lanterns}>
        <Batch parts={lanternParts} shadows={false} />
      </group>
    </group>
  );
}

export function LaunchTerminal({ shadows }: { shadows: boolean }) {
  const { d, facing, origin } = useDistrict("launch-terminal");
  const handlers = useLandmarkHandlers("launch-terminal");
  const beacon = useRef<Mesh>(null);
  const beaconMat = useMaterial("glow:#ff8a7a");
  const mast = useMemo<V3>(() => [Math.sin(facing + Math.PI) * 5.6 + Math.cos(facing) * 3.6, 0, Math.cos(facing + Math.PI) * 5.6 - Math.sin(facing) * 3.6], [facing]);
  useColliders([
    { x: d.position[0], z: d.position[1], r: 1.8 },
    { x: d.position[0] + mast[0], z: d.position[1] + mast[2], r: 1.2 },
  ]);
  useFrame(({ clock }) => {
    if (beacon.current) beacon.current.visible = useWorld.getState().reducedMotion || Math.sin(clock.elapsedTime * 3) > -0.2;
  });
  const parts = useMemo<Part[]>(
    () => [
      part.cyl("stone", 5.6, 5.9, 0.6, 40, { p: [0, 0.3, 0] }),
      part.torus("glow:#ff8a7a", 4.9, 0.08, Math.PI * 2, { p: [0, 0.62, 0], r: [Math.PI / 2, 0, 0] }, 64),
      part.box("stoneLight", [0.5, 0.04, 4], { p: [-1, 0.62, 0], r: [0, facing, 0] }),
      part.box("stoneLight", [0.5, 0.04, 4], { p: [1, 0.62, 0], r: [0, facing, 0] }),
      part.box("stoneLight", [2, 0.04, 0.5], { p: [0, 0.62, 0], r: [0, facing, 0] }),
      // Docked air taxi
      part.sphere("stoneLight", 1, { p: [0, 1.5, 0], s: [1.9, 0.62, 0.9], r: [0, facing + Math.PI / 2, 0] }),
      part.torus("glow:#f2b45a", 1.25, 0.06, Math.PI * 2, { p: [0, 1.05, 0], r: [Math.PI / 2, 0, 0] }, 32),
      part.sphere("dark", 1, { p: [0, 1.85, 0], s: [1.05, 0.42, 0.62], r: [0, facing + Math.PI / 2, 0] }),
      ...[-1, 1].map((s) => part.box("metal", [0.12, 0.7, 0.12], { p: [Math.cos(facing) * s * 1.1, 0.95, -Math.sin(facing) * s * 1.1] })),
      // Control mast
      part.cyl("stoneLight", 0.35, 0.55, 9, 12, { p: [mast[0], 4.5, mast[2]] }),
      part.cyl("glass:#ffc2b8", 1.1, 0.9, 1.4, 12, { p: [mast[0], 9.4, mast[2]] }),
      part.cyl("stoneLight", 1.25, 1.25, 0.15, 12, { p: [mast[0], 10.2, mast[2]] }),
    ],
    [facing, mast],
  );
  return (
    <group position={origin}>
      <Batch parts={parts} shadows={shadows} {...handlers} />
      <mesh ref={beacon} position={[mast[0], 10.6, mast[2]]} material={beaconMat}>
        <sphereGeometry args={[0.22, 12, 8]} />
      </mesh>
    </group>
  );
}
