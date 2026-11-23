import { useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, Color, InstancedBufferAttribute, type InstancedMesh, Object3D, ShaderMaterial, UniformsLib, UniformsUtils } from "three";
import { useDispose } from "@/world/scene/useDispose";
import { buildings } from "./layout";
import { MOON_DIR } from "./palette";

const TINTS = ["#141a26", "#1a1f2c", "#201f26", "#131e26", "#24262f", "#1c1824"].map((c) => new Color(c));

/**
 * Every tower in one instanced draw. The shader draws procedural, anti-aliased windows
 * (randomly lit, warm or cool), reflective dark glass, glowing storefronts and rooftops.
 */
export function Buildings() {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => {
    const g = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    g.deleteAttribute("uv");
    const info = new Float32Array(buildings.length * 4);
    buildings.forEach((b, i) => info.set([b.tint, b.lit, b.seed % 997, b.bottom], i * 4));
    g.setAttribute("aInfo", new InstancedBufferAttribute(info, 4));
    return g;
  }, []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        fog: true,
        uniforms: UniformsUtils.merge([UniformsLib.fog, { tints: { value: TINTS }, moonDir: { value: MOON_DIR } }]),
        vertexShader: /* glsl */ `
          attribute vec4 aInfo;
          varying vec3 vWorld;
          varying vec3 vN;
          varying vec4 vInfo;
          #include <fog_pars_vertex>
          void main() {
            vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
            vWorld = wp.xyz;
            vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
            vInfo = aInfo;
            vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 tints[6];
          uniform vec3 moonDir;
          varying vec3 vWorld;
          varying vec3 vN;
          varying vec4 vInfo;
          #include <fog_pars_fragment>
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          void main() {
            vec3 n = normalize(vN);
            vec3 base = tints[int(vInfo.x + 0.5)];
            float shade = 0.35 + 0.5 * max(dot(n, moonDir), 0.0) + 0.2 * n.y;
            vec3 col = base * shade;
            if (abs(n.y) < 0.5) {
              float u = abs(n.x) > 0.5 ? vWorld.z : vWorld.x;
              vec2 g = vec2(u / 1.9, vWorld.y / 3.4);
              vec2 cell = floor(g);
              vec2 f = fract(g);
              vec2 w = fwidth(g);
              float mx = smoothstep(0.16 - w.x, 0.16 + w.x, f.x) * (1.0 - smoothstep(0.84 - w.x, 0.84 + w.x, f.x));
              float my = smoothstep(0.26 - w.y, 0.26 + w.y, f.y) * (1.0 - smoothstep(0.88 - w.y, 0.88 + w.y, f.y));
              float win = mx * my;
              // Whole floors tend to be lit or dark together, with individual exceptions.
              float floorLit = hash(vec2(cell.y, vInfo.z));
              float r = mix(hash(cell + vInfo.z), floorLit, 0.55);
              float on = step(r, vInfo.y * 0.62);
              float tone = hash(cell * 1.7 + vInfo.z);
              vec3 lamp = tone < 0.62 ? vec3(1.0, 0.68, 0.38) : tone < 0.9 ? vec3(0.55, 0.78, 1.0) : vec3(0.9, 0.92, 1.0);
              lamp *= 0.55 + 1.3 * hash(cell + 9.0);
              vec3 glass = mix(vec3(0.015, 0.025, 0.05), vec3(0.07, 0.09, 0.18), clamp(vWorld.y / 220.0, 0.0, 1.0)) + vec3(0.05, 0.04, 0.08) * pow(1.0 - abs(f.x - 0.5) * 2.0, 6.0);
              vec3 winCol = mix(glass, lamp, on);
              // Far away, average the pattern instead of shimmering.
              float far = smoothstep(0.22, 0.55, max(w.x, w.y));
              win = mix(win, 0.5, far);
              winCol = mix(winCol, mix(glass, vec3(1.0, 0.72, 0.45), vInfo.y * 0.35), far);
              // Floor slabs.
              col *= 1.0 - 0.35 * (1.0 - smoothstep(0.0, 0.06 + w.y, f.y)) * (1.0 - far);
              // Ground-floor storefronts glow (only on buildings that start at street level).
              float store = (1.0 - step(0.5, vInfo.w)) * (1.0 - smoothstep(3.6, 4.2, vWorld.y)) * step(0.7, vWorld.y);
              col = mix(col, winCol, win * (1.0 - store));
              col = mix(col, mix(vec3(1.0, 0.55, 0.3), vec3(0.3, 0.8, 1.0), step(0.5, hash(cell.xx + vInfo.z))) * (0.35 + 0.9 * hash(cell.xx * 3.1)), store * 0.7 * win);
            } else if (n.y > 0.5) {
              col = base * 0.45 + vec3(0.02);
            }
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    [],
  );
  useDispose(geometry, material);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    buildings.forEach((b, i) => {
      o.position.set((b.minX + b.maxX) / 2, b.bottom, (b.minZ + b.maxZ) / 2);
      o.scale.set(b.maxX - b.minX, b.top - b.bottom, b.maxZ - b.minZ);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  return <instancedMesh ref={ref} args={[geometry, material, buildings.length]} />;
}
