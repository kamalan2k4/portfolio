import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { AdditiveBlending, BufferGeometry, DoubleSide, Float32BufferAttribute, ShaderMaterial, UniformsLib, UniformsUtils } from "three";
import { river, RIVER_HALF_WIDTH, WATER_LEVEL, type Vec2 } from "../terrain";
import { COLORS, SUN_DIR } from "./palette";
import { useDispose } from "./useDispose";

/** Shared water clock (module scope so frame updates don't mutate hook values). */
const flow = { value: 0 };

function riverGeometry(pts: Vec2[], halfWidth: number) {
  // Resample the polyline every ~1 unit, then extrude sideways.
  const dense: Vec2[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const n = Math.ceil(Math.hypot(bx - ax, bz - az));
    for (let j = 0; j < n; j++) dense.push([ax + ((bx - ax) * j) / n, az + ((bz - az) * j) / n]);
  }
  dense.push(pts[pts.length - 1]);
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  let dist = 0;
  for (let i = 0; i < dense.length; i++) {
    const p = dense[i];
    const q = dense[Math.min(i + 1, dense.length - 1)];
    const o = dense[Math.max(i - 1, 0)];
    const tx = q[0] - o[0];
    const tz = q[1] - o[1];
    const tl = Math.hypot(tx, tz) || 1;
    if (i > 0) dist += Math.hypot(p[0] - dense[i - 1][0], p[1] - dense[i - 1][1]);
    // Widen at the source pool.
    const w = halfWidth * (i < 6 ? 1.7 - i * 0.1 : 1);
    for (const s of [-1, 1]) {
      verts.push(p[0] + (-tz / tl) * w * s, WATER_LEVEL, p[1] + (tx / tl) * w * s);
      uvs.push(dist, s * 0.5 + 0.5);
    }
    if (i < dense.length - 1) {
      const k = i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(verts, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const noiseGlsl = /* glsl */ `
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
`;

export function River({ animate }: { animate: boolean }) {
  const geometry = useMemo(() => riverGeometry(river, RIVER_HALF_WIDTH + 1.6), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        fog: true,
        uniforms: {
          ...UniformsUtils.merge([
          UniformsLib.fog,
          {
            deep: { value: COLORS.aqua.clone().multiplyScalar(0.35) },
            sky: { value: COLORS.horizon },
            zenith: { value: COLORS.zenith },
            sunDir: { value: SUN_DIR },
          },
          ]),
          time: flow,
        },
        vertexShader: /* glsl */ `
          #include <fog_pars_vertex>
          varying vec2 vUv; varying vec3 vWorld;
          void main() {
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorld = wp.xyz;
            vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          #include <fog_pars_fragment>
          uniform float time; uniform vec3 deep, sky, zenith, sunDir;
          varying vec2 vUv; varying vec3 vWorld;
          ${noiseGlsl}
          void main() {
            vec2 flow = vec2(vUv.x * 0.35 - time * 0.6, vUv.y * 2.0);
            float n = vnoise(flow * 3.0) * 0.6 + vnoise(flow * 7.0 + 3.1) * 0.4;
            vec3 nrm = normalize(vec3((n - 0.5) * 0.35, 1.0, (vnoise(flow * 5.0 + 9.0) - 0.5) * 0.35));
            vec3 v = normalize(cameraPosition - vWorld);
            float fres = pow(1.0 - max(dot(v, nrm), 0.0), 3.0);
            vec3 refl = mix(sky, zenith, clamp(reflect(-v, nrm).y, 0.0, 1.0));
            vec3 col = mix(deep, refl, 0.25 + fres * 0.65);
            float spec = pow(max(dot(reflect(-sunDir, nrm), v), 0.0), 120.0);
            col += vec3(1.0, 0.9, 0.7) * spec * 1.6;
            float edge = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
            col = mix(col * 1.15 + 0.05, col, edge);
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
    if (animate) flow.value += dt;
  });
  return <mesh geometry={geometry} material={material} />;
}

/** Waterfall sheet tumbling off the Knowledge Falls cliff, plus spray at the base. */
export function Waterfall() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        uniforms: { time: flow },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float time; varying vec2 vUv;
          ${noiseGlsl}
          void main() {
            float streak = vnoise(vec2(vUv.x * 18.0, vUv.y * 2.5 + time * 2.2));
            streak = smoothstep(0.35, 0.95, streak);
            float side = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
            vec3 col = mix(vec3(0.62, 0.82, 0.8), vec3(0.96, 0.98, 0.97), streak);
            gl_FragColor = vec4(col, (0.55 + streak * 0.4) * side);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const spray = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { time: flow },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float time; varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            float a = smoothstep(1.0, 0.0, d) * (0.18 + 0.05 * sin(time * 3.0));
            gl_FragColor = vec4(vec3(0.85, 0.95, 0.95) * a, a);
          }`,
      }),
    [],
  );
  useDispose(material, spray);
  return (
    <group position={[-59.5, 0, -14]} rotation-y={Math.PI / 2}>
      <mesh material={material} position={[0, 7.2, 0]} rotation-x={-0.12}>
        <planeGeometry args={[6, 15.5, 1, 1]} />
      </mesh>
      <mesh material={spray} position={[0, 0.6, 1.6]} rotation-x={-Math.PI / 2.3}>
        <planeGeometry args={[11, 6]} />
      </mesh>
    </group>
  );
}
