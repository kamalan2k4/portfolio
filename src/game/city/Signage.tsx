import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { CanvasTexture, Color, DoubleSide, InstancedBufferAttribute, type InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry, ShaderMaterial, SphereGeometry, SRGBColorSpace, UniformsLib, UniformsUtils } from "three";
import { profile } from "@/content/profile";
import { useDispose } from "@/world/scene/useDispose";
import { type Building, blockCenter, buildings, DISTRICT_BLOCKS, mulberry32 } from "./layout";
import { NEON } from "./palette";

/** Shared sign/beacon clock (module scope: frame updates must not mutate hook values). */
const signClock = { value: 0 };

type Face = { x: number; y: number; z: number; rot: number; w: number; h: number };

/** A point on one face of a building, pushed slightly out of the wall. */
function onFace(b: Building, face: number, y: number, w: number, h: number): Face {
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  const out = 0.12;
  switch (face) {
    case 0:
      return { x: b.maxX + out, y, z: cz, rot: Math.PI / 2, w, h };
    case 1:
      return { x: b.minX - out, y, z: cz, rot: -Math.PI / 2, w, h };
    case 2:
      return { x: cx, y, z: b.maxZ + out, rot: 0, w, h };
    default:
      return { x: cx, y, z: b.minZ - out, rot: Math.PI, w, h };
  }
}

const faceWidth = (b: Building, face: number) => (face < 2 ? b.maxZ - b.minZ : b.maxX - b.minX);

/** Animated neon signs scattered over the skyline: one instanced draw. */
export function NeonSigns({ animate }: { animate: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  const signs = useMemo(() => {
    const rnd = mulberry32(2026);
    const out: (Face & { color: number; seed: number })[] = [];
    for (const b of buildings) {
      if (b.bottom > 0 || b.top < 24 || rnd() > 0.34) continue;
      const face = Math.floor(rnd() * 4);
      const vertical = rnd() < 0.4;
      const w = Math.min(faceWidth(b, face) * 0.6, vertical ? 3.5 : 11);
      const h = vertical ? 9 + rnd() * 8 : 4 + rnd() * 3;
      const y = 7 + h / 2 + rnd() * Math.max(0, Math.min(b.top, 60) - h - 10);
      out.push({ ...onFace(b, face, y, w, h), color: Math.floor(rnd() * NEON.length), seed: rnd() * 100 });
    }
    return out;
  }, []);
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(1, 1);
    const data = new Float32Array(signs.length * 4);
    signs.forEach((s, i) => {
      const c = new Color(NEON[s.color]);
      data.set([c.r, c.g, c.b, s.seed], i * 4);
    });
    g.setAttribute("aSign", new InstancedBufferAttribute(data, 4));
    return g;
  }, [signs]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        fog: true,
        side: DoubleSide,
        uniforms: { ...UniformsUtils.merge([UniformsLib.fog]), time: signClock },
        vertexShader: /* glsl */ `
          attribute vec4 aSign;
          varying vec2 vUv;
          varying vec4 vSign;
          #include <fog_pars_vertex>
          void main() {
            vUv = uv;
            vSign = aSign;
            vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform float time;
          varying vec2 vUv;
          varying vec4 vSign;
          #include <fog_pars_fragment>
          void main() {
            float s = vSign.w;
            float kind = mod(floor(s), 3.0);
            float t = time + s;
            float pattern;
            if (kind < 0.5) pattern = step(0.5, fract(vUv.x * 6.0 - t * 0.6 + vUv.y * 2.0));            // scrolling chevrons
            else if (kind < 1.5) pattern = smoothstep(0.35, 0.3, abs(fract(vUv.y * 3.0 + t * 0.3) - 0.5)); // bars
            else pattern = 0.5 + 0.5 * sin(length(vUv - 0.5) * 30.0 - t * 4.0);                         // ripples
            float frame = 1.0 - step(0.05, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
            float pulse = 0.75 + 0.25 * sin(t * 2.3);
            vec3 col = vSign.rgb * (0.35 + 0.9 * pattern) * pulse + vSign.rgb * frame * 1.4;
            gl_FragColor = vec4(col * 1.6, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    [],
  );
  useDispose(geometry, material);
  useFrame((_, dt) => {
    if (animate) signClock.value += dt;
  });
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    signs.forEach((s, i) => {
      o.position.set(s.x, s.y, s.z);
      o.rotation.set(0, s.rot, 0);
      o.scale.set(s.w, s.h, 1);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [signs]);
  return <instancedMesh ref={ref} args={[geometry, material, signs.length]} />;
}

const ADS: { lines: [string, string]; color: string }[] = [
  { lines: [profile.name.toUpperCase(), "SOFTWARE ENGINEER"], color: "#25e6ff" },
  { lines: ["FULL-STACK · AI · CLOUD", "BUILT END TO END"], color: "#ff3df2" },
  { lines: ["VINATHI", "AI INTERVIEW COACH"], color: "#7dd3c0" },
  { lines: ["475+ PROBLEMS", "LEETCODE · JAVA"], color: "#ffb020" },
  { lines: ["HIRING?", "→ LAUNCH TERMINAL"], color: "#ff4d6d" },
  { lines: ["CSBROS COMPANION", "FREE · WIN / MAC"], color: "#ffb86b" },
];

function adTexture(lines: [string, string], color: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#05070d";
  g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = color;
  g.lineWidth = 14;
  g.strokeRect(18, 18, 988, 476);
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = color;
  g.shadowBlur = 30;
  g.font = "800 104px system-ui, sans-serif";
  g.fillText(lines[0], 512, 200, 940);
  g.font = "600 64px system-ui, sans-serif";
  g.fillStyle = "#ffffff";
  g.fillText(lines[1], 512, 340, 940);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Big billboards advertising the portfolio, facing the arrival plaza and the Nexus. */
export function PortfolioBillboards() {
  const placed = useMemo(() => {
    const targets = [blockCenter(...DISTRICT_BLOCKS.arrival), blockCenter(...DISTRICT_BLOCKS.nexus)];
    const used = new Set<Building>();
    const out: Face[] = [];
    ADS.forEach((_, k) => {
      const [tx, tz] = targets[k % 2];
      let best: { b: Building; face: number; d: number } | null = null;
      for (const b of buildings) {
        if (used.has(b) || b.bottom > 0 || b.top < 30) continue;
        const cx = (b.minX + b.maxX) / 2;
        const cz = (b.minZ + b.maxZ) / 2;
        const d = Math.hypot(cx - tx, cz - tz);
        if (d < 30 || d > 95) continue;
        // The face whose outward normal points most toward the plaza.
        const dx = tx - cx;
        const dz = tz - cz;
        const face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 0 : 1) : dz > 0 ? 2 : 3;
        if (faceWidth(b, face) < 14) continue;
        if (!best || d < best.d) best = { b, face, d };
      }
      if (!best) return;
      used.add(best.b);
      out.push(onFace(best.b, best.face, 18 + (k % 3) * 2, 16, 8));
    });
    return out;
  }, []);
  const materials = useMemo(() => ADS.slice(0, placed.length).map((ad) => new MeshBasicMaterial({ map: adTexture(ad.lines, ad.color), toneMapped: false })), [placed.length]);
  useDispose(...materials, ...materials.map((m) => m.map));
  return (
    <group>
      {placed.map((f, i) => (
        <mesh key={i} position={[f.x, f.y, f.z]} rotation-y={f.rot} material={materials[i]}>
          <planeGeometry args={[f.w, f.h]} />
        </mesh>
      ))}
    </group>
  );
}

/** Red aviation lights blinking on the tallest towers. */
export function AviationLights() {
  const ref = useRef<InstancedMesh>(null);
  const tops = useMemo(() => buildings.filter((b) => b.top > 85), []);
  const assets = useMemo(() => {
    const geometry = new SphereGeometry(0.45, 8, 6);
    geometry.setAttribute("aPhase", new InstancedBufferAttribute(new Float32Array(tops.map((_, i) => (i * 0.37) % 1)), 1));
    const material = new ShaderMaterial({
      uniforms: { time: signClock },
      vertexShader: `attribute float aPhase; varying float vPhase;
        void main() { vPhase = aPhase; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float time; varying float vPhase;
        void main() { float on = step(0.6, fract(time * 0.6 + vPhase)); gl_FragColor = vec4(vec3(1.0, 0.12, 0.1) * (0.25 + 2.5 * on), 1.0); }`,
    });
    return { geometry, material };
  }, [tops]);
  useDispose(assets.geometry, assets.material);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    tops.forEach((b, i) => {
      o.position.set((b.minX + b.maxX) / 2, b.top + 0.6, (b.minZ + b.maxZ) / 2);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [tops]);
  return <instancedMesh ref={ref} args={[assets.geometry, assets.material, tops.length]} />;
}
