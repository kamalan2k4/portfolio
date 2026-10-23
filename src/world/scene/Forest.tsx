import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { type BufferGeometry, Color, ConeGeometry, CylinderGeometry, DodecahedronGeometry, IcosahedronGeometry, InstancedMesh, MeshStandardMaterial, Object3D, type WebGLProgramParametersWithUniforms } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useDispose } from "./useDispose";
import { isOpenGround, mulberry32, terrainHeight } from "../terrain";

/** Shared wind clock for all foliage shaders. */
const wind = { value: 0 };

type Placement = { x: number; y: number; z: number; s: number; r: number; kind: 0 | 1 };

function scatter(count: number, seed: number) {
  const rnd = mulberry32(seed);
  const out: Placement[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 30) {
    // Bias toward the outer ring so the centre stays readable.
    const r = 14 + Math.pow(rnd(), 0.7) * 120;
    const a = rnd() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!isOpenGround(x, z, 1)) continue;
    const y = terrainHeight(x, z);
    if (y > 34 || y < 0) continue;
    // Clumping via noise-ish rejection.
    if (Math.sin(x * 0.21) * Math.cos(z * 0.17) < -0.45 && rnd() < 0.7) continue;
    out.push({ x, y, z, s: 0.75 + rnd() * 0.75, r: rnd() * Math.PI * 2, kind: rnd() < 0.62 ? 0 : 1 });
  }
  return out;
}

function windify(mat: MeshStandardMaterial) {
  mat.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.time = wind;
    shader.vertexShader = "uniform float time;\n" + shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       #ifdef USE_INSTANCING
         vec3 ip = instanceMatrix[3].xyz;
         float sway = sin(time * 1.3 + ip.x * 0.25 + ip.z * 0.31) * 0.03 * max(position.y - 2.0, 0.0);
         transformed.x += sway; transformed.z += sway * 0.6;
       #endif`,
    );
  };
}

export function Forest({ trees, rocks, shadows, animate }: { trees: number; rocks: number; shadows: boolean; animate: boolean }) {
  const placements = useMemo(() => scatter(trees, 7), [trees]);
  const rockPlacements = useMemo(() => scatter(rocks, 99), [rocks]);
  const pines = placements.filter((p) => p.kind === 0);
  const broad = placements.filter((p) => p.kind === 1);

  const assets = useMemo(() => {
    // Non-indexed geometry with recomputed normals gives the faceted look without flatShading,
    // so every foliage material shares one shader program.
    const facet = <G extends BufferGeometry>(g: G) => {
      const out = g.index ? g.toNonIndexed() : g;
      out.deleteAttribute("uv");
      out.computeVertexNormals();
      return out;
    };
    const pine = facet(mergeGeometries([new ConeGeometry(1.5, 3.2, 7).translate(0, 3.4, 0), new ConeGeometry(1.15, 2.6, 7).translate(0, 4.9, 0), new ConeGeometry(0.75, 2, 7).translate(0, 6.2, 0)])!);
    const crown = facet(new IcosahedronGeometry(2, 1).scale(1, 0.9, 1).translate(0, 4.4, 0));
    const trunk = new CylinderGeometry(0.16, 0.26, 2.6, 6).translate(0, 1.3, 0);
    const rock = facet(new DodecahedronGeometry(1, 0));
    const leaf = new MeshStandardMaterial({ roughness: 0.9 });
    const leaf2 = new MeshStandardMaterial({ roughness: 0.85 });
    windify(leaf);
    windify(leaf2);
    const bark = new MeshStandardMaterial({ color: "#5a4632", roughness: 1 });
    const stone = new MeshStandardMaterial({ color: "#8c857a", roughness: 0.95 });
    return { pine, crown, trunk, rock, leaf, leaf2, bark, stone };
  }, []);

  useDispose(assets.pine, assets.crown, assets.trunk, assets.rock, assets.leaf, assets.leaf2, assets.bark, assets.stone);

  useFrame((_, dt) => {
    if (animate) wind.value += dt;
  });

  return (
    <group>
      <Instances geometry={assets.pine} material={assets.leaf} items={pines} shadows={shadows} tint={["#2d5a3a", "#3f6e3f"]} />
      <Instances geometry={assets.crown} material={assets.leaf2} items={broad} shadows={shadows} tint={["#5b8a3e", "#8a9a45"]} />
      <Instances geometry={assets.trunk} material={assets.bark} items={placements} shadows={shadows} />
      <Instances geometry={assets.rock} material={assets.stone} items={rockPlacements} shadows={shadows} rock />
    </group>
  );
}

function Instances({
  geometry,
  material,
  items,
  shadows,
  tint,
  rock,
}: {
  geometry: ConeGeometry | IcosahedronGeometry | CylinderGeometry | DodecahedronGeometry | ReturnType<typeof mergeGeometries>;
  material: MeshStandardMaterial;
  items: Placement[];
  shadows: boolean;
  tint?: [string, string];
  rock?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    const a = tint && new Color(tint[0]);
    const b = tint && new Color(tint[1]);
    const c = new Color();
    items.forEach((p, i) => {
      o.position.set(p.x, p.y - (rock ? 0.3 : 0.05), p.z);
      o.rotation.set(rock ? p.r : 0, p.r, 0);
      const s = rock ? p.s * 1.1 : p.s;
      o.scale.set(s, rock ? s * 0.6 : s * (0.9 + (p.r % 0.4)), s);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      if (a && b) mesh.setColorAt(i, c.copy(a).lerp(b, (p.r / (Math.PI * 2)) % 1));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, tint, rock]);
  return <instancedMesh ref={ref} args={[geometry!, material, items.length]} castShadow={shadows} receiveShadow={shadows} />;
}
