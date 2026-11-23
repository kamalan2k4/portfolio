import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, ConeGeometry, CylinderGeometry, type InstancedMesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, ShaderMaterial, SphereGeometry, UniformsLib, UniformsUtils } from "three";
import { useDispose } from "@/world/scene/useDispose";
import { BLOCK, blockCenter, blockKind, ISLAND, LANE, mulberry32, N, PARK_BLOCKS, PITCH, streetLines } from "./layout";
import { MOON_DIR, NIGHT } from "./palette";

const KIND_CODE = { city: 0, park: 1, district: 2 } as const;
const kinds = Array.from({ length: (2 * N + 1) ** 2 }, (_, k) => KIND_CODE[blockKind(Math.floor(k / (2 * N + 1)) - N, (k % (2 * N + 1)) - N)]);

/** Streets, sidewalks, parks and plazas for the whole island in one shader. */
export function Ground() {
  const geometry = useMemo(() => new PlaneGeometry(ISLAND * 2, ISLAND * 2).rotateX(-Math.PI / 2), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        fog: true,
        uniforms: UniformsUtils.merge([UniformsLib.fog, { kinds: { value: kinds }, pitch: { value: PITCH }, block: { value: BLOCK }, lane: { value: LANE } }]),
        vertexShader: /* glsl */ `
          varying vec2 vXZ;
          #include <fog_pars_vertex>
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vXZ = wp.xz;
            vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform float kinds[${kinds.length}];
          uniform float pitch, block, lane;
          varying vec2 vXZ;
          #include <fog_pars_fragment>
          float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          float aa(float d, float w) { float f = fwidth(d); return 1.0 - smoothstep(w - f, w + f, abs(d)); }
          void main() {
            vec2 bi = floor(vXZ / pitch + 0.5);
            vec2 local = vXZ - bi * pitch;
            float half_ = block * 0.5;
            bool inBlock = abs(local.x) < half_ && abs(local.y) < half_;
            vec3 col;
            float grain = (hash(floor(vXZ * 9.0)) * 0.5 + hash(floor(vXZ * 2.3)) * 0.5) * 0.018;
            if (inBlock) {
              int idx = int((bi.x + ${N}.0) * ${2 * N + 1}.0 + (bi.y + ${N}.0));
              float kind = (bi.x >= -${N}.0 && bi.x <= ${N}.0 && bi.y >= -${N}.0 && bi.y <= ${N}.0) ? kinds[idx] : 0.0;
              float edge = half_ - max(abs(local.x), abs(local.y));
              // Sidewalk with slab joints.
              vec2 slab = fract(vXZ / 2.0);
              col = vec3(0.24, 0.24, 0.27) + grain - 0.04 * max(aa(slab.x, 0.02), aa(slab.y, 0.02));
              col = mix(col, vec3(0.42, 0.42, 0.44), aa(edge - 0.15, 0.15)); // curb
              if (kind > 0.5 && kind < 1.5 && edge > 3.0) {
                col = vec3(0.06, 0.14, 0.08) + grain * 2.0; // park grass
                float path = min(abs(local.x), abs(local.y));
                col = mix(col, vec3(0.3, 0.28, 0.25), aa(path, 1.4));
              }
              if (kind > 1.5 && edge > 2.0) {
                vec2 tile = fract(vXZ / 3.0);
                col = vec3(0.33, 0.32, 0.36) + grain - 0.05 * max(aa(tile.x, 0.03), aa(tile.y, 0.03));
              }
            } else {
              col = vec3(0.075, 0.078, 0.09) + grain;
              bool alongX = abs(local.y) >= half_;
              bool alongZ = abs(local.x) >= half_;
              if (alongX != alongZ) {
                // Distance across the street from its centreline, and along it.
                float along = alongX ? vXZ.x : vXZ.y;
                float acrossLocal = alongX ? local.y : local.x;
                float c = abs(acrossLocal) - pitch * 0.5;
                // Double yellow centre line.
                col = mix(col, vec3(0.85, 0.65, 0.12), aa(abs(c) - 0.18, 0.07));
                // Dashed white lane dividers.
                float dash = step(0.5, fract(along / 6.0));
                col = mix(col, vec3(0.8), aa(abs(c) - lane, 0.08) * dash);
                // Crosswalks next to intersections.
                float toCorner = half_ - abs(alongX ? local.x : local.y);
                float zebra = step(0.5, fract(acrossLocal / 1.2));
                col = mix(col, vec3(0.75), step(toCorner, 2.6) * step(0.4, toCorner) * zebra);
              }
            }
            // Warm pools under the corner streetlights.
            vec2 corner = abs(local) - vec2(half_ - 0.9);
            float pool = exp(-dot(corner, corner) / 30.0);
            col += vec3(1.0, 0.72, 0.42) * pool * 0.35;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    [],
  );
  useDispose(geometry, material);
  return <mesh geometry={geometry} material={material} />;
}

/** Shared water clock (module scope: frame updates must not mutate hook values). */
const tide = { value: 0 };

/** The harbour around the island: dark water with moonlight and city-glow reflections. */
export function Harbor({ animate }: { animate: boolean }) {
  const geometry = useMemo(() => new PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        fog: true,
        uniforms: { ...UniformsUtils.merge([UniformsLib.fog, { moonDir: { value: MOON_DIR }, horizon: { value: NIGHT.horizon }, glow: { value: NIGHT.glow } }]), time: tide },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          #include <fog_pars_vertex>
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorld = wp.xyz;
            vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform float time;
          uniform vec3 moonDir, horizon, glow;
          varying vec3 vWorld;
          #include <fog_pars_fragment>
          float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
          void main() {
            vec2 p = vWorld.xz * 0.06;
            float n = vn(p + time * 0.15) * 0.6 + vn(p * 2.3 - time * 0.2) * 0.4;
            vec3 nrm = normalize(vec3((n - 0.5) * 0.5, 1.0, (vn(p * 1.7 + 4.0 + time * 0.1) - 0.5) * 0.5));
            vec3 v = normalize(cameraPosition - vWorld);
            float fres = pow(1.0 - max(dot(v, nrm), 0.0), 4.0);
            vec3 col = mix(vec3(0.01, 0.02, 0.05), horizon * 0.6 + glow * 0.12, fres);
            float spec = pow(max(dot(reflect(-moonDir, nrm), v), 0.0), 200.0);
            col += vec3(0.8, 0.9, 1.0) * spec * 2.0;
            // Shimmering streaks of city light near the island.
            float shore = max(abs(vWorld.x), abs(vWorld.z));
            col += vec3(1.0, 0.6, 0.35) * step(0.92, vn(vec2(vWorld.x * 0.4, vWorld.z * 0.02 + time))) * exp(-(shore - ${ISLAND.toFixed(1)}) / 60.0) * 0.4;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    [],
  );
  useDispose(geometry, material);
  useFrame((_, dt) => {
    if (animate) tide.value += dt;
  });
  return <mesh geometry={geometry} material={material} position={[0, -1.4, 0]} />;
}

/** Seawall around the island, with a glowing railing line. */
export function Seawall() {
  const sides = useMemo(
    () => [
      { p: [0, -0.7, ISLAND] as const, s: [ISLAND * 2 + 2, 1.6, 2] as const },
      { p: [0, -0.7, -ISLAND] as const, s: [ISLAND * 2 + 2, 1.6, 2] as const },
      { p: [ISLAND, -0.7, 0] as const, s: [2, 1.6, ISLAND * 2 + 2] as const },
      { p: [-ISLAND, -0.7, 0] as const, s: [2, 1.6, ISLAND * 2 + 2] as const },
    ],
    [],
  );
  return (
    <group>
      {sides.map((side, i) => (
        <group key={i}>
          <mesh position={[side.p[0], side.p[1], side.p[2]]}>
            <boxGeometry args={[side.s[0], side.s[1], side.s[2]]} />
            <meshStandardMaterial color="#2a2d36" roughness={0.9} />
          </mesh>
          <mesh position={[side.p[0], 0.55, side.p[2]]}>
            <boxGeometry args={[side.s[0] === 2 ? 0.12 : side.s[0], 0.06, side.s[2] === 2 ? 0.12 : side.s[2]]} />
            <meshBasicMaterial color="#25e6ff" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Streetlights at every intersection corner: two instanced draws (poles, lamps). */
export function StreetLights() {
  const poles = useRef<InstancedMesh>(null);
  const lamps = useRef<InstancedMesh>(null);
  const spots = useMemo(() => {
    const out: [number, number][] = [];
    // On the sidewalk at two opposite corners of every intersection.
    const offset = (PITCH - BLOCK) / 2 + 0.9;
    for (const x of streetLines) for (const z of streetLines) for (const s of [1, -1]) out.push([x + s * offset, z + s * offset]);
    return out.filter(([x, z]) => Math.abs(x) < ISLAND - 2 && Math.abs(z) < ISLAND - 2);
  }, []);
  const assets = useMemo(
    () => ({
      pole: new CylinderGeometry(0.09, 0.14, 7, 6).translate(0, 3.5, 0),
      lamp: new SphereGeometry(0.32, 10, 8).translate(0, 7.1, 0),
      poleMat: new MeshStandardMaterial({ color: "#3a3f4a", roughness: 0.6, metalness: 0.4 }),
      lampMat: new MeshBasicMaterial({ color: "#ffd9a0", toneMapped: false }),
    }),
    [],
  );
  useDispose(assets.pole, assets.lamp, assets.poleMat, assets.lampMat);
  useLayoutEffect(() => {
    const o = new Object3D();
    spots.forEach(([x, z], i) => {
      o.position.set(x, 0, z);
      o.updateMatrix();
      poles.current?.setMatrixAt(i, o.matrix);
      lamps.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [poles.current, lamps.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    }
  }, [spots]);
  return (
    <group>
      <instancedMesh ref={poles} args={[assets.pole, assets.poleMat, spots.length]} />
      <instancedMesh ref={lamps} args={[assets.lamp, assets.lampMat, spots.length]} />
    </group>
  );
}

/** Trees in the park blocks. */
export function ParkTrees() {
  const crowns = useRef<InstancedMesh>(null);
  const trunks = useRef<InstancedMesh>(null);
  const spots = useMemo(() => {
    const rnd = mulberry32(42);
    const out: [number, number, number][] = [];
    for (const [i, j] of PARK_BLOCKS) {
      const [cx, cz] = blockCenter(i, j);
      for (let k = 0; k < 26; k++) {
        const x = cx + (rnd() - 0.5) * (BLOCK - 8);
        const z = cz + (rnd() - 0.5) * (BLOCK - 8);
        if (Math.min(Math.abs(x - cx), Math.abs(z - cz)) < 2.5) continue; // keep the paths clear
        out.push([x, z, 0.8 + rnd() * 0.6]);
      }
    }
    return out;
  }, []);
  const assets = useMemo(
    () => ({
      crown: new ConeGeometry(1.8, 4.5, 7).translate(0, 4.6, 0),
      trunk: new BoxGeometry(0.3, 2.6, 0.3).translate(0, 1.3, 0),
      leaf: new MeshStandardMaterial({ color: "#1f4d2c", roughness: 0.9 }),
      bark: new MeshStandardMaterial({ color: "#3b2c22", roughness: 1 }),
    }),
    [],
  );
  useDispose(assets.crown, assets.trunk, assets.leaf, assets.bark);
  useLayoutEffect(() => {
    const o = new Object3D();
    spots.forEach(([x, z, s], i) => {
      o.position.set(x, 0, z);
      o.scale.setScalar(s);
      o.updateMatrix();
      crowns.current?.setMatrixAt(i, o.matrix);
      trunks.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [crowns.current, trunks.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    }
  }, [spots]);
  return (
    <group>
      <instancedMesh ref={crowns} args={[assets.crown, assets.leaf, spots.length]} />
      <instancedMesh ref={trunks} args={[assets.trunk, assets.bark, spots.length]} />
    </group>
  );
}
