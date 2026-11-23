import { useMemo } from "react";
import { BackSide, ShaderMaterial } from "three";
import { useDispose } from "@/world/scene/useDispose";
import { MOON_DIR, NIGHT } from "./palette";

/** Night sky dome: deep gradient, city-glow horizon, procedural stars and a moon. */
export function NightSky() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { zenith: { value: NIGHT.zenith }, horizon: { value: NIGHT.horizon }, glow: { value: NIGHT.glow }, moon: { value: NIGHT.moon }, moonDir: { value: MOON_DIR } },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 zenith, horizon, glow, moon, moonDir;
          varying vec3 vDir;
          float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
          void main() {
            vec3 d = normalize(vDir);
            float h = clamp(d.y, -0.2, 1.0);
            vec3 col = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.55));
            // Light pollution from the city on the horizon.
            col += glow * 0.35 * exp(-max(h, 0.0) * 14.0);
            // Stars, fading toward the glowing horizon.
            vec3 cell = floor(d * 380.0);
            float star = step(0.9975, hash(cell)) * smoothstep(0.08, 0.4, h);
            col += vec3(0.9, 0.95, 1.0) * star * (0.5 + 0.5 * hash(cell + 3.1));
            // Moon disc and halo.
            float m = max(dot(d, moonDir), 0.0);
            col += moon * (smoothstep(0.9993, 0.9996, m) * 1.6 + pow(m, 120.0) * 0.25 + pow(m, 10.0) * 0.05);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useDispose(material);
  return (
    <mesh material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[1500, 32, 16]} />
    </mesh>
  );
}
